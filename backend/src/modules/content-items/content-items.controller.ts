import { Request, Response, NextFunction, RequestHandler } from 'express';
import { successResponse, paginatedResponse } from '../../utils/responses.js';
import * as contentItemsService from './content-items.service.js';
import type {
  CreateContentItemInput,
  UpdateContentItemInput,
  ListContentItemsQuery,
} from './content-items.schema.js';

// GET /api/projects/:projectId/content - List content items for a project
export const getProjectContent: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const { projectId } = req.params;
    const query = req.query as unknown as ListContentItemsQuery;

    const result = await contentItemsService.getProjectContent(projectId, organizationId, query);
    paginatedResponse(
      res,
      result.items,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/content-items - List all content items with filters
export const listContentItems: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const query = req.query as unknown as ListContentItemsQuery;

    const result = await contentItemsService.listContentItems(organizationId, query);
    paginatedResponse(
      res,
      result.items,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/content-items/:id - Get a single content item
export const getContentItem: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const item = await contentItemsService.getContentItem(req.params.id, organizationId);
    successResponse(res, item);
  } catch (error) {
    next(error);
  }
};

// POST /api/content-items - Create a new content item
export const createContentItem: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const input = req.body as CreateContentItemInput;
    const userId = req.user?.id;

    const item = await contentItemsService.createContentItem(organizationId, input, userId);
    successResponse(res, item, 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/content-items/:id - Update a content item
export const updateContentItem: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const input = req.body as UpdateContentItemInput;

    const item = await contentItemsService.updateContentItem(req.params.id, organizationId, input);
    successResponse(res, item);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/content-items/:id - Delete a content item
export const deleteContentItem: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const result = await contentItemsService.deleteContentItem(req.params.id, organizationId);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

// GET /api/content-types - Get all content types
export const getContentTypes: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const types = await contentItemsService.getContentTypes(organizationId);
    successResponse(res, types);
  } catch (error) {
    next(error);
  }
};

// GET /api/activity-item-types - Get all activity item types
export const getActivityItemTypes: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizationId = req.organizationId!;
    const types = await contentItemsService.getActivityItemTypes(organizationId);
    successResponse(res, types);
  } catch (error) {
    next(error);
  }
};
