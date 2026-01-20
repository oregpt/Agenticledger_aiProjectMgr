/**
 * AI Settings API Client
 * Handles platform and organization AI provider configuration
 */

import apiClient from './client';
import type { ApiResponse } from '@/types';

export type AIProvider = 'openai' | 'anthropic';

export interface PlatformAISettings {
  provider?: AIProvider;
  openai: {
    apiKey: string;
    model: string;
    configured: boolean;
  };
  anthropic: {
    apiKey: string;
    model: string;
    configured: boolean;
  };
}

export interface OrgAISettings {
  overrides: {
    provider?: AIProvider;
    openai: {
      apiKey: string | null;
      model: string | null;
      hasKey: boolean;
    };
    anthropic: {
      apiKey: string | null;
      model: string | null;
      hasKey: boolean;
    };
  } | null;
  effective: {
    provider: AIProvider;
    openai: {
      model: string;
      configured: boolean;
    };
    anthropic: {
      model: string;
      configured: boolean;
    };
  };
}

export interface UpdatePlatformAISettingsInput {
  provider?: AIProvider;
  openaiApiKey?: string;
  openaiModel?: string;
  anthropicApiKey?: string;
  anthropicModel?: string;
}

export interface UpdateOrgAISettingsInput {
  provider?: AIProvider;
  openaiApiKey?: string;
  openaiModel?: string;
  anthropicApiKey?: string;
  anthropicModel?: string;
}

export const aiSettingsApi = {
  // Platform Admin: Get platform AI settings
  getPlatformSettings: async (): Promise<ApiResponse<PlatformAISettings>> => {
    const response = await apiClient.get('/platform-settings/ai');
    return response.data;
  },

  // Platform Admin: Update platform AI settings
  updatePlatformSettings: async (
    input: UpdatePlatformAISettingsInput
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.patch('/platform-settings/ai', input);
    return response.data;
  },

  // Org Admin: Get organization AI settings
  getOrgSettings: async (orgId: number): Promise<ApiResponse<OrgAISettings>> => {
    const response = await apiClient.get(`/organizations/${orgId}/ai-settings`);
    return response.data;
  },

  // Org Admin: Update organization AI settings
  updateOrgSettings: async (
    orgId: number,
    input: UpdateOrgAISettingsInput
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.patch(`/organizations/${orgId}/ai-settings`, input);
    return response.data;
  },

  // Org Admin: Clear organization AI settings (revert to platform defaults)
  clearOrgSettings: async (orgId: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete(`/organizations/${orgId}/ai-settings`);
    return response.data;
  },
};

export default aiSettingsApi;
