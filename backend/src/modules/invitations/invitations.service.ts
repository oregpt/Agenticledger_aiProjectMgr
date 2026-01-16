import prisma from '../../config/database.js';
import config from '../../config/index.js';
import { generateInvitationToken } from '../../services/token/token.service.js';
import emailService from '../../services/email/email.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ErrorCodes } from '../../utils/responses.js';
import { getSettingValue } from '../platform-settings/platform-settings.service.js';

export const createInvitation = async (
  email: string,
  organizationId: number,
  roleId: number,
  invitedById: number
) => {
  // Check if invitations are enabled
  const invitationsEnabled = await getSettingValue('invitation_enabled', 'true');
  if (invitationsEnabled === 'false') {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Email invitations are currently disabled', 403);
  }

  // Check if user already exists in organization
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    const existingMembership = await prisma.organizationUser.findUnique({
      where: {
        userId_organizationId: {
          userId: existingUser.id,
          organizationId,
        },
      },
    });

    if (existingMembership) {
      throw new AppError(ErrorCodes.CONFLICT, 'User is already a member of this organization', 409);
    }
  }

  // Check for existing pending invitation
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      email: email.toLowerCase(),
      organizationId,
      status: 'PENDING',
    },
  });

  if (existingInvitation) {
    throw new AppError(ErrorCodes.CONFLICT, 'An invitation has already been sent to this email', 409);
  }

  // Verify role exists
  const role = await prisma.role.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Role not found', 404);
  }

  // Get organization
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!organization) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Organization not found', 404);
  }

  // Get inviter
  const inviter = await prisma.user.findUnique({
    where: { id: invitedById },
  });

  if (!inviter) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Inviter not found', 404);
  }

  // Get expiry hours from settings
  const expiryHours = parseInt(await getSettingValue('invitation_expiry_hours', '72') || '72', 10);

  // Generate token
  const { token, expires } = generateInvitationToken(expiryHours);

  // Create invitation
  const invitation = await prisma.invitation.create({
    data: {
      email: email.toLowerCase(),
      organizationId,
      roleId,
      token,
      expiresAt: expires,
      invitedById,
    },
  });

  // Send invitation email
  const acceptUrl = `${config.frontendUrl}/accept-invitation?token=${token}`;
  const inviterName = `${inviter.firstName} ${inviter.lastName}`;

  await emailService.sendInvitation(
    email,
    organization.name,
    inviterName,
    acceptUrl,
    expiryHours
  );

  return {
    id: invitation.id,
    uuid: invitation.uuid,
    email: invitation.email,
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    createdAt: invitation.createdAt,
  };
};

export const listOrganizationInvitations = async (organizationId: number) => {
  const invitations = await prisma.invitation.findMany({
    where: {
      organizationId,
      status: 'PENDING',
    },
    include: {
      invitedBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Check and update expired invitations
  const now = new Date();
  const results = [];

  for (const inv of invitations) {
    if (inv.expiresAt < now) {
      await prisma.invitation.update({
        where: { id: inv.id },
        data: { status: 'EXPIRED' },
      });
    } else {
      results.push({
        id: inv.id,
        uuid: inv.uuid,
        email: inv.email,
        roleId: inv.roleId,
        status: inv.status,
        expiresAt: inv.expiresAt,
        invitedBy: inv.invitedBy,
        createdAt: inv.createdAt,
      });
    }
  }

  return results;
};

export const validateInvitation = async (token: string) => {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      organization: { select: { name: true } },
    },
  });

  if (!invitation) {
    return { valid: false, error: 'Invalid invitation token' };
  }

  if (invitation.status !== 'PENDING') {
    return { valid: false, error: 'This invitation has already been used or cancelled' };
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    });
    return { valid: false, error: 'This invitation has expired' };
  }

  // Get role name
  const role = await prisma.role.findUnique({
    where: { id: invitation.roleId },
  });

  return {
    valid: true,
    email: invitation.email,
    organizationName: invitation.organization.name,
    roleName: role?.name || 'Unknown',
    expiresAt: invitation.expiresAt,
  };
};

export const cancelInvitation = async (invitationId: number, organizationId: number) => {
  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      organizationId,
      status: 'PENDING',
    },
  });

  if (!invitation) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Invitation not found', 404);
  }

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: 'CANCELLED' },
  });

  return { message: 'Invitation cancelled successfully' };
};

export const resendInvitation = async (invitationId: number, organizationId: number) => {
  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      organizationId,
      status: 'PENDING',
    },
    include: {
      organization: true,
      invitedBy: true,
    },
  });

  if (!invitation) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'Invitation not found', 404);
  }

  // Get expiry hours from settings
  const expiryHours = parseInt(await getSettingValue('invitation_expiry_hours', '72') || '72', 10);

  // Generate new token and extend expiry
  const { token, expires } = generateInvitationToken(expiryHours);

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      token,
      expiresAt: expires,
    },
  });

  // Resend email
  const acceptUrl = `${config.frontendUrl}/accept-invitation?token=${token}`;
  const inviterName = `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`;

  await emailService.sendInvitation(
    invitation.email,
    invitation.organization.name,
    inviterName,
    acceptUrl,
    expiryHours
  );

  return { message: 'Invitation resent successfully' };
};
