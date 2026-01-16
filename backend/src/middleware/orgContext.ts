import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { errorResponse, ErrorCodes } from '../utils/responses.js';

export const requireOrgContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
      return;
    }

    // Get organization ID from header or query
    const orgIdHeader = req.headers['x-organization-id'];
    const orgIdQuery = req.query.organizationId;
    const orgIdParam = req.params.orgId || req.params.organizationId;

    const orgIdString = orgIdHeader || orgIdQuery || orgIdParam;

    if (!orgIdString) {
      errorResponse(res, ErrorCodes.VALIDATION_ERROR, 'Organization ID required', 400);
      return;
    }

    const organizationId = parseInt(String(orgIdString), 10);

    if (isNaN(organizationId)) {
      errorResponse(res, ErrorCodes.VALIDATION_ERROR, 'Invalid organization ID', 400);
      return;
    }

    // Check if user belongs to this organization
    const membership = await prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user.id,
          organizationId,
        },
      },
      include: {
        organization: true,
        role: {
          include: {
            permissions: {
              include: {
                menu: true,
              },
            },
          },
        },
      },
    });

    if (!membership || !membership.isActive) {
      errorResponse(res, ErrorCodes.FORBIDDEN, 'You do not have access to this organization', 403);
      return;
    }

    if (!membership.organization.isActive) {
      errorResponse(res, ErrorCodes.FORBIDDEN, 'Organization is deactivated', 403);
      return;
    }

    // Attach org context to request
    req.organizationId = organizationId;
    req.organization = membership.organization;
    req.role = membership.role;

    // Build permissions map
    const permissionsMap = new Map<string, { canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean }>();
    for (const perm of membership.role.permissions) {
      permissionsMap.set(perm.menu.slug, {
        canCreate: perm.canCreate,
        canRead: perm.canRead,
        canUpdate: perm.canUpdate,
        canDelete: perm.canDelete,
      });
    }
    req.permissions = permissionsMap;

    next();
  } catch (error) {
    errorResponse(res, ErrorCodes.INTERNAL_ERROR, 'Failed to load organization context', 500);
  }
};

export const optionalOrgContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      next();
      return;
    }

    const orgIdHeader = req.headers['x-organization-id'];
    const orgIdQuery = req.query.organizationId;
    const orgIdParam = req.params.orgId || req.params.organizationId;

    const orgIdString = orgIdHeader || orgIdQuery || orgIdParam;

    if (!orgIdString) {
      next();
      return;
    }

    const organizationId = parseInt(String(orgIdString), 10);

    if (isNaN(organizationId)) {
      next();
      return;
    }

    const membership = await prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: {
          userId: req.user.id,
          organizationId,
        },
      },
      include: {
        organization: true,
        role: {
          include: {
            permissions: {
              include: {
                menu: true,
              },
            },
          },
        },
      },
    });

    if (membership && membership.isActive && membership.organization.isActive) {
      req.organizationId = organizationId;
      req.organization = membership.organization;
      req.role = membership.role;

      const permissionsMap = new Map<string, { canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean }>();
      for (const perm of membership.role.permissions) {
        permissionsMap.set(perm.menu.slug, {
          canCreate: perm.canCreate,
          canRead: perm.canRead,
          canUpdate: perm.canUpdate,
          canDelete: perm.canDelete,
        });
      }
      req.permissions = permissionsMap;
    }

    next();
  } catch {
    next();
  }
};
