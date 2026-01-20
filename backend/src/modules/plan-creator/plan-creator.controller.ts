/**
 * Plan Creator Controller
 * HTTP handlers for AI-powered plan generation
 */

import type { RequestHandler } from 'express';
import { successResponse, ErrorCodes } from '../../utils/responses.js';
import { AppError } from '../../middleware/errorHandler.js';
import * as planCreatorService from './plan-creator.service.js';
import type { AnalyzePlanContentInput, CreatePlanFromSuggestionsInput } from './plan-creator.schema.js';

/**
 * Analyze content and generate plan suggestions
 * POST /api/projects/:projectId/plan/ai-analyze
 */
export const analyzePlanContent: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const organizationId = req.organizationId;

    if (!projectId || !organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Project ID and organization context required');
    }

    const input = req.body as AnalyzePlanContentInput;

    const result = await planCreatorService.analyzePlanContent(
      projectId,
      organizationId,
      input
    );

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Create plan items from accepted suggestions
 * POST /api/projects/:projectId/plan/ai-create
 */
export const createPlanFromSuggestions: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const organizationId = req.organizationId;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!projectId || !organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Project ID and organization context required');
    }

    const input = req.body as CreatePlanFromSuggestionsInput;

    const result = await planCreatorService.createPlanFromSuggestions(
      projectId,
      organizationId,
      input,
      userId,
      userEmail
    );

    successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export default {
  analyzePlanContent,
  createPlanFromSuggestions,
};
