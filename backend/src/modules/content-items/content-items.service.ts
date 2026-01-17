import prisma from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ErrorCodes } from '../../utils/responses.js';
import { Prisma } from '@prisma/client';
import type {
  CreateContentItemInput,
  UpdateContentItemInput,
  ListContentItemsQuery,
} from './content-items.schema.js';

// Calculate project week from project start date and content date
function calculateProjectWeek(projectStartDate: Date, dateOccurred: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diff = dateOccurred.getTime() - projectStartDate.getTime();
  return Math.floor(diff / msPerWeek) + 1;
}

// List content items with filters and pagination
export const listContentItems = async (
  organizationId: number,
  query: ListContentItemsQuery
) => {
  const {
    page,
    limit,
    projectId,
    planItemId,
    contentTypeId,
    activityTypeId,
    sourceType,
    processingStatus,
    startDate,
    endDate,
    search,
  } = query;

  const where: Record<string, unknown> = {
    isActive: true,
    project: {
      organizationId,
      isActive: true,
    },
  };

  if (projectId) {
    where.projectId = projectId;
  }

  if (planItemId) {
    where.planItemIds = { has: planItemId };
  }

  if (contentTypeId) {
    where.contentTypeIds = { has: contentTypeId };
  }

  if (activityTypeId) {
    where.activityTypeIds = { has: activityTypeId };
  }

  if (sourceType) {
    where.sourceType = sourceType;
  }

  if (processingStatus) {
    where.processingStatus = processingStatus;
  }

  if (startDate || endDate) {
    where.dateOccurred = {};
    if (startDate) {
      (where.dateOccurred as Record<string, Date>).gte = startDate;
    }
    if (endDate) {
      (where.dateOccurred as Record<string, Date>).lte = endDate;
    }
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { rawContent: { contains: search, mode: 'insensitive' } },
      { aiSummary: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.contentItem.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { dateOccurred: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contentItem.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Get content items for a specific project
export const getProjectContent = async (
  projectId: string,
  organizationId: number,
  query: ListContentItemsQuery
) => {
  // Verify project belongs to organization
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId,
      isActive: true,
    },
  });

  if (!project) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Project not found', 404);
  }

  return listContentItems(organizationId, { ...query, projectId });
};

// Get a single content item by ID
export const getContentItem = async (id: string, organizationId: number) => {
  const item = await prisma.contentItem.findFirst({
    where: {
      id,
      isActive: true,
      project: {
        organizationId,
        isActive: true,
      },
    },
    include: {
      project: {
        select: { id: true, name: true, startDate: true },
      },
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      children: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!item) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Content item not found', 404);
  }

  return item;
};

// Create a new content item
export const createContentItem = async (
  organizationId: number,
  input: CreateContentItemInput,
  userId?: number
) => {
  // Verify project belongs to organization
  const project = await prisma.project.findFirst({
    where: {
      id: input.projectId,
      organizationId,
      isActive: true,
    },
  });

  if (!project) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Project not found', 404);
  }

  // Verify plan items exist if provided
  if (input.planItemIds.length > 0) {
    const planItemCount = await prisma.planItem.count({
      where: {
        id: { in: input.planItemIds },
        projectId: input.projectId,
        isActive: true,
      },
    });

    if (planItemCount !== input.planItemIds.length) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'One or more plan items not found', 400);
    }
  }

  // Verify content types exist if provided
  if (input.contentTypeIds.length > 0) {
    const typeCount = await prisma.contentType.count({
      where: {
        id: { in: input.contentTypeIds },
        isActive: true,
        OR: [
          { organizationId: null },
          { organizationId },
        ],
      },
    });

    if (typeCount !== input.contentTypeIds.length) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'One or more content types not found', 400);
    }
  }

  // Verify activity types exist if provided
  if (input.activityTypeIds.length > 0) {
    const typeCount = await prisma.activityItemType.count({
      where: {
        id: { in: input.activityTypeIds },
        isActive: true,
        OR: [
          { organizationId: null },
          { organizationId },
        ],
      },
    });

    if (typeCount !== input.activityTypeIds.length) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'One or more activity types not found', 400);
    }
  }

  // Calculate project week
  const projectWeek = calculateProjectWeek(project.startDate, input.dateOccurred);

  const item = await prisma.contentItem.create({
    data: {
      projectId: input.projectId,
      planItemIds: input.planItemIds,
      contentTypeIds: input.contentTypeIds,
      activityTypeIds: input.activityTypeIds,
      sourceType: input.sourceType,
      title: input.title,
      dateOccurred: input.dateOccurred,
      projectWeek,
      tags: input.tags,
      rawContent: input.rawContent,
      fileReference: input.fileReference,
      fileName: input.fileName,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      createdByUserId: userId,
      processingStatus: 'pending',
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });

  return item;
};

// Update a content item
export const updateContentItem = async (
  id: string,
  organizationId: number,
  input: UpdateContentItemInput
) => {
  const existing = await prisma.contentItem.findFirst({
    where: {
      id,
      isActive: true,
      project: {
        organizationId,
        isActive: true,
      },
    },
    include: {
      project: {
        select: { startDate: true },
      },
    },
  });

  if (!existing) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Content item not found', 404);
  }

  // Calculate project week if date changed
  let projectWeek = existing.projectWeek;
  if (input.dateOccurred) {
    projectWeek = calculateProjectWeek(existing.project.startDate, input.dateOccurred);
  }

  // Build update data explicitly
  const updateData: Prisma.ContentItemUpdateInput = { projectWeek };

  if (input.planItemIds !== undefined) updateData.planItemIds = input.planItemIds;
  if (input.contentTypeIds !== undefined) updateData.contentTypeIds = input.contentTypeIds;
  if (input.activityTypeIds !== undefined) updateData.activityTypeIds = input.activityTypeIds;
  if (input.title !== undefined) updateData.title = input.title;
  if (input.dateOccurred !== undefined) updateData.dateOccurred = input.dateOccurred;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.rawContent !== undefined) updateData.rawContent = input.rawContent;
  if (input.aiSummary !== undefined) updateData.aiSummary = input.aiSummary;
  if (input.aiExtractedEntities !== undefined) {
    updateData.aiExtractedEntities = input.aiExtractedEntities as Prisma.InputJsonValue;
  }
  if (input.processingStatus !== undefined) updateData.processingStatus = input.processingStatus;

  const item = await prisma.contentItem.update({
    where: { id },
    data: updateData,
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });

  return item;
};

// Soft delete a content item
export const deleteContentItem = async (id: string, organizationId: number) => {
  const existing = await prisma.contentItem.findFirst({
    where: {
      id,
      isActive: true,
      project: {
        organizationId,
        isActive: true,
      },
    },
  });

  if (!existing) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Content item not found', 404);
  }

  await prisma.contentItem.update({
    where: { id },
    data: { isActive: false },
  });

  return { message: 'Content item deleted successfully' };
};

// Get all content types (global + org-specific)
export const getContentTypes = async (organizationId: number) => {
  const types = await prisma.contentType.findMany({
    where: {
      isActive: true,
      OR: [
        { organizationId: null },
        { organizationId },
      ],
    },
    orderBy: [
      { isSystem: 'desc' },
      { name: 'asc' },
    ],
  });

  return types;
};

// Get all activity item types (global + org-specific)
export const getActivityItemTypes = async (organizationId: number) => {
  const types = await prisma.activityItemType.findMany({
    where: {
      isActive: true,
      OR: [
        { organizationId: null },
        { organizationId },
      ],
    },
    orderBy: [
      { isSystem: 'desc' },
      { name: 'asc' },
    ],
  });

  return types;
};
