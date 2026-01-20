import { Router } from 'express';
import * as organizationsController from './organizations.controller.js';
import * as rolesController from '../roles/roles.controller.js';
import * as invitationsController from '../invitations/invitations.controller.js';
import * as featureFlagsController from '../feature-flags/feature-flags.controller.js';
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

// ============================================================================
// Organization Users Routes
// ============================================================================

/**
 * @swagger
 * /organizations/{orgId}/users:
 *   get:
 *     summary: Get organization users
 *     description: Get all users that belong to an organization (requires org admin)
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
 *         description: List of organization users
 *       403:
 *         description: Admin access required
 */
router.get(
  '/:orgId/users',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  organizationsController.getOrganizationUsers
);

/**
 * @swagger
 * /organizations/{orgId}/users/{userId}:
 *   delete:
 *     summary: Remove user from organization
 *     description: Remove a user from the organization (requires org admin)
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
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to remove
 *     responses:
 *       200:
 *         description: User removed from organization
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found in organization
 */
router.delete(
  '/:orgId/users/:userId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  organizationsController.removeOrganizationUser
);

// ============================================================================
// Nested Invitations Routes (under organization)
// ============================================================================

/**
 * @swagger
 * /organizations/{orgId}/invitations:
 *   get:
 *     summary: List organization invitations
 *     description: List all pending invitations for the organization (requires org admin)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: List of pending invitations
 *       403:
 *         description: Admin access required
 */
router.get(
  '/:orgId/invitations',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  async (req: any, res, next) => {
    // Override organizationId from route param for the invitations controller
    req.organizationId = parseInt(req.params.orgId, 10);
    next();
  },
  invitationsController.listInvitations
);

/**
 * @swagger
 * /organizations/{orgId}/invitations:
 *   post:
 *     summary: Create invitation
 *     description: Send an invitation to join the organization (requires org admin)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address to invite
 *               roleId:
 *                 type: integer
 *                 description: Role to assign to invited user
 *     responses:
 *       201:
 *         description: Invitation sent successfully
 *       400:
 *         description: User already invited or is a member
 *       403:
 *         description: Admin access required
 */
router.post(
  '/:orgId/invitations',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  async (req: any, res, next) => {
    // Override organizationId from route param for the invitations controller
    req.organizationId = parseInt(req.params.orgId, 10);
    next();
  },
  invitationsController.createInvitation
);

/**
 * @swagger
 * /organizations/{orgId}/invitations/{invitationId}:
 *   delete:
 *     summary: Cancel invitation
 *     description: Cancel a pending invitation (requires org admin)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation cancelled
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Invitation not found
 */
router.delete(
  '/:orgId/invitations/:invitationId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  async (req: any, res, next) => {
    // Override organizationId from route param for the invitations controller
    req.organizationId = parseInt(req.params.orgId, 10);
    next();
  },
  invitationsController.cancelInvitation
);

/**
 * @swagger
 * /organizations/{orgId}/invitations/{invitationId}/resend:
 *   post:
 *     summary: Resend invitation
 *     description: Resend an invitation email (requires org admin)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *       - in: path
 *         name: invitationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invitation ID
 *     responses:
 *       200:
 *         description: Invitation resent
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Invitation not found
 */
router.post(
  '/:orgId/invitations/:invitationId/resend',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  async (req: any, res, next) => {
    // Override organizationId from route param for the invitations controller
    req.organizationId = parseInt(req.params.orgId, 10);
    next();
  },
  invitationsController.resendInvitation
);

// ============================================================================
// Nested Feature Flags Routes (under organization)
// ============================================================================

/**
 * @swagger
 * /organizations/{orgId}/feature-flags:
 *   get:
 *     summary: Get organization feature flags
 *     description: Get feature flags and their settings for an organization
 *     tags: [Feature Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization's feature flags
 */
router.get(
  '/:orgId/feature-flags',
  authenticate,
  requireOrgContext,
  async (req: any, res, next) => {
    // Set organizationId from route param for the feature flags controller
    req.params.orgId = req.params.orgId;
    next();
  },
  featureFlagsController.getOrganizationFeatureFlags
);

/**
 * @swagger
 * /organizations/{orgId}/feature-flags/{flagId}:
 *   put:
 *     summary: Update organization feature flag
 *     description: Enable or disable a feature flag for an organization (requires org admin)
 *     tags: [Feature Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *       - in: path
 *         name: flagId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Feature flag ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: Whether to enable or disable the flag
 *     responses:
 *       200:
 *         description: Feature flag updated
 *       403:
 *         description: Admin access required
 */
router.put(
  '/:orgId/feature-flags/:flagId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  async (req: any, res, next) => {
    // Map 'enabled' to expected body format for the feature flags controller
    if (req.body.enabled !== undefined) {
      req.body.orgEnabled = req.body.enabled;
    }
    next();
  },
  featureFlagsController.updateOrganizationFeatureFlag
);

// ============================================================================
// AI Settings Routes (under organization)
// ============================================================================

/**
 * @swagger
 * /organizations/{orgId}/ai-settings:
 *   get:
 *     summary: Get organization AI settings
 *     description: Get AI provider configuration for the organization (requires org admin)
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
 *         description: AI settings (overrides and effective)
 *       403:
 *         description: Admin access required
 */
router.get(
  '/:orgId/ai-settings',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  organizationsController.getOrgAISettings
);

/**
 * @swagger
 * /organizations/{orgId}/ai-settings:
 *   patch:
 *     summary: Update organization AI settings
 *     description: Set organization-specific AI provider configuration (requires org admin)
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
 *               provider:
 *                 type: string
 *                 enum: [openai, anthropic]
 *               openaiApiKey:
 *                 type: string
 *               openaiModel:
 *                 type: string
 *               anthropicApiKey:
 *                 type: string
 *               anthropicModel:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI settings updated
 *       403:
 *         description: Admin access required
 */
router.patch(
  '/:orgId/ai-settings',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  organizationsController.updateOrgAISettings
);

/**
 * @swagger
 * /organizations/{orgId}/ai-settings:
 *   delete:
 *     summary: Clear organization AI settings
 *     description: Remove organization-specific AI settings, reverting to platform defaults (requires org admin)
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
 *         description: AI settings cleared
 *       403:
 *         description: Admin access required
 */
router.delete(
  '/:orgId/ai-settings',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  organizationsController.clearOrgAISettings
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
