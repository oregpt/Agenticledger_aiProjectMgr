import swaggerJsdoc from 'swagger-jsdoc';

// Read version from package.json
const packageJson = require('../../package.json');
const version: string = packageJson.version || '1.0.0';

/**
 * Swagger/OpenAPI Configuration
 *
 * This configures the OpenAPI 3.0 specification for the AI Project Manager API.
 * Documentation is available at /api/docs
 */

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Project Manager API',
      version,
      description: `
Multi-tenant AI-powered project management and status reporting tool for consultants.

## Authentication

This API supports two authentication methods:

### JWT Bearer Token
Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

### API Key
Include the API key in the X-API-Key header:
\`\`\`
X-API-Key: aipm_<your-api-key>
\`\`\`

**Note:** API keys cannot be used to manage other API keys or organization settings.

## Organization Context

Most endpoints require an organization context. For JWT auth, include the org ID in the header:
\`\`\`
X-Organization-Id: <numeric-org-id>
\`\`\`

API key authentication automatically sets the organization context.
      `,
      contact: {
        name: 'API Support',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token from /api/auth/login',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key (format: aipm_<32-chars>)',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Validation failed',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {},
            },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 20 },
                total: { type: 'integer', example: 100 },
                totalPages: { type: 'integer', example: 5 },
              },
            },
          },
        },
      },
      parameters: {
        OrganizationId: {
          name: 'X-Organization-Id',
          in: 'header',
          required: true,
          schema: {
            type: 'integer',
          },
          description: 'Organization ID for context (required for JWT auth, auto-set for API key auth)',
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Organizations', description: 'Organization management' },
      { name: 'Projects', description: 'Project management' },
      { name: 'Plan Items', description: 'Plan item hierarchy and management' },
      { name: 'Content Items', description: 'Content intake and management' },
      { name: 'Reports', description: 'Activity reports and output formatting' },
      { name: 'Config', description: 'Configuration types management' },
      { name: 'API Keys', description: 'API key management (JWT only)' },
    ],
  },
  apis: [
    './src/modules/**/*.routes.ts',
    './src/modules/**/*.routes.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
