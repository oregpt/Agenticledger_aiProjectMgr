import apiClient from './client';
import type { ApiResponse, Invitation, Role } from '@/types';

export interface InvitationDetails {
  invitation: {
    id: number;
    email: string;
    expiresAt: string;
    status: string;
  };
  organization: {
    id: number;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  role: Role;
  invitedBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const invitationsApi = {
  getByToken: async (token: string): Promise<ApiResponse<InvitationDetails>> => {
    const response = await apiClient.get(`/invitations/token/${token}`);
    return response.data;
  },

  accept: async (token: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post(`/invitations/accept`, { token });
    return response.data;
  },

  list: async (organizationId: number): Promise<ApiResponse<Invitation[]>> => {
    const response = await apiClient.get(`/organizations/${organizationId}/invitations`);
    return response.data;
  },

  create: async (
    organizationId: number,
    data: { email: string; roleId: number }
  ): Promise<ApiResponse<Invitation>> => {
    const response = await apiClient.post(`/organizations/${organizationId}/invitations`, data);
    return response.data;
  },

  resend: async (invitationId: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post(`/invitations/${invitationId}/resend`);
    return response.data;
  },

  cancel: async (invitationId: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete(`/invitations/${invitationId}`);
    return response.data;
  },
};

export default invitationsApi;
