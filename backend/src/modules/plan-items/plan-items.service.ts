import prisma from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ErrorCodes } from '../../utils/responses.js';
import type {
  CreatePlanItemInput,
  UpdatePlanItemInput,
  ListPlanItemsQuery,
  BulkUpdateInput,
} from './plan-items.schema.js';

// Helper to build tree structure from flat list
const buildTree = (items: any[], parentId: string | null = null): any[] => {
  return items
    .filter(item => item.parentId === parentId)
    .map(item => ({
      ...item,
      children: buildTree(items, item.id),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
};

// Calculate path and depth based on parent
const calculatePathAndDepth = async (parentId: string | null): Promise<{ path: string; depth: number }> => {
  if (!parentId) {
    return { path: '', depth: 0 };
  }

  const parent = await prisma.planItem.findUnique({
    where: { id: parentId },
    select: { path: true, depth: true, id: true },
  });

  if (!parent) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Parent plan item not found', 404);
  }

  return {
    path: parent.path ? `${parent.path}/${parent.id}` : `/${parent.id}`,
    depth: parent.depth + 1,
  };
};

// Get full plan tree for a project
export const getProjectPlan = async (projectId: string, organizationId: number, query: ListPlanItemsQuery) => {
  // Verify project belongs to organization
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId, isActive: true },
  });

  if (!project) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Project not found', 404);
  }

  const where: any = {
    projectId,
    isActive: true,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.itemTypeId) {
    where.itemTypeId = query.itemTypeId;
  }

  const items = await prisma.planItem.findMany({
    where,
    include: {
      itemType: {
        select: { id: true, name: true, slug: true, level: true, icon: true, color: true },
      },
    },
    orderBy: [{ depth: 'asc' }, { sortOrder: 'asc' }],
  });

  // Build tree structure
  const tree = buildTree(items);

  return { items: tree, total: items.length };
};

// Get a single plan item with children
export const getPlanItemById = async (id: string, organizationId: number) => {
  const item = await prisma.planItem.findFirst({
    where: { id, isActive: true },
    include: {
      project: { select: { organizationId: true } },
      itemType: {
        select: { id: true, name: true, slug: true, level: true, icon: true, color: true },
      },
      children: {
        where: { isActive: true },
        include: {
          itemType: {
            select: { id: true, name: true, slug: true, level: true, icon: true, color: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!item) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Plan item not found', 404);
  }

  // Verify organization access
  if (item.project.organizationId !== organizationId) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Access denied', 403);
  }

  // Remove project from response
  const { project, ...itemData } = item;
  return itemData;
};

// Create a new plan item
export const createPlanItem = async (
  projectId: string,
  organizationId: number,
  input: CreatePlanItemInput,
  userId?: number,
  userEmail?: string
) => {
  // Verify project belongs to organization
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId, isActive: true },
  });

  if (!project) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Project not found', 404);
  }

  // Verify parent exists if specified
  if (input.parentId) {
    const parent = await prisma.planItem.findFirst({
      where: { id: input.parentId, projectId, isActive: true },
    });
    if (!parent) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Parent plan item not found', 404);
    }
  }

  // Verify item type exists
  const itemType = await prisma.planItemType.findUnique({
    where: { id: input.itemTypeId },
  });

  if (!itemType) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Plan item type not found', 404);
  }

  // Calculate path and depth
  const { path, depth } = await calculatePathAndDepth(input.parentId || null);

  const item = await prisma.planItem.create({
    data: {
      projectId,
      parentId: input.parentId || null,
      itemTypeId: input.itemTypeId,
      name: input.name,
      description: input.description,
      owner: input.owner,
      status: input.status || 'not_started',
      startDate: input.startDate,
      targetEndDate: input.targetEndDate,
      actualStartDate: input.actualStartDate,
      actualEndDate: input.actualEndDate,
      notes: input.notes,
      references: input.references || [],
      sortOrder: input.sortOrder || 0,
      path,
      depth,
    },
    include: {
      itemType: {
        select: { id: true, name: true, slug: true, level: true, icon: true, color: true },
      },
    },
  });

  return item;
};

