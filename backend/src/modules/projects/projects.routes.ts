import { Router } from 'express';
import multer from 'multer';
import * as projectsController from './projects.controller';
import * as planItemsController from '../plan-items/plan-items.controller';
import * as contentItemsController from '../content-items/content-items.controller';
import * as activityReporterController from '../activity-reporter/activity-reporter.controller';
import * as planUpdaterController from '../plan-updater/plan-updater.controller';
import * as planCreatorController from '../plan-creator/plan-creator.controller';
import { validateBody, validateQuery } from '../../middleware/validation';
import { authenticate } from '../../middleware/auth';
import { requireOrgContext } from '../../middleware/orgContext';
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuerySchema,
} from './projects.schema';
import {
  createPlanItemSchema,
  listPlanItemsQuerySchema,
} from '../plan-items/plan-items.schema';
import {
  listContentItemsQuerySchema,
} from '../content-items/content-items.schema';
import {
  generateReportSchema,
  listReportsQuerySchema,
} from '../activity-reporter/activity-reporter.schema';
import {
  getPlanSuggestionsSchema,
  applyPlanUpdatesSchema,
} from '../plan-updater/plan-updater.schema';
import {
  analyzePlanContentSchema,
  createPlanFromSuggestionsSchema,
} from '../plan-creator/plan-creator.schema';

// Configure multer for CSV upload (memory storage, 5MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

const router = Router();

// All project routes require authentication and organization context
router.use(authenticate);
router.use(requireOrgContext);

/**
 * @swagger
 * /projects:
 *   get:
 *     summary: List all projects
 *     description: Get all projects for the current organization with pagination
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by project name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, on_hold, cancelled]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  validateQuery(listProjectsQuerySchema),
  projectsController.listProjects
);

// ============================================================================
// Type Lookups (must be before :id routes to avoid routing conflicts)
// ============================================================================

/**
 * @swagger
 * /projects/lookup/content-types:
 *   get:
 *     summary: Get all content types
 *     description: Retrieve available content types for classifying content items
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: List of content types
 */
router.get(
  '/lookup/content-types',
  contentItemsController.getContentTypes
);

/**
 * @swagger
 * /projects/lookup/activity-item-types:
 *   get:
 *     summary: Get all activity item types
 *     description: Retrieve available activity item types (action items, blockers, decisions, etc.)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: List of activity item types
 */
router.get(
  '/lookup/activity-item-types',
  contentItemsController.getActivityItemTypes
);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     summary: Get a project by ID
 *     description: Retrieve a single project with its details
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project UUID
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 */
router.get(
  '/:id',
  projectsController.getProject
);

/**
 * @swagger
 * /projects:
 *   post:
 *     summary: Create a new project
 *     description: Create a new project in the organization
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - startDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Q1 Marketing Campaign"
 *               client:
 *                 type: string
 *                 example: "Acme Corp"
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-01-15"
 *               targetEndDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [active, completed, on_hold, cancelled]
 *                 default: active
 *     responses:
 *       201:
 *         description: Project created
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  validateBody(createProjectSchema),
  projectsController.createProject
);

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     summary: Update a project
 *     description: Update an existing project's details
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *               client:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               targetEndDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [active, completed, on_hold, cancelled]
 *     responses:
 *       200:
 *         description: Project updated
 *       404:
 *         description: Project not found
 */
router.put(
  '/:id',
  validateBody(updateProjectSchema),
  projectsController.updateProject
);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     description: Soft delete a project (sets isActive to false)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project UUID
 *     responses:
 *       200:
 *         description: Project deleted
 *       404:
 *         description: Project not found
 */
router.delete(
  '/:id',
  projectsController.deleteProject
);

// ============================================================================
// Dashboard Routes (under project)
// ============================================================================

/**
 * @swagger
 * /projects/{projectId}/dashboard:
 *   get:
 *     summary: Get project dashboard
 *     description: Retrieve project statistics and overview for dashboard display
 *     tags: [Projects]
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
 *     responses:
 *       200:
 *         description: Dashboard data with statistics
 */
router.get(
  '/:projectId/dashboard',
  projectsController.getProjectDashboard
);

// ============================================================================
// Nested Plan Routes (under project)
// ============================================================================

/**
 * @swagger
 * /projects/{projectId}/plan:
 *   get:
 *     summary: Get project plan tree
 *     description: Retrieve the full hierarchical plan tree for a project
 *     tags: [Plan Items]
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
 *         name: includeCompleted
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include completed items
 *     responses:
 *       200:
 *         description: Hierarchical plan tree
 */
router.get(
  '/:projectId/plan',
  validateQuery(listPlanItemsQuerySchema),
  planItemsController.getProjectPlan
);

/**
 * @swagger
 * /projects/{projectId}/plan:
 *   post:
 *     summary: Create a plan item
 *     description: Create a new plan item (workstream, milestone, activity, task, or subtask)
 *     tags: [Plan Items]
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
 *             required:
 *               - name
 *               - planItemTypeId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Backend Development"
 *               description:
 *                 type: string
 *               planItemTypeId:
 *                 type: integer
 *                 description: Plan item type ID (workstream, milestone, etc.)
 *               parentId:
 *                 type: string
 *                 description: Parent plan item UUID for nesting
 *               status:
 *                 type: string
 *                 enum: [not_started, in_progress, completed, blocked]
 *                 default: not_started
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Plan item created
 *       400:
 *         description: Validation error
 */
router.post(
  '/:projectId/plan',
  validateBody(createPlanItemSchema),
  planItemsController.createPlanItem
);

