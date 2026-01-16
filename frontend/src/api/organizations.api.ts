import apiClient from './client';
import type { ApiResponse, Organization, User, OrganizationFeatureFlag } from '@/types';

export interface OrganizationDetails extends Organization {
  config: Record<string, unknown>;
  _count: {
    users: number;
  };
}

export interface OrganizationUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  role: {
    id: number;
    name: string;
    slug: string;
    level: number;
  };
  joinedAt: string;
}

export const organizationsApi = {
  // Get current organization details
  getCurrent: async (orgId: number): Promise<ApiResponse<OrganizationDetails>> => {
    const response = await apiClient.get(`/organizations/${orgId}`);
    return response.data;
  },

  // Update organization
  update: async (
    orgId: number,
    data: { name?: string; description?: string; logoUrl?: string }
  ): Promise<ApiResponse<Organization>> => {
    const response = await apiClient.put(`/organizations/${orgId}`, data);
    return response.data;
  },

  // Get organization config
  getConfig: async (orgId: number): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await apiClient.get(`/organizations/${orgId}/config`);
    return response.data;
  },

  // Update organization config
  updateConfig: async (
    orgId: number,
    config: Record<string, unknown>
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await apiClient.put(`/organizations/${orgId}/config`, { config });
    return response.data;
  },

  // Get organization users
  getUsers: async (orgId: number): Promise<ApiResponse<OrganizationUser[]>> => {
    const response = await apiClient.get(`/organizations/${orgId}/users`);
    return response.data;
  },

  // Update user role in organization
  updateUserRole: async (
    orgId: number,
    userId: number,
    roleId: number
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.put(`/organizations/${orgId}/users/${userId}/role`, { roleId });
    return response.data;
  },

  // Remove user from organization
  removeUser: async (orgId: number, userId: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete(`/organizations/${orgId}/users/${userId}`);
    return response.data;
  },

  // Get organization feature flags
  getFeatureFlags: async (orgId: number): Promise<ApiResponse<OrganizationFeatureFlag[]>> => {
    const response = await apiClient.get(`/organizations/${orgId}/feature-flags`);
    return response.data;
  },

  // Update organization feature flag
  updateFeatureFlag: async (
    orgId: number,
    flagId: number,
    enabled: boolean
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.put(`/organizations/${orgId}/feature-flags/${flagId}`, { enabled });
    return response.data;
  },

  // Platform admin: List all organizations
  listAll: async (): Promise<ApiResponse<Organization[]>> => {
    const response = await apiClient.get('/platform/organizations');
    return response.data;
  },

  // Platform admin: Create organization
  create: async (data: {
    name: string;
    slug?: string;
    description?: string;
  }): Promise<ApiResponse<Organization>> => {
    const response = await apiClient.post('/platform/organizations', data);
    return response.data;
  },

  // Platform admin: Delete organization
  delete: async (orgId: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete(`/platform/organizations/${orgId}`);
    return response.data;
  },
};

export default organizationsApi;
