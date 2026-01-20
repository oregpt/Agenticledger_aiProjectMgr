/**
 * Prompt Templates API Client
 * Handles AI prompt template management (Platform Admin only)
 */

import apiClient from './client';
import type { ApiResponse } from '@/types';

export interface PromptTemplateVariable {
  name: string;
  description: string;
  required: boolean;
  example?: string;
}

export interface PromptTemplate {
  id: number;
  uuid: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: PromptTemplateVariable[];
  version: number;
  isActive: boolean;
  isSystem: boolean;
  updatedByUserId: number | null;
  updatedByEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePromptTemplateInput {
  systemPrompt?: string;
  userPromptTemplate?: string;
  name?: string;
  description?: string;
}

export interface DefaultPrompts {
  systemPrompt: string;
  userPromptTemplate: string;
}

export interface SeedResult {
  slug: string;
  action: 'created' | 'skipped';
  reason?: string;
  id?: number;
}

export const promptTemplatesApi = {
  /**
   * Get all prompt templates
   * Requires Platform Admin role
   */
  getAll: async (): Promise<ApiResponse<PromptTemplate[]>> => {
    const response = await apiClient.get('/prompt-templates');
    return response.data;
  },

  /**
   * Get templates by category
   * Requires Platform Admin role
   */
  getByCategory: async (category: string): Promise<ApiResponse<PromptTemplate[]>> => {
    const response = await apiClient.get(`/prompt-templates/category/${category}`);
    return response.data;
  },

  /**
   * Get a single template by slug
   * Requires Platform Admin role
   */
  getBySlug: async (slug: string): Promise<ApiResponse<PromptTemplate>> => {
    const response = await apiClient.get(`/prompt-templates/${slug}`);
    return response.data;
  },

  /**
   * Update a prompt template
   * Requires Platform Admin role
   */
  update: async (
    slug: string,
    input: UpdatePromptTemplateInput
  ): Promise<ApiResponse<PromptTemplate>> => {
    const response = await apiClient.patch(`/prompt-templates/${slug}`, input);
    return response.data;
  },

  /**
   * Reset a template to its default prompts
   * Requires Platform Admin role
   */
  reset: async (slug: string): Promise<ApiResponse<PromptTemplate>> => {
    const response = await apiClient.post(`/prompt-templates/${slug}/reset`);
    return response.data;
  },

  /**
   * Get default prompts for a template (without modifying)
   * Requires Platform Admin role
   */
  getDefaults: async (slug: string): Promise<ApiResponse<DefaultPrompts>> => {
    const response = await apiClient.get(`/prompt-templates/${slug}/defaults`);
    return response.data;
  },

  /**
   * Seed default templates (admin utility)
   * Creates any templates that don't exist
   * Requires Platform Admin role
   */
  seed: async (): Promise<ApiResponse<{ message: string; results: SeedResult[] }>> => {
    const response = await apiClient.post('/prompt-templates/seed');
    return response.data;
  },
};

export default promptTemplatesApi;
