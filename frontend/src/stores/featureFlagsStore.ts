import { create } from 'zustand';
import apiClient from '@/api/client';
import type { OrganizationFeatureFlag } from '@/types';

interface FeatureFlagsState {
  flags: OrganizationFeatureFlag[];
  isLoading: boolean;

  // Actions
  setFlags: (flags: OrganizationFeatureFlag[]) => void;
  clearFlags: () => void;
  fetchFeatureFlags: (orgId: number) => Promise<void>;

  // Helpers
  isEnabled: (flagKey: string) => boolean;
}

export const useFeatureFlagsStore = create<FeatureFlagsState>()((set, get) => ({
  flags: [],
  isLoading: false,

  setFlags: (flags) => {
    set({ flags, isLoading: false });
  },

  clearFlags: () => {
    set({ flags: [], isLoading: false });
  },

  fetchFeatureFlags: async (orgId: number) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get(`/organizations/${orgId}/feature-flags`);
      if (response.data.success && response.data.data) {
        set({ flags: response.data.data, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
      set({ isLoading: false });
    }
  },

  isEnabled: (flagKey) => {
    const { flags } = get();
    const flag = flags.find((f) => f.key === flagKey);
    return flag?.effectiveEnabled ?? false;
  },
}));
