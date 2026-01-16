import { Router } from 'express';
import * as usersController from './users.controller.js';
import { validateBody, validateQuery } from '../../middleware/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import { requireOrgAdmin } from '../../middleware/rbac.js';
import {
  updateProfileSchema,
  updateUserRoleSchema,
  listUsersQuerySchema,
} from './users.schema.js';

const router = Router();

// Profile routes (authenticated user)
router.patch(
  '/me',
  authenticate,
  validateBody(updateProfileSchema),
  usersController.updateProfile
);

// Organization user management routes (requires org context)
router.get(
  '/',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateQuery(listUsersQuerySchema),
  usersController.listUsers
);

router.get(
  '/:userId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  usersController.getUser
);

router.patch(
  '/:userId/role',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateBody(updateUserRoleSchema),
  usersController.updateUserRole
);

router.delete(
  '/:userId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  usersController.removeUser
);

export default router;
