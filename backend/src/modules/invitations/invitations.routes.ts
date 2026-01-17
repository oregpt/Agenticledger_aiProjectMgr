import { Router } from 'express';
import * as invitationsController from './invitations.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import { requireOrgAdmin } from '../../middleware/rbac.js';

const router = Router();

/**
 * @swagger
 * /invitations/{token}/validate:
 *   get:
 *     summary: Validate invitation token
 *     description: Public endpoint to validate an invitation token and get invitation details
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation token from email
 *     responses:
 *       200:
 *         description: Invitation is valid
 *       400:
 *         description: Invalid or expired invitation
 */
router.get('/:token/validate', invitationsController.validateInvitation);

/**
 * @swagger
 * /invitations:
 *   post:
 *     summary: Create invitation
 *     description: Send an invitation to join the organization (requires org admin)
 *     tags: [Invitations]
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
  '/',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  invitationsController.createInvitation
);

/**
 * @swagger
 * /invitations:
 *   get:
 *     summary: List invitations
 *     description: List all pending invitations for the organization (requires org admin)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
 *     responses:
 *       200:
 *         description: List of pending invitations
 *       403:
 *         description: Admin access required
 */
router.get(
  '/',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  invitationsController.listInvitations
);

/**
 * @swagger
 * /invitations/{invitationId}:
 *   delete:
 *     summary: Cancel invitation
 *     description: Cancel a pending invitation (requires org admin)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
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
  '/:invitationId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  invitationsController.cancelInvitation
);

/**
 * @swagger
 * /invitations/{invitationId}/resend:
 *   post:
 *     summary: Resend invitation
 *     description: Resend an invitation email (requires org admin)
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/OrganizationId'
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
  '/:invitationId/resend',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  invitationsController.resendInvitation
);

export default router;
