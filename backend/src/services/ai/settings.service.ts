/**
 * AI Settings Service
 * Manages AI provider configuration at platform and organization levels
 *
 * Priority order (highest to lowest):
 * 1. Organization-specific settings (from Organization.config)
 * 2. Platform settings (from PlatformSetting)
 * 3. Environment variables (fallback)
 */

import prisma from '../../config/database.js';
import { aiConfig, type AIProvider } from '../../config/ai.js';

export interface AISettings {
  provider: AIProvider;
  openai: {
    apiKey: string;
    model: string;
  };
  anthropic: {
    apiKey: string;
    model: string;
  };
}

export interface OrgAIConfig {
  aiProvider?: AIProvider;
  openaiApiKey?: string;
  openaiModel?: string;
  anthropicApiKey?: string;
  anthropicModel?: string;
}

// Platform setting keys
const PLATFORM_AI_PROVIDER_KEY = 'ai_provider';
const PLATFORM_OPENAI_API_KEY = 'openai_api_key';
const PLATFORM_OPENAI_MODEL_KEY = 'openai_model';
const PLATFORM_ANTHROPIC_API_KEY = 'anthropic_api_key';
const PLATFORM_ANTHROPIC_MODEL_KEY = 'anthropic_model';

/**
 * Get platform-level AI settings
 */
export async function getPlatformAISettings(): Promise<Partial<AISettings>> {
  const settings = await prisma.platformSetting.findMany({
    where: {
      key: {
        in: [
          PLATFORM_AI_PROVIDER_KEY,
          PLATFORM_OPENAI_API_KEY,
          PLATFORM_OPENAI_MODEL_KEY,
          PLATFORM_ANTHROPIC_API_KEY,
          PLATFORM_ANTHROPIC_MODEL_KEY,
        ],
      },
    },
  });

  const settingsMap = new Map(settings.map(s => [s.key, s.value]));

  return {
    provider: (settingsMap.get(PLATFORM_AI_PROVIDER_KEY) as AIProvider) || undefined,
    openai: {
      apiKey: settingsMap.get(PLATFORM_OPENAI_API_KEY) || '',
      model: settingsMap.get(PLATFORM_OPENAI_MODEL_KEY) || '',
    },
    anthropic: {
      apiKey: settingsMap.get(PLATFORM_ANTHROPIC_API_KEY) || '',
      model: settingsMap.get(PLATFORM_ANTHROPIC_MODEL_KEY) || '',
    },
  };
}

/**
 * Set platform-level AI settings (Platform Admin only)
 */
export async function setPlatformAISettings(settings: Partial<AISettings>): Promise<void> {
  const updates: Array<{ key: string; value: string; category: string }> = [];

  if (settings.provider) {
    updates.push({ key: PLATFORM_AI_PROVIDER_KEY, value: settings.provider, category: 'ai' });
  }
  if (settings.openai?.apiKey !== undefined) {
    updates.push({ key: PLATFORM_OPENAI_API_KEY, value: settings.openai.apiKey, category: 'ai' });
  }
  if (settings.openai?.model) {
    updates.push({ key: PLATFORM_OPENAI_MODEL_KEY, value: settings.openai.model, category: 'ai' });
  }
  if (settings.anthropic?.apiKey !== undefined) {
    updates.push({ key: PLATFORM_ANTHROPIC_API_KEY, value: settings.anthropic.apiKey, category: 'ai' });
  }
  if (settings.anthropic?.model) {
    updates.push({ key: PLATFORM_ANTHROPIC_MODEL_KEY, value: settings.anthropic.model, category: 'ai' });
  }

  // Upsert each setting
  for (const update of updates) {
    await prisma.platformSetting.upsert({
      where: { key: update.key },
      update: { value: update.value },
      create: {
        key: update.key,
        value: update.value,
        type: 'STRING',
        category: update.category,
        description: `AI ${update.key.replace(/_/g, ' ')}`,
      },
    });
  }
}

/**
 * Get organization-level AI settings
 */
export async function getOrgAISettings(organizationId: number): Promise<OrgAIConfig | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { config: true },
  });

  if (!org?.config) {
    return null;
  }

  const config = org.config as Record<string, unknown>;
  return {
    aiProvider: config.aiProvider as AIProvider | undefined,
    openaiApiKey: config.openaiApiKey as string | undefined,
    openaiModel: config.openaiModel as string | undefined,
    anthropicApiKey: config.anthropicApiKey as string | undefined,
    anthropicModel: config.anthropicModel as string | undefined,
  };
}

