import { Request, Response, NextFunction } from 'express';
import * as featureFlagsService from './feature-flags.service.js';
import { successResponse } from '../../utils/responses.js';

export const getAllFeatureFlags = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const flags = await featureFlagsService.getAllFeatureFlags();
    successResponse(res, flags);
  } catch (error) {
    next(error);
  }
};

export const getOrganizationFeatureFlags = async (
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = parseInt(req.params.orgId, 10) || req.organizationId!;
    const flags = await featureFlagsService.getOrganizationFeatureFlags(orgId);
    successResponse(res, flags);
  } catch (error) {
    next(error);
  }
};

export const updateFeatureFlag = async (
  req: Request<{ flagId: string }, {}, { defaultEnabled: boolean }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const flagId = parseInt(req.params.flagId, 10);
    const flag = await featureFlagsService.updateFeatureFlagDefault(
      flagId,
      req.body.defaultEnabled
    );
    successResponse(res, flag);
  } catch (error) {
    next(error);
  }
};

export const updateOrganizationFeatureFlag = async (
  req: Request<{ orgId: string; flagId: string }, {}, { platformEnabled?: boolean; orgEnabled?: boolean }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = parseInt(req.params.orgId, 10) || req.organizationId!;
    const flagId = parseInt(req.params.flagId, 10);
    const isPlatformAdmin = req.role!.level >= 100;

    const flag = await featureFlagsService.updateOrganizationFeatureFlag(
      orgId,
      flagId,
      req.body,
      isPlatformAdmin
    );
    successResponse(res, flag);
  } catch (error) {
    next(error);
  }
};
