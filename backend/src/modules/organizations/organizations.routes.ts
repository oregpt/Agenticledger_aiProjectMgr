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

/**
 * @swagger
 * /organizations:
 *   get:
 *     summary: Get user's organizations
 *     description: Get all organizations the authenticated user belongs to
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of organizations the user belongs to
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticate,
  organizationsController.getMyOrganizations
);

/**
 * @swagger
 * /organizations/all:
 *   get:
 *     summary: List all organizations (Platform Admin)
 *     description: Platform admin endpoint to list all organizations on the platform
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by organization name
 *     responses:
 *       200:
 *         description: Paginated list of all organizations
 *       403:
 *         description: Platform admin access required
 */
router.get(
  '/all',
  authenticate,
  requireOrgContext, // Requires platform org context
  requirePlatformAdmin,
  validateQuery(listOrganizationsQuerySchema),
  organizationsController.getAllOrganizations
);

/**
 * @swagger
 * /organizations:
 *   post:
 *     summary: Create organization (Platform Admin)
 *     description: Platform admin endpoint to create a new organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Acme Corp"
 *               slug:
 *                 type: string
 *                 example: "acme-corp"
 *               description:
 *                 type: string
 *               logo:
 *                 type: string
 *                 description: URL to logo image
 *     responses:
 *       201:
 *         description: Organization created successfully
 *       403:
 *         description: Platform admin access required
 */
router.post(
  '/',
  authenticate,
  requireOrgContext,
  requirePlatformAdmin,
  validateBody(createOrganizationSchema),
  organizationsController.createOrganization
);

/**
 * @swagger
 * /organizations/{orgId}:
 *   get:
 *     summary: Get organization details
 *     description: Get details of a specific organization the user has access to
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization details
 *       404:
 *         description: Organization not found
 */
router.get(
  '/:orgId',
  authenticate,
  organizationsController.getOrganization
);

/**
 * @swagger
 * /organizations/{orgId}:
 *   patch:
 *     summary: Update organization
 *     description: Update organization details (requires org admin or platform admin)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               logo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Organization updated successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Organization not found
 */
router.patch(
  '/:orgId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateBody(updateOrganizationSchema),
  organizationsController.updateOrganization
);

/**
 * @swagger
 * /organizations/{orgId}/config:
 *   get:
 *     summary: Get organization config
 *     description: Get organization configuration settings (requires org admin)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization configuration
 *       403:
 *         description: Admin access required
 */
router.get(
  '/:orgId/config',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  organizationsController.getOrganizationConfig
);

/**
 * @swagger
 * /organizations/{orgId}/config:
 *   patch:
 *     summary: Update organization config
 *     description: Update organization configuration settings (requires org admin)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               defaultProjectVisibility:
 *                 type: string
 *                 enum: [private, org_only, public]
 *               allowUserInvites:
 *                 type: boolean
 *               aiFeatures:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       403:
 *         description: Admin access required
 */
router.patch(
  '/:orgId/config',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateBody(updateOrgConfigSchema),
  organizationsController.updateOrganizationConfig
);

/**
 * @swagger
 * /organizations/{orgId}:
 *   delete:
 *     summary: Delete organization (Platform Admin)
 *     description: Permanently delete an organization (platform admin only)
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID to delete
 *     responses:
 *       200:
 *         description: Organization deleted successfully
 *       403:
 *         description: Platform admin access required
 *       404:
 *         description: Organization not found
 */
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

/**
 * @swagger
 * /organizations/{orgId}/roles:
 *   get:
 *     summary: List organization roles
 *     description: Get all roles defined for an organization
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: List of roles
 */
router.get(
  '/:orgId/roles',
  authenticate,
  requireOrgContext,
  async (req: any, res, next) => {
    // Set organizationId from route param for the roles controller (as number)
    req.query.organizationId = parseInt(req.params.orgId, 10);
    next();
  },
  rolesController.listRoles
);

/**
 * @swagger
 * /organizations/{orgId}/roles/{roleId}:
 *   get:
 *     summary: Get role details
 *     description: Get details of a specific role including its permissions
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role details with permissions
 *       404:
 *         description: Role not found
 */
router.get(
  '/:orgId/roles/:roleId',
  authenticate,
  requireOrgContext,
  rolesController.getRole
);

/**
 * @swagger
 * /organizations/{orgId}/roles:
 *   post:
 *     summary: Create custom role
 *     description: Create a new custom role for the organization (requires org admin)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Project Lead"
 *               description:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of permission codes
 *     responses:
 *       201:
 *         description: Role created successfully
 *       403:
 *         description: Admin access required
 */
router.post(
  '/:orgId/roles',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateBody(createRoleSchema),
  rolesController.createRole
);

/**
 * @swagger
 * /organizations/{orgId}/roles/{roleId}:
 *   put:
 *     summary: Update role
 *     description: Update a custom role's name and description (requires org admin)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       403:
 *         description: Admin access required or cannot modify system roles
 *       404:
 *         description: Role not found
 */
router.put(
  '/:orgId/roles/:roleId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateBody(updateRoleSchema),
  rolesController.updateRole
);

/**
 * @swagger
 * /organizations/{orgId}/roles/{roleId}:
 *   delete:
 *     summary: Delete role
 *     description: Delete a custom role (requires org admin, cannot delete system roles)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       403:
 *         description: Admin access required or cannot delete system roles
 *       404:
 *         description: Role not found
 */
router.delete(
  '/:orgId/roles/:roleId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  rolesController.deleteRole
);

/**
 * @swagger
 * /organizations/{orgId}/roles/{roleId}/permissions:
 *   put:
 *     summary: Update role permissions
 *     description: Update the permissions assigned to a role (requires org admin)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of permission codes to assign
 *                 example: ["project:read", "project:create", "content:read"]
 *     responses:
 *       200:
 *         description: Permissions updated successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Role not found
 */
router.put(
  '/:orgId/roles/:roleId/permissions',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateBody(updatePermissionsSchema),
  rolesController.updateRolePermissions
);

export default router;
