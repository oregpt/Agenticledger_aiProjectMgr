import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validateBody } from '../../middleware/validation.js';
import { authenticate } from '../../middleware/auth.js';
import { authLimiter, strictLimiter } from '../../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
} from './auth.schema.js';

const router = Router();

// Public routes
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  authController.login
);

router.post(
  '/refresh',
  authLimiter,
  validateBody(refreshTokenSchema),
  authController.refreshToken
);

router.post(
  '/logout',
  validateBody(refreshTokenSchema),
  authController.logout
);

router.post(
  '/forgot-password',
  strictLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);

router.post(
  '/verify-email',
  validateBody(verifyEmailSchema),
  authController.verifyEmail
);

// Protected routes
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

router.get(
  '/me',
  authenticate,
  authController.me
);

export default router;