/**
 * Set organization-level AI settings (Org Admin only)
 */
export async function setOrgAISettings(
  organizationId: number,
  settings: OrgAIConfig
): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { config: true },
  });

  const currentConfig = (org?.config || {}) as Record<string, unknown>;

  // Merge new settings with existing config
  const newConfig = {
    ...currentConfig,
    ...(settings.aiProvider !== undefined && { aiProvider: settings.aiProvider }),
    ...(settings.openaiApiKey !== undefined && { openaiApiKey: settings.openaiApiKey }),
    ...(settings.openaiModel !== undefined && { openaiModel: settings.openaiModel }),
    ...(settings.anthropicApiKey !== undefined && { anthropicApiKey: settings.anthropicApiKey }),
    ...(settings.anthropicModel !== undefined && { anthropicModel: settings.anthropicModel }),
  };

  await prisma.organization.update({
    where: { id: organizationId },
    data: { config: newConfig },
  });
}

/**
 * Clear organization-level AI settings (revert to platform defaults)
 */
export async function clearOrgAISettings(organizationId: number): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { config: true },
  });

  const currentConfig = (org?.config || {}) as Record<string, unknown>;

  // Remove AI-related keys from config
  const { aiProvider, openaiApiKey, openaiModel, anthropicApiKey, anthropicModel, ...restConfig } = currentConfig;

  await prisma.organization.update({
    where: { id: organizationId },
    data: { config: restConfig },
  });
}

/**
 * Get effective AI settings for an organization
 * Merges org settings with platform settings with env fallbacks
 */
export async function getEffectiveAISettings(organizationId?: number): Promise<AISettings> {
  // Start with env defaults
  const settings: AISettings = {
    provider: aiConfig.provider,
    openai: {
      apiKey: aiConfig.openai.apiKey,
      model: aiConfig.openai.model,
    },
    anthropic: {
      apiKey: aiConfig.anthropic.apiKey,
      model: aiConfig.anthropic.model,
    },
  };

  // Layer in platform settings
  const platformSettings = await getPlatformAISettings();
  if (platformSettings.provider) {
    settings.provider = platformSettings.provider;
  }
  if (platformSettings.openai?.apiKey) {
    settings.openai.apiKey = platformSettings.openai.apiKey;
  }
  if (platformSettings.openai?.model) {
    settings.openai.model = platformSettings.openai.model;
  }
  if (platformSettings.anthropic?.apiKey) {
    settings.anthropic.apiKey = platformSettings.anthropic.apiKey;
  }
  if (platformSettings.anthropic?.model) {
    settings.anthropic.model = platformSettings.anthropic.model;
  }

  // Layer in org-specific settings if provided
  if (organizationId) {
    const orgSettings = await getOrgAISettings(organizationId);
    if (orgSettings) {
      if (orgSettings.aiProvider) {
        settings.provider = orgSettings.aiProvider;
      }
      if (orgSettings.openaiApiKey) {
        settings.openai.apiKey = orgSettings.openaiApiKey;
      }
      if (orgSettings.openaiModel) {
        settings.openai.model = orgSettings.openaiModel;
      }
      if (orgSettings.anthropicApiKey) {
        settings.anthropic.apiKey = orgSettings.anthropicApiKey;
      }
      if (orgSettings.anthropicModel) {
        settings.anthropicModel = orgSettings.anthropicModel;
      }
    }
  }

  return settings;
}

/**
 * Check if AI is configured for a given organization
 */
export async function isAIConfiguredForOrg(organizationId?: number): Promise<boolean> {
  const settings = await getEffectiveAISettings(organizationId);

  switch (settings.provider) {
    case 'openai':
      return !!settings.openai.apiKey;
    case 'anthropic':
      return !!settings.anthropic.apiKey;
    default:
      return false;
  }
}

export default {
  getPlatformAISettings,
  setPlatformAISettings,
  getOrgAISettings,
  setOrgAISettings,
  clearOrgAISettings,
  getEffectiveAISettings,
  isAIConfiguredForOrg,
};