/**
 * @swagger
 * /projects/{projectId}/plan/import/preview:
 *   post:
 *     summary: Preview CSV import
 *     description: Preview plan items from a CSV file before importing
 *     tags: [Plan Items]
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file to preview
 *     responses:
 *       200:
 *         description: Preview of items to be imported
 */
router.post(
  '/:projectId/plan/import/preview',
  upload.single('file'),
  planItemsController.previewCsvImport
);

/**
 * @swagger
 * /projects/{projectId}/plan/import:
 *   post:
 *     summary: Import plan items from CSV
 *     description: Bulk import plan items from a CSV file
 *     tags: [Plan Items]
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file to import
 *     responses:
 *       200:
 *         description: Import results
 */
router.post(
  '/:projectId/plan/import',
  upload.single('file'),
  planItemsController.importPlanItems
);

// ============================================================================
// Nested Plan Creator Routes (AI-powered plan generation)
// ============================================================================

/**
 * @swagger
 * /projects/{projectId}/plan/ai-analyze:
 *   post:
 *     summary: Analyze content and generate plan suggestions
 *     description: Use AI to analyze project requirements/content and generate a structured plan
 *     tags: [Plan Items]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Project requirements, description, or content to analyze
 *               additionalContext:
 *                 type: string
 *                 description: Additional context for the AI (optional)
 *     responses:
 *       200:
 *         description: AI-generated plan structure suggestions
 */
router.post(
  '/:projectId/plan/ai-analyze',
  validateBody(analyzePlanContentSchema),
  planCreatorController.analyzePlanContent
);

/**
 * @swagger
 * /projects/{projectId}/plan/ai-create:
 *   post:
 *     summary: Create plan items from AI suggestions
 *     description: Create plan items from the accepted AI-generated suggestions
 *     tags: [Plan Items]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planItems
 *             properties:
 *               planItems:
 *                 type: array
 *                 description: Plan items to create (may include children)
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - itemType
 *                   properties:
 *                     name:
 *                       type: string
 *                     itemType:
 *                       type: string
 *                       enum: [workstream, milestone, activity, task, subtask]
 *                     description:
 *                       type: string
 *                     owner:
 *                       type: string
 *                     children:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PlanItemToCreate'
 *     responses:
 *       201:
 *         description: Plan items created successfully
 */
router.post(
  '/:projectId/plan/ai-create',
  validateBody(createPlanFromSuggestionsSchema),
  planCreatorController.createPlanFromSuggestions
);

// ============================================================================
// Nested Content Routes (under project)
// ============================================================================

/**
 * @swagger
 * /projects/{projectId}/content:
 *   get:
 *     summary: List project content items
 *     description: Retrieve content items (meetings, notes, transcripts) for a project
 *     tags: [Content Items]
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
 *       - in: query
 *         name: contentTypeId
 *         schema:
 *           type: integer
 *         description: Filter by content type
 *     responses:
 *       200:
 *         description: List of content items
 */
router.get(
  '/:projectId/content',
  validateQuery(listContentItemsQuerySchema),
  contentItemsController.getProjectContent
);

// ============================================================================
// Nested Activity Report Routes (under project)
// ============================================================================

/**
 * @swagger
 * /projects/{projectId}/activity-report:
 *   post:
 *     summary: Generate activity report
 *     description: Generate an AI-powered activity report for a date range using RAG
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-01-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2026-01-15"
 *               focusAreas:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional focus areas for the report
 *     responses:
 *       201:
 *         description: Report generated
 */
router.post(
  '/:projectId/activity-report',
  validateBody(generateReportSchema),
  activityReporterController.generateReport
);

/**
 * @swagger
 * /projects/{projectId}/activity-reports:
 *   get:
 *     summary: List activity reports
 *     description: Get all activity reports for a project
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
  '/:projectId/activity-reports',
  validateQuery(listReportsQuerySchema),
  activityReporterController.listReports
);

/**
 * @swagger
 * /projects/{projectId}/activity-reports/{reportId}:
 *   get:
 *     summary: Get activity report
 *     description: Retrieve a single activity report with its content
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
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity report details
 *       404:
 *         description: Report not found
 */
router.get(
  '/:projectId/activity-reports/:reportId',
  activityReporterController.getReport
);

/**
 * @swagger
 * /projects/{projectId}/activity-reports/{reportId}/sources:
 *   get:
 *     summary: Get report sources
 *     description: Get the content items that were used as sources for the report
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
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of source content items
 */
router.get(
  '/:projectId/activity-reports/:reportId/sources',
  activityReporterController.getReportSources
);

// ============================================================================
// Nested Plan Updater Routes (under project)
// ============================================================================

/**
 * @swagger
 * /projects/{projectId}/plan-suggestions:
 *   post:
 *     summary: Get AI plan suggestions
 *     description: Get AI-generated suggestions for updating the project plan based on recent content
 *     tags: [Plan Items]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               contentItemIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific content items to analyze (optional)
 *     responses:
 *       200:
 *         description: List of suggested plan updates
 */
router.post(
  '/:projectId/plan-suggestions',
  validateBody(getPlanSuggestionsSchema),
  planUpdaterController.getPlanSuggestions
);

/**
 * @swagger
 * /projects/{projectId}/plan-updates:
 *   post:
 *     summary: Apply plan updates
 *     description: Apply selected plan update suggestions to the project plan
 *     tags: [Plan Items]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     planItemId:
 *                       type: string
 *                     action:
 *                       type: string
 *                       enum: [update_status, add_note, create_item]
 *                     data:
 *                       type: object
 *     responses:
 *       200:
 *         description: Updates applied successfully
 */
router.post(
  '/:projectId/plan-updates',
  validateBody(applyPlanUpdatesSchema),
  planUpdaterController.applyPlanUpdates
);

export default router;
