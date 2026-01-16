import prisma from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ErrorCodes } from '../../utils/responses.js';
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  UpdateOrgConfigInput,
  ListOrganizationsQuery,
} from './organizations.schema.js';

export const getUserOrganizations = async (userId: number) => {
  const memberships = await prisma.organizationUser.findMany({
    where: { userId, isActive: true },
    include: {
      organization: true,
      role: {
        select: {
          id: true,
          name: true,
          slug: true,
          level: true,
        },
      },
    },
  });

  return memberships.map((m) => ({
    id: m.organization.id,
    uuid: m.organization.uuid,
    name: m.organization.name,
    slug: m.organization.slug,
    description: m.organization.description,
    logoUrl: m.organization.logoUrl,
    isPlatform: m.organization.isPlatform,
    role: m.role,
    createdAt: m.organization.createdAt,
  }));
};

export const getAllOrganizations = async (query: ListOrganizationsQuery) => {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
    isPlatform: false, // Exclude platform org from list
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      skip,
      take: limit,
      include: {
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.organization.count({ where }),
  ]);

  const orgs = organizations.map((org) => ({
    id: org.id,
    uuid: org.uuid,
    name: org.name,
    slug: org.slug,
    description: org.description,
    logoUrl: org.logoUrl,
    userCount: org._count.users,
    createdAt: org.createdAt,
  }));

  return { organizations: orgs, total, page, limit };
};

export const getOrganizationById = async (orgId: number) => {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: {
      _count: { select: { users: true } },
    },
  });

  if (!org) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Organization not found', 404);
  }

  return {
    id: org.id,
    uuid: org.uuid,
    name: org.name,
    slug: org.slug,
    description: org.description,
    logoUrl: org.logoUrl,
    config: org.config,
    isPlatform: org.isPlatform,
    userCount: org._count.users,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
  };
};

export const createOrganization = async (input: CreateOrganizationInput) => {
  // Check if slug exists
  const existing = await prisma.organization.findUnique({
    where: { slug: input.slug },
  });

  if (existing) {
    throw new AppError(ErrorCodes.CONFLICT, 'Organization with this slug already exists', 409);
  }

  const org = await prisma.organization.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      config: {},
    },
  });

  // Enable default feature flags
  const defaultFlags = await prisma.featureFlag.findMany({
    where: { defaultEnabled: true },
  });

  for (const flag of defaultFlags) {
    await prisma.organizationFeatureFlag.create({
      data: {
        organizationId: org.id,
        featureFlagId: flag.id,
        platformEnabled: true,
        orgEnabled: true,
      },
    });
  }

  return org;
};

export const updateOrganization = async (orgId: number, input: UpdateOrganizationInput) => {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Organization not found', 404);
  }

  if (org.isPlatform) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Cannot modify platform organization', 403);
  }

  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: input,
  });

  return updated;
};

export const updateOrganizationConfig = async (orgId: number, input: UpdateOrgConfigInput) => {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Organization not found', 404);
  }

  // Merge existing config with new config
  const currentConfig = (org.config as Record<string, unknown>) || {};
  const newConfig = { ...currentConfig, ...input.config };

  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: { config: newConfig },
  });

  return { config: updated.config };
};

export const getOrganizationConfig = async (orgId: number) => {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { config: true },
  });

  if (!org) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Organization not found', 404);
  }

  return org.config;
};

export const deleteOrganization = async (orgId: number) => {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Organization not found', 404);
  }

  if (org.isPlatform) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Cannot delete platform organization', 403);
  }

  // Soft delete
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  return { message: 'Organization deleted successfully' };
};
