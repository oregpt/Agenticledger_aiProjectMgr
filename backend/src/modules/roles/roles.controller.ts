import { Request, Response, NextFunction } from 'express';
import * as rolesService from './roles.service.js';
import { successResponse } from '../../utils/responses.js';
import type { CreateRoleInput, UpdateRoleInput, UpdatePermissionsInput, ListRolesQuery } from './roles.schema.js';

export const listRoles = async (
  req: Request<{}, {}, {}, ListRolesQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // If user has org context, include org-specific roles
    const query = {
      ...req.query,
      organizationId: req.query.organizationId || req.organizationId,
    };
    const roles = await rolesService.listRoles(query);
    successResponse(res, roles);
  } catch (error) {
    next(error);
  }
};

export const getRole = async (
  req: Request<{ roleId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    const role = await rolesService.getRoleById(roleId);
    successResponse(res, role);
  } catch (error) {
    next(error);
  }
};

export const createRole = async (
  req: Request<{}, {}, CreateRoleInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const role = await rolesService.createRole(req.body, req.role!.level);
    successResponse(res, role, 201);
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (
  req: Request<{ roleId: string }, {}, UpdateRoleInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    const role = await rolesService.updateRole(roleId, req.body);
    successResponse(res, role);
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (
  req: Request<{ roleId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    const result = await rolesService.deleteRole(roleId);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getRolePermissions = async (
  req: Request<{ roleId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    const permissions = await rolesService.getRolePermissions(roleId);
    successResponse(res, permissions);
  } catch (error) {
    next(error);
  }
};

export const updateRolePermissions = async (
  req: Request<{ roleId: string }, {}, UpdatePermissionsInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const roleId = parseInt(req.params.roleId, 10);
    const role = await rolesService.updateRolePermissions(roleId, req.body);
    successResponse(res, role);
  } catch (error) {
    next(error);
  }
};
