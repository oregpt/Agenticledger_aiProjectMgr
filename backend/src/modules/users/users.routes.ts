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

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 description: URL to avatar image
 *               timezone:
 *                 type: string
 *                 example: "America/New_York"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/me',
  authenticate,
  validateBody(updateProfileSchema),
  usersController.updateProfile
);

// Organization user management routes (requires org context)

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List organization users
 *     description: List all users in the organization (requires org admin)
 *     tags: [Users]
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
 *         description: Search by name or email
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: integer
 *         description: Filter by role ID
 *     responses:
 *       200:
 *         description: Paginated list of users
 *       403:
 *         description: Admin access required
 */
router.get(
  '/',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateQuery(listUsersQuerySchema),
  usersController.listUsers
);

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get user details
 *     description: Get details of a specific user in the organization (requires org admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID
 *     responses:
 *       200:
 *         description: User details
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
router.get(
  '/:userId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  usersController.getUser
);

/**
 * @swagger
 * /users/{userId}/role:
 *   patch:
 *     summary: Update user role
 *     description: Change a user's role in the organization (requires org admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: integer
 *                 description: New role ID to assign to user
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User or role not found
 */
router.patch(
  '/:userId/role',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  validateBody(updateUserRoleSchema),
  usersController.updateUserRole
);

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Remove user from organization
 *     description: Remove a user's membership from the organization (requires org admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User UUID
 *     responses:
 *       200:
 *         description: User removed from organization
 *       403:
 *         description: Admin access required or cannot remove yourself
 *       404:
 *         description: User not found
 */
router.delete(
  '/:userId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  usersController.removeUser
);

export default router;
