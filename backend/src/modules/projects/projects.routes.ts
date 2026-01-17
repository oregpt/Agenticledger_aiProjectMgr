import { Router } from 'express';
import multer from 'multer';
import * as projectsController from './projects.controller';
import * as planItemsController from '../plan-items/plan-items.controller';
import * as contentItemsController from '../content-items/content-items.controller';
import * as activityReporterController from '../activity-reporter/activity-reporter.controller';
import * as planUpdaterController from '../plan-updater/plan-updater.controller';
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

// GET /api/projects - List all projects for the organization
router.get(
  '/',
  validateQuery(listProjectsQuerySchema),
  projectsController.listProjects
);

// ============================================================================
// Type Lookups (must be before :id routes to avoid routing conflicts)
// ============================================================================

// GET /api/projects/lookup/content-types - Get all content types
router.get(
  '/lookup/content-types',
  contentItemsController.getContentTypes
);

// GET /api/projects/lookup/activity-item-types - Get all activity item types
router.get(
  '/lookup/activity-item-types',
  contentItemsController.getActivityItemTypes
);

// GET /api/projects/:id - Get a single project
router.get(
  '/:id',
  projectsController.getProject
);

// POST /api/projects - Create a new project
router.post(
  '/',
  validateBody(createProjectSchema),
  projectsController.createProject
);

// PUT /api/projects/:id - Update a project
router.put(
  '/:id',
  validateBody(updateProjectSchema),
  projectsController.updateProject
);

// DELETE /api/projects/:id - Soft delete a project
router.delete(
  '/:id',
  projectsController.deleteProject
);

// ============================================================================
// Dashboard Routes (under project)
// ============================================================================

// GET /api/projects/:projectId/dashboard - Get project dashboard with statistics
router.get(
  '/:projectId/dashboard',
  projectsController.getProjectDashboard
);

// ============================================================================
// Nested Plan Routes (under project)
// ============================================================================

// GET /api/projects/:projectId/plan - Get full plan tree for project
router.get(
  '/:projectId/plan',
  validateQuery(listPlanItemsQuerySchema),
  planItemsController.getProjectPlan
);

// POST /api/projects/:projectId/plan - Create a new plan item in project
router.post(
  '/:projectId/plan',
  validateBody(createPlanItemSchema),
  planItemsController.createPlanItem
);

// POST /api/projects/:projectId/plan/import/preview - Preview CSV import
router.post(
  '/:projectId/plan/import/preview',
  upload.single('file'),
  planItemsController.previewCsvImport
);

// POST /api/projects/:projectId/plan/import - Import plan items from CSV
router.post(
  '/:projectId/plan/import',
  upload.single('file'),
  planItemsController.importPlanItems
);

// ============================================================================
// Nested Content Routes (under project)
// ============================================================================

// GET /api/projects/:projectId/content - List content items for project
router.get(
  '/:projectId/content',
  validateQuery(listContentItemsQuerySchema),
  contentItemsController.getProjectContent
);

// ============================================================================
// Nested Activity Report Routes (under project)
// ============================================================================

// POST /api/projects/:projectId/activity-report - Generate a new activity report
router.post(
  '/:projectId/activity-report',
  validateBody(generateReportSchema),
  activityReporterController.generateReport
);

// GET /api/projects/:projectId/activity-reports - List activity reports
router.get(
  '/:projectId/activity-reports',
  validateQuery(listReportsQuerySchema),
  activityReporterController.listReports
);

// GET /api/projects/:projectId/activity-reports/:reportId - Get single report
router.get(
  '/:projectId/activity-reports/:reportId',
  activityReporterController.getReport
);

// GET /api/projects/:projectId/activity-reports/:reportId/sources - Get report sources
router.get(
  '/:projectId/activity-reports/:reportId/sources',
  activityReporterController.getReportSources
);

// ============================================================================
// Nested Plan Updater Routes (under project)
// ============================================================================

// POST /api/projects/:projectId/plan-suggestions - Get AI plan update suggestions
router.post(
  '/:projectId/plan-suggestions',
  validateBody(getPlanSuggestionsSchema),
  planUpdaterController.getPlanSuggestions
);

// POST /api/projects/:projectId/plan-updates - Apply selected plan updates
router.post(
  '/:projectId/plan-updates',
  validateBody(applyPlanUpdatesSchema),
  planUpdaterController.applyPlanUpdates
);

export default router;
