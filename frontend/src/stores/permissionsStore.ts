import { create } from 'zustand';
import apiClient from '@/api/client';
import type { Menu } from '@/types';

interface PermissionsState {
  menus: Menu[];
  isLoading: boolean;

  // Actions
  setMenus: (menus: Menu[]) => void;
  clearMenus: () => void;
  fetchPermissions: (orgId: number) => Promise<void>;

  // Helpers
  hasPermission: (menuSlug: string, action: 'create' | 'read' | 'update' | 'delete') => boolean;
  canAccess: (menuSlug: string) => boolean;
}

export const usePermissionsStore = create<PermissionsState>()((set, get) => ({
  menus: [],
  isLoading: false,

  setMenus: (menus) => {
    set({ menus, isLoading: false });
  },

  clearMenus: () => {
    set({ menus: [], isLoading: false });
  },

  fetchPermissions: async (orgId: number) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get(`/organizations/${orgId}/menus`);
      if (response.data.success && response.data.data) {
        set({ menus: response.data.data, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      set({ isLoading: false });
    }
  },

  hasPermission: (menuSlug, action) => {
    const { menus } = get();
    const menu = menus.find((m) => m.slug === menuSlug);

    if (!menu || !menu.permissions) return false;

    switch (action) {
      case 'create':
        return menu.permissions.canCreate;
      case 'read':
        return menu.permissions.canRead;
      case 'update':
        return menu.permissions.canUpdate;
      case 'delete':
        return menu.permissions.canDelete;
      default:
        return false;
    }
  },

  canAccess: (menuSlug) => {
    const { menus } = get();
    const menu = menus.find((m) => m.slug === menuSlug);
    return menu?.permissions?.canRead ?? false;
  },
}));
