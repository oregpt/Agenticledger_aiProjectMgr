/**
 * Config Service
 * Business logic for managing configuration types
 */

import prisma from '../../config/database';
import type {
  CreatePlanItemTypeInput,
  UpdatePlanItemTypeInput,
  CreateContentTypeInput,
  UpdateContentTypeInput,
  CreateActivityTypeInput,
  UpdateActivityTypeInput,
  ListTypesQuery,
} from './config.schema';

// ============ Plan Item Types ============

export async function listPlanItemTypes(organizationId: number, query: ListTypesQuery) {
  const where = {
    isActive: true,
    OR: [
      { organizationId: null }, // Global types
      { organizationId },        // Organization-specific types
    ],
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' as const } },
        { slug: { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
    ...(!query.includeSystem && { isSystem: false }),
  };

  const [items, total] = await Promise.all([
    prisma.planItemType.findMany({
      where,
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.planItemType.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getPlanItemType(id: number, organizationId: number) {
  return prisma.planItemType.findFirst({
    where: {
      id,
      isActive: true,
      OR: [{ organizationId: null }, { organizationId }],
    },
  });
}

export async function createPlanItemType(organizationId: number, input: CreatePlanItemTypeInput) {
  // Check for duplicate slug within org
  const existing = await prisma.planItemType.findFirst({
    where: {
      slug: input.slug,
      isActive: true,
      OR: [{ organizationId: null }, { organizationId }],
    },
  });

  if (existing) {
    throw new Error(`Plan item type with slug "${input.slug}" already exists`);
  }

  return prisma.planItemType.create({
    data: {
      ...input,
      organizationId,
      isSystem: false,
    },
  });
}

export async function updatePlanItemType(
  id: number,
  organizationId: number,
  input: UpdatePlanItemTypeInput
) {
  // Verify type exists and is not system type
  const existing = await prisma.planItemType.findFirst({
    where: {
      id,
      isActive: true,
      OR: [{ organizationId: null }, { organizationId }],
    },
  });

  if (!existing) {
    throw new Error('Plan item type not found');
  }

  if (existing.isSystem) {
    throw new Error('Cannot modify system plan item type');
  }

  // Check for duplicate slug if changing
  if (input.slug && input.slug !== existing.slug) {
    const duplicate = await prisma.planItemType.findFirst({
      where: {
        slug: input.slug,
        id: { not: id },
        isActive: true,
        OR: [{ organizationId: null }, { organizationId }],
      },
    });

    if (duplicate) {
      throw new Error(`Plan item type with slug "${input.slug}" already exists`);
    }
  }

  return prisma.planItemType.update({
    where: { id },
    data: input,
  });
}

export async function deletePlanItemType(id: number, organizationId: number) {
  const existing = await prisma.planItemType.findFirst({
    where: {
      id,
      isActive: true,
      OR: [{ organizationId: null }, { organizationId }],
    },
  });

  if (!existing) {
    throw new Error('Plan item type not found');
  }

  if (existing.isSystem) {
    throw new Error('Cannot delete system plan item type');
  }

  // Check if type is in use
  const inUse = await prisma.planItem.findFirst({
    where: { itemTypeId: id, isActive: true },
  });

  if (inUse) {
    throw new Error('Cannot delete plan item type that is in use');
  }

  return prisma.planItemType.update({
    where: { id },
    data: { isActive: false },
  });
}

// ============ Content Types ============

export async function listContentTypes(organizationId: number, query: ListTypesQuery) {
  const where = {
    isActive: true,
    OR: [
      { organizationId: null },
      { organizationId },
    ],
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' as const } },
        { slug: { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
    ...(!query.includeSystem && { isSystem: false }),
  };

  const [items, total] = await Promise.all([
    prisma.contentType.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.contentType.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getContentType(id: number, organizationId: number) {
  return prisma.contentType.findFirst({
    where: {
      id,
      isActive: true,
      OR: [{ organizationId: null }, { organizationId }],
    },
  });
}

export async function createContentType(organizationId: number, input: CreateContentTypeInput) {
  const existing = await prisma.contentType.findFirst({
    where: {
      slug: input.slug,
      isActive: true,
      OR: [{ organizationId: null }, { organizationId }],
    },
  });

  if (existing) {
    throw new Error(`Content type with slug "${input.slug}" already exists`);
  }

  return prisma.contentType.create({
    data: {
      ...input,
      organizationId,
      isSystem: false,
    },
  });
}

export async function updateContentType(
  id: number,
  organizationId: number,
  input: UpdateContentTypeInput
) {
  const existing = await prisma.contentType.findFirst({
    where: {
      id,
      isActive: true,
      OR: [{ organizationId: null }, { organizationId }],
    },
  });

  if (!existing) {
    throw new Error('Content type not found');
  }

  if (existing.isSystem) {
    throw new Error('Cannot modify system content type');
  }

  if (input.slug && input.slug !== existing.slug) {
    const duplicate = await prisma.contentType.findFirst({
      where: {
        slug: input.slug,
        id: { not: id },
        isActive: true,
        OR: [{ organizationId: null }, { organizationId }],
      },
    });

    if (duplicate) {
      throw new Error(`Content type with slug "${input.slug}" already exists`);
    }
  }

  return prisma.contentType.update({
    where: { id },
    data: input,
  });
}

export async function deleteContentType(id: number, organizationId: number) {
  const existing = await prisma.contentType.findFirst({
    where: {
      id,
      isActive: true,
      OR: [{ organizationId: null }, { organizationId }],
    },
  });

  if (!existing) {
    throw new Error('Content type not found');
  }

  if (existing.isSystem) {
    throw new Error('Cannot delete system content type');
  }

  return prisma.contentType.update({
    where: { id },
    data: { isActive: false },
  });
}

// ============ Activity Types ============

export async function listActivityTypes(organizationId: number, query: ListTypesQuery) {
  const where = {
    isActive: true,
    OR: [
      { organizationId: null },
      { organizationId },
    ],
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' as const } },
        { slug: { contains: query.search, mode: 'insensitive' as const } },
      ],
    }),
    ...(!query.includeSystem && { isSystem: false }),
  };

  const [items, total] = await Promise.all([
    prisma.activityItemType.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.activityItemType.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getActivityType(id: number, organizationId: number) {
  return prisma.activityItemType.findFirst({
    where: {
      id,
      isActive: true,
      OR: [{ organizationId: null }, { organizationId }],
    },
  });
}

export async function createActivityType(organizationId: number, input: CreateActivityTypeInput) {
  const existing = await prisma.activityItemType.findFirst({
    where: {
      slug: input.slug,
      isActive: true,
      OR: [{ organizationId: null }, { organizationId }],
    },
  });

  if (existing) {
    throw new Error(`Activity type with slug "${input.slug}" already exists`);
  }

  return prisma.activityItemType.create({
    data: {
      ...input,
      organizationId,
      isSystem: false,
    },
  });
}

export async function updateActivityType(
  id: number,
  organizationId: number,
  input: UpdateActivityTypeInput
) {
  const existing = await prisma.activityItemType.findFirst({
    where: {
      id,
      isActive: true,
      OR: [{ organizationId: null }, { organizationId }],
    },
  });

  if (!existing) {
    throw new Error('Activity type not found');
  }

  if (existing.isSystem) {
    throw new Error('Cannot modify system activity type');
  }

  if (input.slug && input.slug !== existing.slug) {
    const duplicate = await prisma.activityItemType.findFirst({
      where: {
        slug: input.slug,
        id: { not: id },
        isActive: true,
        OR: [{ organizationId: null }, { organizationId }],
      },
    });

    if (duplicate) {
      throw new Error(`Activity type with slug "${input.slug}" already exists`);
    }
  }

  return prisma.activityItemType.update({
    where: { id },
    data: input,
  });
}

export async function deleteActivityType(id: number, organizationId: number) {
  const existing = await prisma.activityItemType.findFirst({
    where: {
      id,
      isActive: true,
      OR: [{ organizationId: null }, { organizationId }],
    },
  });

  if (!existing) {
    throw new Error('Activity type not found');
  }

  if (existing.isSystem) {
    throw new Error('Cannot delete system activity type');
  }

  return prisma.activityItemType.update({
    where: { id },
    data: { isActive: false },
  });
}

export default {
  // Plan Item Types
  listPlanItemTypes,
  getPlanItemType,
  createPlanItemType,
  updatePlanItemType,
  deletePlanItemType,
  // Content Types
  listContentTypes,
  getContentType,
  createContentType,
  updateContentType,
  deleteContentType,
  // Activity Types
  listActivityTypes,
  getActivityType,
  createActivityType,
  updateActivityType,
  deleteActivityType,
};
