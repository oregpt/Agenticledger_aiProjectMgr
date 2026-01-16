import express from 'express';
import cors from 'cors';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import config from './config/index.js';
import logger from './utils/logger.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import organizationsRoutes from './modules/organizations/organizations.routes.js';
import rolesRoutes from './modules/roles/roles.routes.js';
import featureFlagsRoutes from './modules/feature-flags/feature-flags.routes.js';
import platformSettingsRoutes from './modules/platform-settings/platform-settings.routes.js';
import platformRoutes from './modules/platform/platform.routes.js';
import invitationsRoutes from './modules/invitations/invitations.routes.js';
import menusRoutes from './modules/menus/menus.routes.js';

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: config.isDev ? '*' : config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(generalLimiter);

// Request logging (in development)
if (config.isDev) {
  app.use((req, res, next) => {
    logger.debug(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
    });
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/feature-flags', featureFlagsRoutes);
app.use('/api/platform-settings', platformSettingsRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/invitations', invitationsRoutes);
app.use('/api/menus', menusRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
