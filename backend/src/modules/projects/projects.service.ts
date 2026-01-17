import prisma from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ErrorCodes } from '../../utils/responses.js';
import { Prisma } from '@prisma/client';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsQuery,
} from './projects.schema.js';

export const getProjectsByOrganization = async (organizationId: number, query: ListProjectsQuery) => {
  const { page, limit, search, status } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    organizationId,
    isActive: true,
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { client: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.count({ where }),
  ]);

  return { projects, total, page, limit };
};

export const getProjectById = async (projectId: string, organizationId: number) => {
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

  return project;
};

export const createProject = async (organizationId: number, input: CreateProjectInput) => {
  // Check if project name already exists in this organization
  const existing = await prisma.project.findFirst({
    where: {
      organizationId,
      name: input.name,
      isActive: true,
    },
  });

  if (existing) {
    throw new AppError(ErrorCodes.CONFLICT, 'Project with this name already exists in this organization', 409);
  }

  const project = await prisma.project.create({
    data: {
      organizationId,
      name: input.name,
      client: input.client,
      description: input.description,
      startDate: input.startDate,
      targetEndDate: input.targetEndDate || null,
      status: input.status || 'active',
      statusConfig: (input.statusConfig || {}) as Prisma.InputJsonValue,
    },
  });

  return project;
};

export const updateProject = async (
  projectId: string,
  organizationId: number,
  input: UpdateProjectInput
) => {
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

  // If name is being updated, check for duplicates
  if (input.name && input.name !== project.name) {
    const existing = await prisma.project.findFirst({
      where: {
        organizationId,
        name: input.name,
        isActive: true,
        NOT: { id: projectId },
      },
    });

    if (existing) {
      throw new AppError(ErrorCodes.CONFLICT, 'Project with this name already exists in this organization', 409);
    }
  }

  // Build update data with proper types
  const updateData: Prisma.ProjectUpdateInput = {};

  if (input.name !== undefined) updateData.name = input.name;
  if (input.client !== undefined) updateData.client = input.client;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.startDate !== undefined) updateData.startDate = input.startDate;
  if (input.targetEndDate !== undefined) updateData.targetEndDate = input.targetEndDate;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.statusConfig !== undefined) updateData.statusConfig = input.statusConfig as Prisma.InputJsonValue;

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: updateData,
  });

  return updated;
};

export const deleteProject = async (projectId: string, organizationId: number) => {
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

  // Soft delete
  await prisma.project.update({
    where: { id: projectId },
    data: { isActive: false },
  });

  return { message: 'Project deleted successfully' };
};

/**
 * Get dashboard statistics for a project
 */
export const getProjectDashboard = async (projectId: string, organizationId: number) => {
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

  // Get plan items statistics
  const planItemStats = await prisma.planItem.groupBy({
    by: ['status'],
    where: {
      projectId,
      isActive: true,
    },
    _count: true,
  });

  const planItemsByType = await prisma.planItem.groupBy({
    by: ['itemTypeId'],
    where: {
      projectId,
      isActive: true,
    },
    _count: true,
  });

  // Get item type names
  const itemTypes = await prisma.planItemType.findMany({
    where: {
      id: { in: planItemsByType.map(p => p.itemTypeId) },
    },
    select: { id: true, name: true },
  });

  const itemTypeMap = new Map(itemTypes.map(t => [t.id, t.name]));

  // Get total plan items
  const totalPlanItems = await prisma.planItem.count({
    where: {
      projectId,
      isActive: true,
    },
  });

  // Get content item statistics
  const contentItemStats = await prisma.contentItem.groupBy({
    by: ['sourceType'],
    where: {
      projectId,
      isActive: true,
    },
    _count: true,
  });

  const totalContentItems = await prisma.contentItem.count({
    where: {
      projectId,
      isActive: true,
    },
  });

  // Get recent content items
  const recentContentItems = await prisma.contentItem.findMany({
    where: {
      projectId,
      isActive: true,
    },
    select: {
      id: true,
      title: true,
      sourceType: true,
      dateOccurred: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Get recent activity reports (if table exists)
  let recentReports: Array<{
    id: string;
    title: string;
    periodStart: Date;
    periodEnd: Date;
    createdAt: Date;
  }> = [];

  try {
    recentReports = await prisma.activityReport.findMany({
      where: {
        projectId,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        periodStart: true,
        periodEnd: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
  } catch {
    // Table might not exist yet
  }

  // Content items by week (last 4 weeks)
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const contentByWeek = await prisma.contentItem.findMany({
    where: {
      projectId,
      isActive: true,
      dateOccurred: {
        gte: fourWeeksAgo,
      },
    },
    select: {
      dateOccurred: true,
    },
    orderBy: { dateOccurred: 'asc' },
  });

  // Group by week
  const weeklyActivity: Record<string, number> = {};
  contentByWeek.forEach(item => {
    const weekStart = new Date(item.dateOccurred);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    weeklyActivity[weekKey] = (weeklyActivity[weekKey] || 0) + 1;
  });

  return {
    project: {
      id: project.id,
      name: project.name,
      client: project.client,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      targetEndDate: project.targetEndDate,
    },
    planItems: {
      total: totalPlanItems,
      byStatus: planItemStats.map(s => ({
        status: s.status,
        count: s._count,
      })),
      byType: planItemsByType.map(t => ({
        type: itemTypeMap.get(t.itemTypeId) || 'Unknown',
        typeId: t.itemTypeId,
        count: t._count,
      })),
    },
    contentItems: {
      total: totalContentItems,
      bySourceType: contentItemStats.map(s => ({
        sourceType: s.sourceType,
        count: s._count,
      })),
      recent: recentContentItems,
      weeklyActivity: Object.entries(weeklyActivity).map(([week, count]) => ({
        week,
        count,
      })),
    },
    activityReports: {
      recent: recentReports,
    },
  };
};
