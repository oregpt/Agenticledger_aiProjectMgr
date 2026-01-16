import prisma from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ErrorCodes } from '../../utils/responses.js';
import type { UpdateProfileInput, ListUsersQuery } from './users.schema.js';

export const updateProfile = async (userId: number, input: UpdateProfileInput) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: input,
    select: {
      id: true,
      uuid: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return user;
};

export const listUsersInOrganization = async (
  organizationId: number,
  query: ListUsersQuery
) => {
  const { page, limit, search, roleId, isActive } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    organizationId,
    ...(isActive !== undefined && { isActive }),
    ...(roleId && { roleId }),
  };

  if (search) {
    where.user = {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  const [members, total] = await Promise.all([
    prisma.organizationUser.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            isActive: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
            level: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    }),
    prisma.organizationUser.count({ where }),
  ]);

  const users = members.map((m) => ({
    id: m.user.id,
    uuid: m.user.uuid,
    email: m.user.email,
    firstName: m.user.firstName,
    lastName: m.user.lastName,
    avatarUrl: m.user.avatarUrl,
    role: m.role,
    isActive: m.isActive,
    joinedAt: m.joinedAt,
  }));

  return { users, total, page, limit };
};

export const updateUserRole = async (
  organizationId: number,
  targetUserId: number,
  newRoleId: number,
  requestingUserRoleLevel: number
) => {
  // Get target user's current role
  const membership = await prisma.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId: targetUserId,
        organizationId,
      },
    },
    include: { role: true },
  });

  if (!membership) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'User not found in organization', 404);
  }

  // Get new role
  const newRole = await prisma.role.findUnique({
    where: { id: newRoleId },
  });

  if (!newRole) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Role not found', 404);
  }

  // Can't assign role higher than your own
  if (newRole.level >= requestingUserRoleLevel) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Cannot assign a role equal to or higher than your own', 403);
  }

  // Can't modify users with equal or higher role
  if (membership.role.level >= requestingUserRoleLevel) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Cannot modify users with equal or higher role', 403);
  }

  const updated = await prisma.organizationUser.update({
    where: { id: membership.id },
    data: { roleId: newRoleId },
    include: {
      user: {
        select: {
          id: true,
          uuid: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return updated;
};

export const removeUserFromOrganization = async (
  organizationId: number,
  targetUserId: number,
  requestingUserId: number,
  requestingUserRoleLevel: number
) => {
  // Can't remove yourself
  if (targetUserId === requestingUserId) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Cannot remove yourself from organization', 400);
  }

  // Get target user's membership
  const membership = await prisma.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId: targetUserId,
        organizationId,
      },
    },
    include: { role: true },
  });

  if (!membership) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'User not found in organization', 404);
  }

  // Can't remove users with equal or higher role
  if (membership.role.level >= requestingUserRoleLevel) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Cannot remove users with equal or higher role', 403);
  }

  await prisma.organizationUser.delete({
    where: { id: membership.id },
  });

  return { message: 'User removed from organization' };
};

export const getUserById = async (userId: number, organizationId: number) => {
  const membership = await prisma.organizationUser.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          uuid: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          emailVerified: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
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

  if (!membership) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'User not found in organization', 404);
  }

  return {
    ...membership.user,
    role: membership.role,
    joinedAt: membership.joinedAt,
    membershipActive: membership.isActive,
  };
};
