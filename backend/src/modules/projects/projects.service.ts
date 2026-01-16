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
