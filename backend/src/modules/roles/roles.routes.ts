import { Router } from 'express';
import * as rolesController from './roles.controller.js';
import { validateBody, validateQuery } from '../../middleware/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import { requireOrgAdmin } from '../../middleware/rbac.js';
import {
  createRoleSchema,
  updateRoleSchema,
  updatePermissionsSchema,
  listRolesQuerySchema,
} from './roles.schema.js';

const router = Router();

// List roles
router.get(
  '/',
  authenticate,
  requireOrgContext,
  validateQuery(listRolesQuerySchema),
  rolesController.listRoles
);

// Get role details
router.get(
  '/:roleId',
  authenticate,
  requireOrgContext,
  rolesController.getRole
);

// Create custom role
router.post(
  '/',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateBody(createRoleSchema),
  rolesController.createRole
);

// Update role
router.patch(
  '/:roleId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateBody(updateRoleSchema),
  rolesController.updateRole
);

// Delete role
router.delete(
  '/:roleId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  rolesController.deleteRole
);

// Get role permissions
router.get(
  '/:roleId/permissions',
  authenticate,
  requireOrgContext,
  rolesController.getRolePermissions
);

// Update role permissions
router.put(
  '/:roleId/permissions',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateBody(updatePermissionsSchema),
  rolesController.updateRolePermissions
);

export default router;
