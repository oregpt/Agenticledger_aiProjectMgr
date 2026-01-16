import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, OrganizationMembership, Role } from '@/types';

interface AuthState {
  // Auth tokens
  accessToken: string | null;
  refreshToken: string | null;

  // User data
  user: User | null;

  // Current organization context
  currentOrgId: number | null;
  currentOrg: OrganizationMembership | null;
  currentRole: Role | null;

  // Loading state
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  setCurrentOrg: (orgId: number) => void;
  logout: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      currentOrgId: null,
      currentOrg: null,
      currentRole: null,
      isLoading: false,
      isAuthenticated: false,

      setTokens: (accessToken, refreshToken) => {
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      setAccessToken: (accessToken) => {
        set({ accessToken });
      },

      setUser: (user) => {
        const { currentOrgId } = get();

        // Set default org if not set
        let orgId = currentOrgId;
        let currentOrg = null;
        let currentRole = null;

        if (user.organizations.length > 0) {
          // If no current org, use first one
          if (!orgId) {
            orgId = user.organizations[0].id;
          }

          // Find current org in user's memberships
          currentOrg = user.organizations.find((o) => o.id === orgId) || user.organizations[0];
          currentRole = currentOrg?.role || null;
          orgId = currentOrg?.id || null;
        }

        set({
          user,
          currentOrgId: orgId,
          currentOrg,
          currentRole,
        });
      },

      setCurrentOrg: (orgId) => {
        const { user } = get();

        if (!user) return;

        const currentOrg = user.organizations.find((o) => o.id === orgId);
        const currentRole = currentOrg?.role || null;

        set({
          currentOrgId: orgId,
          currentOrg: currentOrg || null,
          currentRole,
        });
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          currentOrgId: null,
          currentOrg: null,
          currentRole: null,
          isAuthenticated: false,
        });
      },

      clearAuth: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          currentOrgId: null,
          currentOrg: null,
          currentRole: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        currentOrgId: state.currentOrgId,
      }),
    }
  )
);
