import { Request, Response, NextFunction } from 'express';
import * as platformSettingsService from './platform-settings.service.js';
import * as aiSettingsService from '../../services/ai/settings.service.js';
import { successResponse } from '../../utils/responses.js';
import { type AIProvider } from '../../config/ai.js';

export const getAllSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await platformSettingsService.getAllSettings();
    successResponse(res, settings);
  } catch (error) {
    next(error);
  }
};

export const getSetting = async (
  req: Request<{ key: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const setting = await platformSettingsService.getSetting(req.params.key);
    successResponse(res, setting);
  } catch (error) {
    next(error);
  }
};

export const updateSetting = async (
  req: Request<{ key: string }, {}, { value: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const setting = await platformSettingsService.updateSetting(req.params.key, req.body.value);
    successResponse(res, setting);
  } catch (error) {
    next(error);
  }
};

export const getPublicSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await platformSettingsService.getPublicSettings();
    successResponse(res, settings);
  } catch (error) {
    next(error);
  }
};

// AI Settings endpoints

export const getAISettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await aiSettingsService.getPlatformAISettings();
    // Mask API keys for security (only show last 4 chars)
    const masked = {
      provider: settings.provider,
      openai: {
        apiKey: settings.openai?.apiKey ? `****${settings.openai.apiKey.slice(-4)}` : '',
        model: settings.openai?.model || '',
        configured: !!settings.openai?.apiKey,
      },
      anthropic: {
        apiKey: settings.anthropic?.apiKey ? `****${settings.anthropic.apiKey.slice(-4)}` : '',
        model: settings.anthropic?.model || '',
        configured: !!settings.anthropic?.apiKey,
      },
    };
    successResponse(res, masked);
  } catch (error) {
    next(error);
  }
};

export const updateAISettings = async (
  req: Request<{}, {}, {
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
    const { provider, openaiApiKey, openaiModel, anthropicApiKey, anthropicModel } = req.body;

    await aiSettingsService.setPlatformAISettings({
      provider,
      openai: {
        apiKey: openaiApiKey || '',
        model: openaiModel || '',
      },
      anthropic: {
        apiKey: anthropicApiKey || '',
        model: anthropicModel || '',
      },
    });

    successResponse(res, { message: 'AI settings updated successfully' });
  } catch (error) {
    next(error);
  }
};
