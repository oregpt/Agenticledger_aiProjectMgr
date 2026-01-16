import { Router } from 'express';
import * as organizationsController from './organizations.controller.js';
import * as rolesController from '../roles/roles.controller.js';
import { validateBody, validateQuery } from '../../middleware/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import { requireOrgAdmin, requirePlatformAdmin } from '../../middleware/rbac.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  updateOrgConfigSchema,
  listOrganizationsQuerySchema,
} from './organizations.schema.js';
import {
  createRoleSchema,
  updateRoleSchema,
  updatePermissionsSchema,
} from '../roles/roles.schema.js';

const router = Router();

// Get user's organizations
router.get(
  '/',
  authenticate,
  organizationsController.getMyOrganizations
);

// Platform admin: Get all organizations
router.get(
  '/all',
  authenticate,
  requireOrgContext, // Requires platform org context
  requirePlatformAdmin,
  validateQuery(listOrganizationsQuerySchema),
  organizationsController.getAllOrganizations
);

// Platform admin: Create organization
router.post(
  '/',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  validateBody(createOrganizationSchema),
  organizationsController.createOrganization
);

// Get specific organization
router.get(
  '/:orgId',
  authenticate,
  organizationsController.getOrganization
);

// Update organization (org admin or platform admin)
router.patch(
  '/:orgId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateBody(updateOrganizationSchema),
  organizationsController.updateOrganization
);

// Get organization config
router.get(
  '/:orgId/config',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  organizationsController.getOrganizationConfig
);

// Update organization config
router.patch(
  '/:orgId/config',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateBody(updateOrgConfigSchema),
  organizationsController.updateOrganizationConfig
);

// Delete organization (platform admin only)
router.delete(
  '/:orgId',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  organizationsController.deleteOrganization
);

// ============================================================================
// Nested Roles Routes (under organization)
// ============================================================================

// List roles for organization
router.get(
  '/:orgId/roles',
  authenticate,
  requireOrgContext,
  async (req, res, next) => {
    // Set organizationId from route param for the roles controller (as number)
    (req.query as any).organizationId = parseInt(req.params.orgId, 10);
    next();
  },
  rolesController.listRoles
);

// Get role details
router.get(
  '/:orgId/roles/:roleId',
  authenticate,
  requireOrgContext,
  rolesController.getRole
);

// Create custom role
router.post(
  '/:orgId/roles',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateBody(createRoleSchema),
  rolesController.createRole
);

// Update role
router.put(
  '/:orgId/roles/:roleId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateBody(updateRoleSchema),
  rolesController.updateRole
);

// Delete role
router.delete(
  '/:orgId/roles/:roleId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  rolesController.deleteRole
);

// Update role permissions
router.put(
  '/:orgId/roles/:roleId/permissions',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateBody(updatePermissionsSchema),
  rolesController.updateRolePermissions
);

export default router;
