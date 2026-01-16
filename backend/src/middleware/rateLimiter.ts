import rateLimit from 'express-rate-limit';
import config from '../config/index.js';
import { ErrorCodes } from '../utils/responses.js';

export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMITED,
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute for auth endpoints
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMITED,
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMITED,
      message: 'Rate limit exceeded, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
