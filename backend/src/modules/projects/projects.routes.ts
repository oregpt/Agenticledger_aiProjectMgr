import { Router } from 'express';
import * as projectsController from './projects.controller.js';
import { validateBody, validateQuery } from '../../middleware/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuerySchema,
} from './projects.schema.js';

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

export default router;