// Update a plan item
export const updatePlanItem = async (
  id: string,
  organizationId: number,
  input: UpdatePlanItemInput,
  userId?: number,
  userEmail?: string
) => {
  const item = await prisma.planItem.findFirst({
    where: { id, isActive: true },
    include: {
      project: { select: { organizationId: true } },
    },
  });

  if (!item) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Plan item not found', 404);
  }

  if (item.project.organizationId !== organizationId) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Access denied', 403);
  }

  // Track changes for history
  const changes: { field: string; oldValue: string | null; newValue: string | null }[] = [];
  const trackableFields = ['name', 'description', 'owner', 'status', 'startDate', 'targetEndDate', 'actualStartDate', 'actualEndDate', 'notes'];

  for (const field of trackableFields) {
    if (input[field as keyof UpdatePlanItemInput] !== undefined) {
      const oldVal = item[field as keyof typeof item];
      const newVal = input[field as keyof UpdatePlanItemInput];
      if (String(oldVal) !== String(newVal)) {
        changes.push({
          field,
          oldValue: oldVal !== null ? String(oldVal) : null,
          newValue: newVal !== null && newVal !== undefined ? String(newVal) : null,
        });
      }
    }
  }

  // Build update data
  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.owner !== undefined) updateData.owner = input.owner;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.startDate !== undefined) updateData.startDate = input.startDate;
  if (input.targetEndDate !== undefined) updateData.targetEndDate = input.targetEndDate;
  if (input.actualStartDate !== undefined) updateData.actualStartDate = input.actualStartDate;
  if (input.actualEndDate !== undefined) updateData.actualEndDate = input.actualEndDate;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.references !== undefined) updateData.references = input.references;
  if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
  if (input.itemTypeId !== undefined) updateData.itemTypeId = input.itemTypeId;

  // Handle parent change (needs path/depth recalculation)
  if (input.parentId !== undefined && input.parentId !== item.parentId) {
    // Verify new parent exists if not null
    if (input.parentId !== null) {
      const newParent = await prisma.planItem.findFirst({
        where: { id: input.parentId, projectId: item.projectId, isActive: true },
      });
      if (!newParent) {
        throw new AppError(ErrorCodes.NOT_FOUND, 'New parent plan item not found', 404);
      }
      // Prevent circular reference
      if (newParent.path.includes(id)) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Cannot move item to its own descendant', 400);
      }
    }

    const { path, depth } = await calculatePathAndDepth(input.parentId);
    updateData.parentId = input.parentId;
    updateData.path = path;
    updateData.depth = depth;

    changes.push({
      field: 'parentId',
      oldValue: item.parentId,
      newValue: input.parentId,
    });
  }

  // Update item and create history records in transaction
  const [updated] = await prisma.$transaction([
    prisma.planItem.update({
      where: { id },
      data: updateData,
      include: {
        itemType: {
          select: { id: true, name: true, slug: true, level: true, icon: true, color: true },
        },
      },
    }),
    ...changes.map(change =>
      prisma.planItemHistory.create({
        data: {
          planItemId: id,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          changedByUserId: userId,
          changedByEmail: userEmail,
        },
      })
    ),
  ]);

  return updated;
};

// Delete a plan item (soft delete with cascade)
export const deletePlanItem = async (id: string, organizationId: number) => {
  const item = await prisma.planItem.findFirst({
    where: { id, isActive: true },
    include: {
      project: { select: { organizationId: true } },
    },
  });

  if (!item) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Plan item not found', 404);
  }

  if (item.project.organizationId !== organizationId) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Access denied', 403);
  }

  // Soft delete this item and all descendants
  await prisma.planItem.updateMany({
    where: {
      OR: [
        { id },
        { path: { startsWith: item.path ? `${item.path}/${id}` : `/${id}` } },
      ],
    },
    data: { isActive: false },
  });

  return { message: 'Plan item and children deleted successfully' };
};

// Get history for a plan item
export const getPlanItemHistory = async (id: string, organizationId: number) => {
  const item = await prisma.planItem.findFirst({
    where: { id },
    include: {
      project: { select: { organizationId: true } },
    },
  });

  if (!item) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Plan item not found', 404);
  }

  if (item.project.organizationId !== organizationId) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Access denied', 403);
  }

  const history = await prisma.planItemHistory.findMany({
    where: { planItemId: id },
    orderBy: { createdAt: 'desc' },
  });

  return history;
};

// Get plan item types (global + org-specific)
export const getPlanItemTypes = async (organizationId: number) => {
  const types = await prisma.planItemType.findMany({
    where: {
      isActive: true,
      OR: [
        { organizationId: null }, // Global types
        { organizationId }, // Org-specific types
      ],
    },
    orderBy: { level: 'asc' },
  });

  return types;
};

// Bulk update plan items (for plan updater agent)
export const bulkUpdatePlanItems = async (
  organizationId: number,
  input: BulkUpdateInput,
  userId?: number,
  userEmail?: string
) => {
  const results: Array<{ id: string; success: boolean; error?: string }> = [];

  for (const update of input.updates) {
    try {
      await updatePlanItem(
        update.id,
        organizationId,
        {
          status: update.status,
          notes: update.notes,
          references: update.references,
        },
        userId,
        userEmail
      );
      results.push({ id: update.id, success: true });
    } catch (error) {
      results.push({
        id: update.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
};
