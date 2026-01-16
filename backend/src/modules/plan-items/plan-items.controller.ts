import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as planItemsService from './plan-items.service.js';
import { successResponse } from '../../utils/responses.js';
import type {
  CreatePlanItemInput,
  UpdatePlanItemInput,
  ListPlanItemsQuery,
  BulkUpdateInput,
} from './plan-items.schema.js';

// GET /api/projects/:projectId/plan - Get full plan tree
export const getProjectPlan: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { projectId } = req.params;
    const query = req.query as unknown as ListPlanItemsQuery;
    const result = await planItemsService.getProjectPlan(projectId, organizationId, query);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

// GET /api/plan-items/:id - Get single plan item
export const getPlanItem: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const item = await planItemsService.getPlanItemById(req.params.id, organizationId);
    successResponse(res, item);
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:projectId/plan - Create plan item
export const createPlanItem: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { projectId } = req.params;
    const input = req.body as CreatePlanItemInput;
    const item = await planItemsService.createPlanItem(
      projectId,
      organizationId,
      input,
      req.user?.id,
      req.user?.email
    );
    successResponse(res, item, 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/plan-items/:id - Update plan item
export const updatePlanItem: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const input = req.body as UpdatePlanItemInput;
    const item = await planItemsService.updatePlanItem(
      req.params.id,
      organizationId,
      input,
      req.user?.id,
      req.user?.email
    );
    successResponse(res, item);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/plan-items/:id - Delete plan item
export const deletePlanItem: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const result = await planItemsService.deletePlanItem(req.params.id, organizationId);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

// GET /api/plan-items/:id/history - Get plan item history
export const getPlanItemHistory: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const history = await planItemsService.getPlanItemHistory(req.params.id, organizationId);
    successResponse(res, history);
  } catch (error) {
    next(error);
  }
};

// GET /api/plan-item-types - Get all plan item types
export const getPlanItemTypes: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const types = await planItemsService.getPlanItemTypes(organizationId);
    successResponse(res, types);
  } catch (error) {
    next(error);
  }
};

// POST /api/plan-items/bulk-update - Bulk update plan items
export const bulkUpdatePlanItems: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const input = req.body as BulkUpdateInput;
    const results = await planItemsService.bulkUpdatePlanItems(
      organizationId,
      input,
      req.user?.id,
      req.user?.email
    );
    successResponse(res, results);
  } catch (error) {
    next(error);
  }
};
