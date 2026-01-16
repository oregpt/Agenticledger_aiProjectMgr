import apiClient from './client';
import type { ApiResponse, LoginResponse, User, RegisterInput, LoginInput } from '@/types';

export const authApi = {
  register: async (data: RegisterInput): Promise<ApiResponse<{ user: User; message: string }>> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginInput): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string; expiresIn: number }>> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (refreshToken: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/auth/logout', { refreshToken });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data;
  },

  verifyEmail: async (token: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  me: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

export default authApi;
