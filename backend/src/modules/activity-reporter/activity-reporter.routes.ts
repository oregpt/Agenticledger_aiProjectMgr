/**
 * Activity Reporter Routes
 * Routes for activity report generation and retrieval
 */

import { Router } from 'express';
import { validateBody, validateQuery } from '../../middleware/validation';
import * as activityReporterController from './activity-reporter.controller';
import { generateReportSchema, listReportsQuerySchema } from './activity-reporter.schema';

const router = Router({ mergeParams: true }); // mergeParams to access :projectId from parent router

// POST /api/projects/:projectId/activity-report - Generate a new report
router.post(
  '/activity-report',
  validateBody(generateReportSchema),
  activityReporterController.generateReport
);

// GET /api/projects/:projectId/activity-reports - List reports
router.get(
  '/activity-reports',
  validateQuery(listReportsQuerySchema),
  activityReporterController.listReports
);

// GET /api/projects/:projectId/activity-reports/:reportId - Get single report
router.get(
  '/activity-reports/:reportId',
  activityReporterController.getReport
);

// GET /api/projects/:projectId/activity-reports/:reportId/sources - Get report sources
router.get(
  '/activity-reports/:reportId/sources',
  activityReporterController.getReportSources
);

export default router;
