/**
 * Config Controller
 * HTTP handlers for configuration type endpoints
 */

import type { RequestHandler } from 'express';
import { successResponse, ErrorCodes } from '../../utils/responses';
import { AppError } from '../../middleware/errorHandler';
import {
  CreatePlanItemTypeSchema,
  UpdatePlanItemTypeSchema,
  CreateContentTypeSchema,
  UpdateContentTypeSchema,
  CreateActivityTypeSchema,
  UpdateActivityTypeSchema,
  ListTypesQuerySchema,
} from './config.schema';
import * as configService from './config.service';

// ============ Plan Item Types ============

export const listPlanItemTypes: RequestHandler = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    if (!organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Organization context required', 400);
    }

    const query = ListTypesQuerySchema.parse(req.query);
    const result = await configService.listPlanItemTypes(organizationId, query);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getPlanItemType: RequestHandler = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const id = parseInt(req.params.id, 10);

    if (!organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Organization context required', 400);
    }

    if (isNaN(id)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid ID', 400);
    }

    const result = await configService.getPlanItemType(id, organizationId);
    if (!result) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Plan item type not found', 404);
    }

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const createPlanItemType: RequestHandler = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    if (!organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Organization context required', 400);
    }

    const input = CreatePlanItemTypeSchema.parse(req.body);
    const result = await configService.createPlanItemType(organizationId, input);
    successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const updatePlanItemType: RequestHandler = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const id = parseInt(req.params.id, 10);

    if (!organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Organization context required', 400);
    }

    if (isNaN(id)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid ID', 400);
    }

    const input = UpdatePlanItemTypeSchema.parse(req.body);
    const result = await configService.updatePlanItemType(id, organizationId, input);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const deletePlanItemType: RequestHandler = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const id = parseInt(req.params.id, 10);

    if (!organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Organization context required', 400);
    }

    if (isNaN(id)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid ID', 400);
    }

    await configService.deletePlanItemType(id, organizationId);
    successResponse(res, { deleted: true });
  } catch (error) {
    next(error);
  }
};

// ============ Content Types ============

export const listContentTypes: RequestHandler = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    if (!organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Organization context required', 400);
    }

    const query = ListTypesQuerySchema.parse(req.query);
    const result = await configService.listContentTypes(organizationId, query);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getContentType: RequestHandler = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const id = parseInt(req.params.id, 10);

    if (!organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Organization context required', 400);
    }

    if (isNaN(id)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid ID', 400);
    }

    const result = await configService.getContentType(id, organizationId);
    if (!result) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Content type not found', 404);
    }

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const createContentType: RequestHandler = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    if (!organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Organization context required', 400);
    }

    const input = CreateContentTypeSchema.parse(req.body);
    const result = await configService.createContentType(organizationId, input);
    successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const updateContentType: RequestHandler = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const id = parseInt(req.params.id, 10);

    if (!organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Organization context required', 400);
    }

    if (isNaN(id)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid ID', 400);
    }

    const input = UpdateContentTypeSchema.parse(req.body);
    const result = await configService.updateContentType(id, organizationId, input);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const deleteContentType: RequestHandler = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const id = parseInt(req.params.id, 10);

    if (!organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Organization context required', 400);
    }

    if (isNaN(id)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid ID', 400);
    }

    await configService.deleteContentType(id, organizationId);
    successResponse(res, { deleted: true });
  } catch (error) {
    next(error);
  }
};

// ============ Activity Types ============

export const listActivityTypes: RequestHandler = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    if (!organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Organization context required', 400);
    }

    const query = ListTypesQuerySchema.parse(req.query);
    const result = await configService.listActivityTypes(organizationId, query);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getActivityType: RequestHandler = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const id = parseInt(req.params.id, 10);

    if (!organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Organization context required', 400);
    }

    if (isNaN(id)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid ID', 400);
    }

    const result = await configService.getActivityType(id, organizationId);
    if (!result) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Activity type not found', 404);
    }

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const createActivityType: RequestHandler = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    if (!organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Organization context required', 400);
    }

    const input = CreateActivityTypeSchema.parse(req.body);
    const result = await configService.createActivityType(organizationId, input);
    successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const updateActivityType: RequestHandler = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const id = parseInt(req.params.id, 10);

    if (!organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Organization context required', 400);
    }

    if (isNaN(id)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid ID', 400);
    }

    const input = UpdateActivityTypeSchema.parse(req.body);
    const result = await configService.updateActivityType(id, organizationId, input);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const deleteActivityType: RequestHandler = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const id = parseInt(req.params.id, 10);

    if (!organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Organization context required', 400);
    }

    if (isNaN(id)) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid ID', 400);
    }

    await configService.deleteActivityType(id, organizationId);
    successResponse(res, { deleted: true });
  } catch (error) {
    next(error);
  }
};

export default {
  // Plan Item Types
  listPlanItemTypes,
  getPlanItemType,
  createPlanItemType,
  updatePlanItemType,
  deletePlanItemType,
  // Content Types
  listContentTypes,
  getContentType,
  createContentType,
  updateContentType,
  deleteContentType,
  // Activity Types
  listActivityTypes,
  getActivityType,
  createActivityType,
  updateActivityType,
  deleteActivityType,
};
