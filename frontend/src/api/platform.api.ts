import apiClient from './client';
import type { ApiResponse, Organization, PlatformSetting, FeatureFlag } from '@/types';

export const platformApi = {
  // Get all platform settings
  getSettings: async (): Promise<ApiResponse<PlatformSetting[]>> => {
    const response = await apiClient.get('/platform/settings');
    return response.data;
  },

  // Update platform setting
  updateSetting: async (
    key: string,
    value: string
  ): Promise<ApiResponse<PlatformSetting>> => {
    const response = await apiClient.put(`/platform/settings/${key}`, { value });
    return response.data;
  },

  // Get all feature flags (platform level)
  getFeatureFlags: async (): Promise<ApiResponse<FeatureFlag[]>> => {
    const response = await apiClient.get('/platform/feature-flags');
    return response.data;
  },

  // Update feature flag default
  updateFeatureFlag: async (
    flagId: number,
    defaultEnabled: boolean
  ): Promise<ApiResponse<FeatureFlag>> => {
    const response = await apiClient.put(`/platform/feature-flags/${flagId}`, { defaultEnabled });
    return response.data;
  },

  // Get all organizations
  getOrganizations: async (): Promise<ApiResponse<Organization[]>> => {
    const response = await apiClient.get('/platform/organizations');
    return response.data;
  },

  // Create new organization
  createOrganization: async (data: {
    name: string;
    slug?: string;
    description?: string;
  }): Promise<ApiResponse<Organization>> => {
    const response = await apiClient.post('/platform/organizations', data);
    return response.data;
  },

  // Delete organization
  deleteOrganization: async (orgId: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete(`/platform/organizations/${orgId}`);
    return response.data;
  },

  // Get platform statistics
  getStats: async (): Promise<
    ApiResponse<{
      totalOrganizations: number;
      totalUsers: number;
      activeUsersToday: number;
      invitationsPending: number;
    }>
  > => {
    const response = await apiClient.get('/platform/stats');
    return response.data;
  },
};

export default platformApi;
