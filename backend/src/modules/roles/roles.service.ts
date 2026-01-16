import prisma from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ErrorCodes } from '../../utils/responses.js';
import type { CreateRoleInput, UpdateRoleInput, UpdatePermissionsInput, ListRolesQuery } from './roles.schema.js';

export const listRoles = async (query: ListRolesQuery) => {
  const { scope, organizationId } = query;

  const where: any = {};

  if (scope) {
    where.scope = scope;
  }

  if (organizationId) {
    where.OR = [
      { organizationId: null, scope: 'PLATFORM' }, // Platform-level roles
      { organizationId }, // Org-specific roles
    ];
  } else {
    where.organizationId = null; // Only platform-level roles
  }

  const roles = await prisma.role.findMany({
    where,
    include: {
      baseRole: {
        select: { id: true, name: true, slug: true },
      },
      _count: { select: { users: true } },
    },
    orderBy: [{ level: 'asc' }, { name: 'asc' }],
  });

  return roles.map((role) => ({
    id: role.id,
    uuid: role.uuid,
    name: role.name,
    slug: role.slug,
    description: role.description,
    level: role.level,
    isSystem: role.isSystem,
    scope: role.scope,
    organizationId: role.organizationId,
    baseRole: role.baseRole,
    userCount: role._count.users,
    createdAt: role.createdAt,
  }));
};

export const getRoleById = async (roleId: number) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      baseRole: {
        select: { id: true, name: true, slug: true },
      },
      permissions: {
        include: {
          menu: {
            select: { id: true, name: true, slug: true, path: true, section: true },
          },
        },
      },
    },
  });

  if (!role) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Role not found', 404);
  }

  return {
    id: role.id,
    uuid: role.uuid,
    name: role.name,
    slug: role.slug,
    description: role.description,
    level: role.level,
    isSystem: role.isSystem,
    scope: role.scope,
    organizationId: role.organizationId,
    baseRole: role.baseRole,
    permissions: role.permissions.map((p) => ({
      menuId: p.menu.id,
      menuName: p.menu.name,
      menuSlug: p.menu.slug,
      menuPath: p.menu.path,
      menuSection: p.menu.section,
      canCreate: p.canCreate,
      canRead: p.canRead,
      canUpdate: p.canUpdate,
      canDelete: p.canDelete,
    })),
    createdAt: role.createdAt,
  };
};

export const createRole = async (input: CreateRoleInput, creatorRoleLevel: number) => {
  const { name, slug, description, baseRoleId, scope, organizationId, permissions } = input;

  // If creating from base role, get its level
  let level = 10; // Default to viewer level

  if (baseRoleId) {
    const baseRole = await prisma.role.findUnique({
      where: { id: baseRoleId },
    });

    if (!baseRole) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Base role not found', 404);
    }

    // Can't create role based on higher level than yours
    if (baseRole.level >= creatorRoleLevel) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Cannot create role based on a role equal to or higher than your own', 403);
    }

    level = baseRole.level;
  }

  // Check for slug uniqueness within scope
  const existing = await prisma.role.findFirst({
    where: {
      slug,
      organizationId: organizationId || null,
    },
  });

  if (existing) {
    throw new AppError(ErrorCodes.CONFLICT, 'A role with this slug already exists', 409);
  }

  // Create role with permissions
  const role = await prisma.$transaction(async (tx) => {
    const newRole = await tx.role.create({
      data: {
        name,
        slug,
        description,
        level,
        isSystem: false,
        scope,
        organizationId,
        baseRoleId,
      },
    });

    // Create permissions if provided
    if (permissions && permissions.length > 0) {
      await tx.rolePermission.createMany({
        data: permissions.map((p) => ({
          roleId: newRole.id,
          menuId: p.menuId,
          canCreate: p.canCreate,
          canRead: p.canRead,
          canUpdate: p.canUpdate,
          canDelete: p.canDelete,
        })),
      });
    } else if (baseRoleId) {
      // Copy permissions from base role
      const basePermissions = await tx.rolePermission.findMany({
        where: { roleId: baseRoleId },
      });

      if (basePermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: basePermissions.map((p) => ({
            roleId: newRole.id,
            menuId: p.menuId,
            canCreate: p.canCreate,
            canRead: p.canRead,
            canUpdate: p.canUpdate,
            canDelete: p.canDelete,
          })),
        });
      }
    }

    return newRole;
  });

  return getRoleById(role.id);
};

export const updateRole = async (roleId: number, input: UpdateRoleInput) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Role not found', 404);
  }

  if (role.isSystem) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Cannot modify system roles', 403);
  }

  const updated = await prisma.role.update({
    where: { id: roleId },
    data: input,
  });

  return getRoleById(updated.id);
};

export const updateRolePermissions = async (roleId: number, input: UpdatePermissionsInput) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Role not found', 404);
  }

  if (role.isSystem) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Cannot modify system role permissions', 403);
  }

  // Replace all permissions
  await prisma.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({
      where: { roleId },
    });

    await tx.rolePermission.createMany({
      data: input.permissions.map((p) => ({
        roleId,
        menuId: p.menuId,
        canCreate: p.canCreate,
        canRead: p.canRead,
        canUpdate: p.canUpdate,
        canDelete: p.canDelete,
      })),
    });
  });

  return getRoleById(roleId);
};

export const deleteRole = async (roleId: number) => {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: { _count: { select: { users: true } } },
  });

  if (!role) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Role not found', 404);
  }

  if (role.isSystem) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Cannot delete system roles', 403);
  }

  if (role._count.users > 0) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Cannot delete role with assigned users', 400);
  }

  await prisma.role.delete({
    where: { id: roleId },
  });

  return { message: 'Role deleted successfully' };
};

export const getRolePermissions = async (roleId: number) => {
  const permissions = await prisma.rolePermission.findMany({
    where: { roleId },
    include: {
      menu: {
        select: { id: true, name: true, slug: true, path: true, section: true, icon: true },
      },
    },
    orderBy: { menu: { sortOrder: 'asc' } },
  });

  return permissions.map((p) => ({
    menuId: p.menu.id,
    menuName: p.menu.name,
    menuSlug: p.menu.slug,
    menuPath: p.menu.path,
    menuSection: p.menu.section,
    menuIcon: p.menu.icon,
    canCreate: p.canCreate,
    canRead: p.canRead,
    canUpdate: p.canUpdate,
    canDelete: p.canDelete,
  }));
};
