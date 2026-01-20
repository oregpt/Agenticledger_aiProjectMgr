import { Request, Response, NextFunction } from 'express';
import * as organizationsService from './organizations.service.js';
import * as aiSettingsService from '../../services/ai/settings.service.js';
import { successResponse, paginatedResponse } from '../../utils/responses.js';
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  UpdateOrgConfigInput,
  ListOrganizationsQuery,
} from './organizations.schema.js';
import { type AIProvider } from '../../config/ai.js';

export const getMyOrganizations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizations = await organizationsService.getUserOrganizations(req.user!.id);
    successResponse(res, organizations);
  } catch (error) {
    next(error);
  }
};

export const getAllOrganizations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = req.query as unknown as ListOrganizationsQuery;
    const result = await organizationsService.getAllOrganizations(query);
    paginatedResponse(res, result.organizations, result.page, result.limit, result.total);
  } catch (error) {
    next(error);
  }
};

export const getOrganization = async (
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = parseInt(req.params.orgId, 10);
    const organization = await organizationsService.getOrganizationById(orgId);
    successResponse(res, organization);
  } catch (error) {
    next(error);
  }
};

export const createOrganization = async (
  req: Request<{}, {}, CreateOrganizationInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organization = await organizationsService.createOrganization(req.body);
    successResponse(res, organization, 201);
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (
  req: Request<{ orgId: string }, {}, UpdateOrganizationInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = parseInt(req.params.orgId, 10);
    const organization = await organizationsService.updateOrganization(orgId, req.body);
    successResponse(res, organization);
  } catch (error) {
    next(error);
  }
};

export const getOrganizationConfig = async (
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = parseInt(req.params.orgId, 10);
    const config = await organizationsService.getOrganizationConfig(orgId);
    successResponse(res, config);
  } catch (error) {
    next(error);
  }
};

export const updateOrganizationConfig = async (
  req: Request<{ orgId: string }, {}, UpdateOrgConfigInput>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = parseInt(req.params.orgId, 10);
    const result = await organizationsService.updateOrganizationConfig(orgId, req.body);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const deleteOrganization = async (
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = parseInt(req.params.orgId, 10);
    const result = await organizationsService.deleteOrganization(orgId);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

// AI Settings endpoints for organizations

export const getOrgAISettings = async (
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = parseInt(req.params.orgId, 10);

    // Get org-specific settings
    const orgSettings = await aiSettingsService.getOrgAISettings(orgId);

    // Get effective settings (with fallbacks)
    const effectiveSettings = await aiSettingsService.getEffectiveAISettings(orgId);

    // Mask API keys for security
    const response = {
      // Org-specific overrides (if any)
      overrides: orgSettings ? {
        provider: orgSettings.aiProvider,
        openai: {
          apiKey: orgSettings.openaiApiKey ? `****${orgSettings.openaiApiKey.slice(-4)}` : null,
          model: orgSettings.openaiModel || null,
          hasKey: !!orgSettings.openaiApiKey,
        },
        anthropic: {
          apiKey: orgSettings.anthropicApiKey ? `****${orgSettings.anthropicApiKey.slice(-4)}` : null,
          model: orgSettings.anthropicModel || null,
          hasKey: !!orgSettings.anthropicApiKey,
        },
      } : null,
      // Effective settings (merged with platform defaults)
      effective: {
        provider: effectiveSettings.provider,
        openai: {
          model: effectiveSettings.openai.model,
          configured: !!effectiveSettings.openai.apiKey,
        },
        anthropic: {
          model: effectiveSettings.anthropic.model,
          configured: !!effectiveSettings.anthropic.apiKey,
        },
      },
    };

    successResponse(res, response);
  } catch (error) {
    next(error);
  }
};

export const updateOrgAISettings = async (
  req: Request<{ orgId: string }, {}, {
    provider?: AIProvider;
    openaiApiKey?: string;
    openaiModel?: string;
    anthropicApiKey?: string;
    anthropicModel?: string;
  }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = parseInt(req.params.orgId, 10);
    const { provider, openaiApiKey, openaiModel, anthropicApiKey, anthropicModel } = req.body;

    await aiSettingsService.setOrgAISettings(orgId, {
      aiProvider: provider,
      openaiApiKey,
      openaiModel,
      anthropicApiKey,
      anthropicModel,
    });

    successResponse(res, { message: 'Organization AI settings updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const clearOrgAISettings = async (
  req: Request<{ orgId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = parseInt(req.params.orgId, 10);
    await aiSettingsService.clearOrgAISettings(orgId);
    successResponse(res, { message: 'Organization AI settings cleared, using platform defaults' });
  } catch (error) {
    next(error);
  }
};
