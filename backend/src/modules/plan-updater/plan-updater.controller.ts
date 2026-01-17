/**
 * Plan Updater Controller
 * HTTP handlers for plan suggestion and update operations
 */

import type { RequestHandler } from 'express';
import { successResponse, ErrorCodes } from '../../utils/responses';
import { AppError } from '../../middleware/errorHandler';
import * as planUpdaterService from './plan-updater.service';
import type { GetPlanSuggestionsInput, ApplyPlanUpdatesInput } from './plan-updater.schema';

/**
 * Get AI-generated plan update suggestions
 * POST /api/projects/:projectId/plan-suggestions
 */
export const getPlanSuggestions: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const organizationId = req.organizationId;
    const userId = req.user?.id;

    if (!projectId || !organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Project ID and organization context required');
    }

    const input = req.body as GetPlanSuggestionsInput;

    const result = await planUpdaterService.getPlanSuggestions(
      projectId,
      organizationId,
      input,
      userId
    );

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Apply selected plan updates
 * POST /api/projects/:projectId/plan-updates
 */
export const applyPlanUpdates: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const organizationId = req.organizationId;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!projectId || !organizationId) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Project ID and organization context required');
    }

    const input = req.body as ApplyPlanUpdatesInput;

    const result = await planUpdaterService.applyPlanUpdates(
      projectId,
      organizationId,
      input,
      userId,
      userEmail
    );

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export default {
  getPlanSuggestions,
  applyPlanUpdates,
};
