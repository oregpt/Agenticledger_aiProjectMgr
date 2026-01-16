import apiClient from './client';
import type { ApiResponse, Role, Permission, Menu } from '@/types';

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  baseRoleId?: number;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
}

export interface RolePermissionInput {
  menuId: number;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export const rolesApi = {
  // Get roles for organization
  list: async (orgId: number): Promise<ApiResponse<Role[]>> => {
    const response = await apiClient.get(`/organizations/${orgId}/roles`);
    return response.data;
  },

  // Get role details with permissions
  get: async (orgId: number, roleId: number): Promise<ApiResponse<RoleWithPermissions>> => {
    const response = await apiClient.get(`/organizations/${orgId}/roles/${roleId}`);
    return response.data;
  },

  // Create custom role
  create: async (orgId: number, data: CreateRoleInput): Promise<ApiResponse<Role>> => {
    const response = await apiClient.post(`/organizations/${orgId}/roles`, data);
    return response.data;
  },

  // Update role
  update: async (orgId: number, roleId: number, data: UpdateRoleInput): Promise<ApiResponse<Role>> => {
    const response = await apiClient.put(`/organizations/${orgId}/roles/${roleId}`, data);
    return response.data;
  },

  // Delete custom role
  delete: async (orgId: number, roleId: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete(`/organizations/${orgId}/roles/${roleId}`);
    return response.data;
  },

  // Update role permissions
  updatePermissions: async (
    orgId: number,
    roleId: number,
    permissions: RolePermissionInput[]
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.put(`/organizations/${orgId}/roles/${roleId}/permissions`, {
      permissions,
    });
    return response.data;
  },

  // Get all menus (for permission matrix)
  getMenus: async (): Promise<ApiResponse<Menu[]>> => {
    const response = await apiClient.get('/menus');
    return response.data;
  },
};

export default rolesApi;
