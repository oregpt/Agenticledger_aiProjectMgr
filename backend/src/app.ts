import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import config from './config/index.js';
import logger from './utils/logger.js';
import { swaggerSpec } from './config/swagger.js';

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
import projectsRoutes from './modules/projects/projects.routes.js';
import planItemsRoutes from './modules/plan-items/plan-items.routes.js';
import planItemTypesRoutes from './modules/plan-items/plan-item-types.routes.js';
import contentItemsRoutes from './modules/content-items/content-items.routes.js';
import outputFormatterRoutes from './modules/output-formatter/output-formatter.routes.js';
import configRoutes from './modules/config/config.routes.js';
import apiKeysRoutes from './modules/api-keys/api-keys.routes.js';

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: config.isDev ? '*' : config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id', 'X-API-Key'],
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
app.use('/api/projects', projectsRoutes);
app.use('/api/plan-items', planItemsRoutes);
app.use('/api/plan-item-types', planItemTypesRoutes);
app.use('/api/content-items', contentItemsRoutes);
app.use('/api/format', outputFormatterRoutes);
app.use('/api/config', configRoutes);
app.use('/api/api-keys', apiKeysRoutes);

// Raw OpenAPI spec (JSON) - must be before swagger-ui middleware
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Swagger API Documentation UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AI Project Manager API Docs',
}));

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
