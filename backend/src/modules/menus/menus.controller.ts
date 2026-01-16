import { Request, Response, NextFunction } from 'express';
import * as menusService from './menus.service.js';
import { successResponse } from '../../utils/responses.js';

export const getAllMenus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const menus = await menusService.getAllMenus();
    successResponse(res, menus);
  } catch (error) {
    next(error);
  }
};

export const getUserMenus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const menus = await menusService.getUserMenus(req.user!.id, req.organizationId!);
    successResponse(res, menus);
  } catch (error) {
    next(error);
  }
};
