import { Request, Response, NextFunction } from 'express';
import { errorResponse, ErrorCodes } from '../utils/responses.js';

type CRUDAction = 'create' | 'read' | 'update' | 'delete';

export const requirePermission = (menuSlug: string, action: CRUDAction) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
      return;
    }

    if (!req.permissions) {
      errorResponse(res, ErrorCodes.FORBIDDEN, 'No permissions loaded', 403);
      return;
    }

    const permission = req.permissions.get(menuSlug);

    if (!permission) {
      errorResponse(res, ErrorCodes.FORBIDDEN, 'You do not have access to this resource', 403);
      return;
    }

    let hasPermission = false;
    switch (action) {
      case 'create':
        hasPermission = permission.canCreate;
        break;
      case 'read':
        hasPermission = permission.canRead;
        break;
      case 'update':
        hasPermission = permission.canUpdate;
        break;
      case 'delete':
        hasPermission = permission.canDelete;
        break;
    }

    if (!hasPermission) {
      errorResponse(res, ErrorCodes.FORBIDDEN, `You do not have permission to ${action} this resource`, 403);
      return;
    }

    next();
  };
};

export const requireRole = (minLevel: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
      return;
    }

    if (!req.role) {
      errorResponse(res, ErrorCodes.FORBIDDEN, 'No role assigned', 403);
      return;
    }

    if (req.role.level < minLevel) {
      errorResponse(res, ErrorCodes.FORBIDDEN, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
};

// Convenience middleware for common role checks
export const requireOrgAdmin = requireRole(40);
export const requirePlatformAdmin = requireRole(100);

export const requireAnyPermission = (menuSlugs: string[], action: CRUDAction) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, ErrorCodes.UNAUTHORIZED, 'Authentication required', 401);
      return;
    }

    if (!req.permissions) {
      errorResponse(res, ErrorCodes.FORBIDDEN, 'No permissions loaded', 403);
      return;
    }

    for (const menuSlug of menuSlugs) {
      const permission = req.permissions.get(menuSlug);
      if (permission) {
        let hasPermission = false;
        switch (action) {
          case 'create':
            hasPermission = permission.canCreate;
            break;
          case 'read':
            hasPermission = permission.canRead;
            break;
          case 'update':
            hasPermission = permission.canUpdate;
            break;
          case 'delete':
            hasPermission = permission.canDelete;
            break;
        }
        if (hasPermission) {
          next();
          return;
        }
      }
    }

    errorResponse(res, ErrorCodes.FORBIDDEN, 'You do not have access to this resource', 403);
  };
};
