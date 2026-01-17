/**
 * Activity Reporter Controller
 * HTTP handlers for activity report generation and retrieval
 */

import type { RequestHandler } from 'express';
import { successResponse, ErrorCodes } from '../../utils/responses';
import { AppError } from '../../middleware/errorHandler';
import * as activityReporterService from './activity-reporter.service';
import type { GenerateReportInput, ListReportsQuery } from './activity-reporter.schema';

/**
 * Generate a new activity report
 * POST /api/projects/:projectId/activity-report
 */
export const generateReport: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const organizationId = req.organizationId;
    const userId = req.user?.id;

    if (!projectId || !organizationId) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Project ID and organization context required',
        400
      );
    }

    const input = req.body as GenerateReportInput;

    const result = await activityReporterService.generateReport(
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
 * List activity reports for a project
 * GET /api/projects/:projectId/activity-reports
 */
export const listReports: RequestHandler = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const organizationId = req.organizationId;

    if (!projectId || !organizationId) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Project ID and organization context required',
        400
      );
    }

    const query = req.query as unknown as ListReportsQuery;

    const result = await activityReporterService.listReports(
      projectId,
      organizationId,
      query
    );

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single activity report
 * GET /api/projects/:projectId/activity-reports/:reportId
 */
export const getReport: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, reportId } = req.params;
    const organizationId = req.organizationId;

    if (!projectId || !reportId || !organizationId) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Project ID, Report ID and organization context required',
        400
      );
    }

    const result = await activityReporterService.getReport(
      reportId,
      projectId,
      organizationId
    );

    if (!result) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Report not found', 404);
    }

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get source content items for a report
 * GET /api/projects/:projectId/activity-reports/:reportId/sources
 */
export const getReportSources: RequestHandler = async (req, res, next) => {
  try {
    const { projectId, reportId } = req.params;
    const organizationId = req.organizationId;

    if (!projectId || !reportId || !organizationId) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        'Project ID, Report ID and organization context required',
        400
      );
    }

    const result = await activityReporterService.getReportSources(
      reportId,
      projectId,
      organizationId
    );

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export default {
  generateReport,
  listReports,
  getReport,
  getReportSources,
};
