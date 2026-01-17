/**
 * Activity Reporter Routes
 * Routes for activity report generation and retrieval
 */

import { Router } from 'express';
import { validateBody, validateQuery } from '../../middleware/validation';
import * as activityReporterController from './activity-reporter.controller';
import { generateReportSchema, listReportsQuerySchema } from './activity-reporter.schema';

const router = Router({ mergeParams: true }); // mergeParams to access :projectId from parent router

/**
 * @swagger
 * /projects/{projectId}/activity-report:
 *   post:
 *     summary: Generate activity report
 *     description: Generate a new AI-powered activity report for the project
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               planItemIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional filter by specific plan items
 *     responses:
 *       201:
 *         description: Report generated successfully
 */
router.post(
  '/activity-report',
  validateBody(generateReportSchema),
  activityReporterController.generateReport
);

/**
 * @swagger
 * /projects/{projectId}/activity-reports:
 *   get:
 *     summary: List activity reports
 *     description: List all activity reports for a project
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project UUID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of activity reports
 */
router.get(
  '/activity-reports',
  validateQuery(listReportsQuerySchema),
  activityReporterController.listReports
);

/**
 * @swagger
 * /projects/{projectId}/activity-reports/{reportId}:
 *   get:
 *     summary: Get activity report
 *     description: Get a specific activity report by ID
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project UUID
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report UUID
 *     responses:
 *       200:
 *         description: Activity report details
 *       404:
 *         description: Report not found
 */
router.get(
  '/activity-reports/:reportId',
  activityReporterController.getReport
);

/**
 * @swagger
 * /projects/{projectId}/activity-reports/{reportId}/sources:
 *   get:
 *     summary: Get report sources
 *     description: Get the content items used as sources for a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project UUID
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report UUID
 *     responses:
 *       200:
 *         description: List of source content items
 */
router.get(
  '/activity-reports/:reportId/sources',
  activityReporterController.getReportSources
);

export default router;
