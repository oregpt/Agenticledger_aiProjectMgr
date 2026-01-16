import prisma from '../../config/database.js';
import config from '../../config/index.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import {
  generateTokenPair,
  verifyRefreshToken,
  revokeRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
} from '../../services/token/token.service.js';
import emailService from '../../services/email/email.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ErrorCodes } from '../../utils/responses.js';
import type { RegisterInput, LoginInput, ResetPasswordInput, ChangePasswordInput } from './auth.schema.js';
import type { AuthUser, LoginResponse, RegisterResponse } from './auth.types.js';

// Helper to format user with organizations
const formatAuthUser = async (userId: number): Promise<AuthUser> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      organizations: {
        where: { isActive: true },
        include: {
          organization: true,
          role: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
  }

  return {
    id: user.id,
    uuid: user.uuid,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    organizations: user.organizations.map((om) => ({
      id: om.organization.id,
      uuid: om.organization.uuid,
      name: om.organization.name,
      slug: om.organization.slug,
      role: {
        id: om.role.id,
        name: om.role.name,
        slug: om.role.slug,
        level: om.role.level,
      },
    })),
  };
};

export const register = async (
  input: RegisterInput,
  userAgent?: string,
  ipAddress?: string
): Promise<RegisterResponse> => {
  const { email, password, firstName, lastName, organizationName, invitationToken } = input;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError(ErrorCodes.CONFLICT, 'A user with this email already exists', 409);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate email verification token
  const { token: verificationToken, expires: verificationExpires } = generateEmailVerificationToken();

  // Handle invitation-based registration
  if (invitationToken) {
    const invitation = await prisma.invitation.findUnique({
      where: { token: invitationToken },
      include: { organization: true },
    });

    if (!invitation) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Invalid invitation token', 404);
    }

    if (invitation.status !== 'PENDING') {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'This invitation has already been used or cancelled', 400);
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'This invitation has expired', 400);
    }

    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Email does not match invitation', 400);
    }

    // Create user and add to organization in transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          emailVerified: true, // Invitation implies email is verified
          emailVerifiedAt: new Date(),
        },
      });

      // Add to organization
      await tx.organizationUser.create({
        data: {
          userId: newUser.id,
          organizationId: invitation.organizationId,
          roleId: invitation.roleId,
        },
      });

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      return newUser;
    });

    // Send welcome email
    await emailService.sendWelcome(user.email, user.firstName);

    return {
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      message: 'Registration successful. You can now log in.',
    };
  }

  // Regular registration - create new org
  if (!organizationName) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Organization name is required for new registration', 400);
  }

  // Generate org slug
  const slug = organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Check if org slug exists
  const existingOrg = await prisma.organization.findUnique({
    where: { slug },
  });

  if (existingOrg) {
    throw new AppError(ErrorCodes.CONFLICT, 'An organization with this name already exists', 409);
  }

  // Get the org_admin role
  const orgAdminRole = await prisma.role.findFirst({
    where: { slug: 'org_admin', scope: 'PLATFORM' },
  });

  if (!orgAdminRole) {
    throw new AppError(ErrorCodes.INTERNAL_ERROR, 'System roles not configured', 500);
  }

  // Create user, organization, and membership in transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    const newOrg = await tx.organization.create({
      data: {
        name: organizationName,
        slug,
        config: {},
      },
    });

    await tx.organizationUser.create({
      data: {
        userId: newUser.id,
        organizationId: newOrg.id,
        roleId: orgAdminRole.id,
      },
    });

    // Enable default feature flags for new org
    const defaultFlags = await tx.featureFlag.findMany({
      where: { defaultEnabled: true },
    });

    for (const flag of defaultFlags) {
      await tx.organizationFeatureFlag.create({
        data: {
          organizationId: newOrg.id,
          featureFlagId: flag.id,
          platformEnabled: true,
          orgEnabled: true,
        },
      });
    }

    return newUser;
  });

  // Send verification email
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;
  await emailService.sendWelcome(user.email, user.firstName, verificationUrl);

  return {
    user: {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
    message: 'Registration successful. Please check your email to verify your account.',
  };
};

export const login = async (
  input: LoginInput,
  userAgent?: string,
  ipAddress?: string
): Promise<LoginResponse> => {
  const { email, password } = input;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new AppError(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'Account is deactivated', 401);
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    throw new AppError(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password', 401);
  }

  // Generate tokens
  const tokens = await generateTokenPair(user.id, user.uuid, user.email, userAgent, ipAddress);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Get user with organizations
  const authUser = await formatAuthUser(user.id);

  return {
    ...tokens,
    user: authUser,
  };
};

export const refreshToken = async (
  refreshTokenValue: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ accessToken: string; expiresIn: number }> => {
  const result = await verifyRefreshToken(refreshTokenValue);

  if (!result.valid || !result.userId) {
    throw new AppError(ErrorCodes.TOKEN_INVALID, result.error || 'Invalid refresh token', 401);
  }

  // Revoke old token (rotation)
  await revokeRefreshToken(refreshTokenValue);

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: result.userId },
  });

  if (!user || !user.isActive) {
    throw new AppError(ErrorCodes.UNAUTHORIZED, 'User not found or deactivated', 401);
  }

  // Generate new token pair
  const tokens = await generateTokenPair(user.id, user.uuid, user.email, userAgent, ipAddress);

  return {
    accessToken: tokens.accessToken,
    expiresIn: tokens.expiresIn,
  };
};

export const logout = async (refreshTokenValue: string): Promise<void> => {
  await revokeRefreshToken(refreshTokenValue);
};

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Don't reveal if user exists
  if (!user || !user.isActive) {
    return;
  }

  // Generate reset token
  const { token, expires } = generatePasswordResetToken();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetExpires: expires,
    },
  });

  // Send reset email
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  await emailService.sendPasswordReset(user.email, user.firstName, resetUrl);
};

export const resetPassword = async (input: ResetPasswordInput): Promise<void> => {
  const { token, password } = input;

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid or expired reset token', 400);
  }

  // Hash new password
  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  // Revoke all refresh tokens for security
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });

  // Send confirmation email
  await emailService.sendPasswordChanged(user.email, user.firstName);
};

export const verifyEmail = async (token: string): Promise<void> => {
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid or expired verification token', 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });
};

export const changePassword = async (
  userId: number,
  input: ChangePasswordInput
): Promise<void> => {
  const { currentPassword, newPassword } = input;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.passwordHash);

  if (!isValid) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Current password is incorrect', 400);
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Revoke all refresh tokens except current session
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });

  // Send confirmation email
  await emailService.sendPasswordChanged(user.email, user.firstName);
};

export const getCurrentUser = async (userId: number): Promise<AuthUser> => {
  return formatAuthUser(userId);
};
