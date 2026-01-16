import { Router } from 'express';
import multer from 'multer';
import * as projectsController from './projects.controller.js';
import * as planItemsController from '../plan-items/plan-items.controller.js';
import { validateBody, validateQuery } from '../../middleware/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuerySchema,
} from './projects.schema.js';
import {
  createPlanItemSchema,
  listPlanItemsQuerySchema,
} from '../plan-items/plan-items.schema.js';

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

export default router;
