import { Request, Response, NextFunction } from 'express';
import * as organizationsService from './organizations.service.js';
import { successResponse, paginatedResponse } from '../../utils/responses.js';
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  UpdateOrgConfigInput,
  ListOrganizationsQuery,
} from './organizations.schema.js';

export const getMyOrganizations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizations = await organizationsService.getUserOrganizations(req.user!.id);
    successResponse(res, organizations);
  } catch (error) {
    next(error);
  }
};

export const getAllOrganizations = async (
  req: Request<{}, {}, {}, ListOrganizationsQuery>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await organizationsService.getAllOrganizations(req.query);
    paginatedResponse(res, result.organizations, result.page, result.limit, result.total);
  } catch (error) {
    next(error);
  }
};

export const getOrganization = async (
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = parseInt(req.params.orgId, 10);
    const organization = await organizationsService.getOrganizationById(orgId);
    successResponse(res, organization);
  } catch (error) {
    next(error);
  }
};

export const createOrganization = async (
  req: Request<{}, {}, CreateOrganizationInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organization = await organizationsService.createOrganization(req.body);
    successResponse(res, organization, 201);
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (
  req: Request<{ orgId: string }, {}, UpdateOrganizationInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = parseInt(req.params.orgId, 10);
    const organization = await organizationsService.updateOrganization(orgId, req.body);
    successResponse(res, organization);
  } catch (error) {
    next(error);
  }
};

export const getOrganizationConfig = async (
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = parseInt(req.params.orgId, 10);
    const config = await organizationsService.getOrganizationConfig(orgId);
    successResponse(res, config);
  } catch (error) {
    next(error);
  }
};

export const updateOrganizationConfig = async (
  req: Request<{ orgId: string }, {}, UpdateOrgConfigInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = parseInt(req.params.orgId, 10);
    const result = await organizationsService.updateOrganizationConfig(orgId, req.body);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const deleteOrganization = async (
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = parseInt(req.params.orgId, 10);
    const result = await organizationsService.deleteOrganization(orgId);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};
