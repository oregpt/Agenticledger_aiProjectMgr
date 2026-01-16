import { Router } from 'express';
import * as invitationsController from './invitations.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOrgContext } from '../../middleware/orgContext.js';
import { requireOrgAdmin } from '../../middleware/rbac.js';

const router = Router();

// Validate invitation (public endpoint)
router.get('/:token/validate', invitationsController.validateInvitation);

// Create invitation (org admin)
router.post(
  '/',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  invitationsController.createInvitation
);

// List pending invitations
router.get(
  '/',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  invitationsController.listInvitations
);

// Cancel invitation
router.delete(
  '/:invitationId',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  invitationsController.cancelInvitation
);

// Resend invitation
router.post(
  '/:invitationId/resend',
  authenticate,
  requireOrgContext,
  requireOrgAdmin,
  invitationsController.resendInvitation
);

export default router;
