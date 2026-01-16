import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { successResponse } from '../../utils/responses.js';
import type { RegisterInput, LoginInput, ResetPasswordInput, ChangePasswordInput } from './auth.schema.js';

export const register = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    const result = await authService.register(req.body, userAgent, ipAddress);
    successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request<{}, {}, LoginInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    const result = await authService.login(req.body, userAgent, ipAddress);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request<{}, {}, { refreshToken: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip;

    const result = await authService.refreshToken(req.body.refreshToken, userAgent, ipAddress);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request<{}, {}, { refreshToken: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await authService.logout(req.body.refreshToken);
    successResponse(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request<{}, {}, { email: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await authService.forgotPassword(req.body.email);
    // Always return success to not reveal if email exists
    successResponse(res, {
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request<{}, {}, ResetPasswordInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await authService.resetPassword(req.body);
    successResponse(res, {
      message: 'Password reset successful. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request<{}, {}, { token: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await authService.verifyEmail(req.body.token);
    successResponse(res, {
      message: 'Email verified successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: Request<{}, {}, ChangePasswordInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    await authService.changePassword(req.user.id, req.body);
    successResponse(res, {
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    const user = await authService.getCurrentUser(req.user.id);
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
};
