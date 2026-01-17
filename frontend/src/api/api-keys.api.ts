/**
 * API Keys API Client
 * Handles CRUD operations for API keys
 */

import { apiClient } from './client';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  revokedAt: string | null;
  createdAt: string;
  createdBy: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateApiKeyInput {
  name: string;
  expiresAt?: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string; // Full key - only returned on creation!
  keyPrefix: string;
  expiresAt: string | null;
  createdAt: string;
  warning: string;
}

export interface RevokedApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  revokedAt: string;
}

export const apiKeysApi = {
  /**
   * List all API keys for the organization
   */
  async list(): Promise<ApiKey[]> {
    const response = await apiClient.get('/api-keys');
    return response.data.data;
  },

  /**
   * Get a single API key by ID
   */
  async get(id: string): Promise<ApiKey> {
    const response = await apiClient.get(`/api-keys/${id}`);
    return response.data.data;
  },

  /**
   * Create a new API key
   * NOTE: The full key is ONLY returned in this response
   */
  async create(input: CreateApiKeyInput): Promise<CreateApiKeyResponse> {
    const response = await apiClient.post('/api-keys', input);
    return response.data.data;
  },

  /**
   * Revoke (soft-delete) an API key
   */
  async revoke(id: string): Promise<RevokedApiKey> {
    const response = await apiClient.delete(`/api-keys/${id}`);
    return response.data.data;
  },
};
