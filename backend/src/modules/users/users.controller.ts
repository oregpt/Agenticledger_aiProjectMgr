import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service.js';
import { successResponse, paginatedResponse } from '../../utils/responses.js';
import type { UpdateProfileInput, UpdateUserRoleInput, ListUsersQuery } from './users.schema.js';

export const updateProfile = async (
  req: Request<{}, {}, UpdateProfileInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await usersService.updateProfile(req.user!.id, req.body);
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (
  req: Request<{}, {}, {}, ListUsersQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await usersService.listUsersInOrganization(req.organizationId!, req.query);
    paginatedResponse(res, result.users, result.page, result.limit, result.total);
  } catch (error) {
    next(error);
  }
};

export const getUser = async (
  req: Request<{ userId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const user = await usersService.getUserById(userId, req.organizationId!);
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (
  req: Request<{ userId: string }, {}, UpdateUserRoleInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const result = await usersService.updateUserRole(
      req.organizationId!,
      userId,
      req.body.roleId,
      req.role!.level
    );
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const removeUser = async (
  req: Request<{ userId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const result = await usersService.removeUserFromOrganization(
      req.organizationId!,
      userId,
      req.user!.id,
      req.role!.level
    );
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};
