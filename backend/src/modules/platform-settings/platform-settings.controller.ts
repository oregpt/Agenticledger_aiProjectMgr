import { Request, Response, NextFunction } from 'express';
import * as platformSettingsService from './platform-settings.service.js';
import { successResponse } from '../../utils/responses.js';

export const getAllSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await platformSettingsService.getAllSettings();
    successResponse(res, settings);
  } catch (error) {
    next(error);
  }
};

export const getSetting = async (
  req: Request<{ key: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const setting = await platformSettingsService.getSetting(req.params.key);
    successResponse(res, setting);
  } catch (error) {
    next(error);
  }
};

export const updateSetting = async (
  req: Request<{ key: string }, {}, { value: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const setting = await platformSettingsService.updateSetting(req.params.key, req.body.value);
    successResponse(res, setting);
  } catch (error) {
    next(error);
  }
};

export const getPublicSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await platformSettingsService.getPublicSettings();
    successResponse(res, settings);
  } catch (error) {
    next(error);
  }
};
