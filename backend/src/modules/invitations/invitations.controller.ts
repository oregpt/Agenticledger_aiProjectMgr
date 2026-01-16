import { Request, Response, NextFunction } from 'express';
import * as invitationsService from './invitations.service.js';
import { successResponse } from '../../utils/responses.js';

export const createInvitation = async (
  req: Request<{}, {}, { email: string; roleId: number }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const invitation = await invitationsService.createInvitation(
      req.body.email,
      req.organizationId!,
      req.body.roleId,
      req.user!.id
    );
    successResponse(res, invitation, 201);
  } catch (error) {
    next(error);
  }
};

export const listInvitations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const invitations = await invitationsService.listOrganizationInvitations(req.organizationId!);
    successResponse(res, invitations);
  } catch (error) {
    next(error);
  }
};

export const validateInvitation = async (
  req: Request<{ token: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await invitationsService.validateInvitation(req.params.token);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const cancelInvitation = async (
  req: Request<{ invitationId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const invitationId = parseInt(req.params.invitationId, 10);
    const result = await invitationsService.cancelInvitation(invitationId, req.organizationId!);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const resendInvitation = async (
  req: Request<{ invitationId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const invitationId = parseInt(req.params.invitationId, 10);
    const result = await invitationsService.resendInvitation(invitationId, req.organizationId!);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};
