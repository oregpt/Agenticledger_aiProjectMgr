import apiClient from './client';
import type { ApiResponse, Project } from '@/types';

export interface CreateProjectInput {
  name: string;
  client?: string;
  description?: string;
  startDate: string;
  targetEndDate?: string;
  status?: Project['status'];
}

export interface UpdateProjectInput {
  name?: string;
  client?: string | null;
  description?: string | null;
  startDate?: string;
  targetEndDate?: string | null;
  status?: Project['status'];
}

export interface ListProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: Project['status'];
}

// Dashboard types
export interface ProjectDashboard {
  project: {
    id: string;
    name: string;
    client: string | null;
    description: string | null;
    status: string;
    startDate: string;
    targetEndDate: string | null;
  };
  planItems: {
    total: number;
    byStatus: Array<{ status: string; count: number }>;
    byType: Array<{ type: string; typeId: number; count: number }>;
  };
  contentItems: {
    total: number;
    bySourceType: Array<{ sourceType: string; count: number }>;
    recent: Array<{
      id: string;
      title: string;
      sourceType: string;
      dateOccurred: string;
      createdAt: string;
    }>;
    weeklyActivity: Array<{ week: string; count: number }>;
  };
  activityReports: {
    recent: Array<{
      id: string;
      title: string;
      periodStart: string;
      periodEnd: string;
      createdAt: string;
    }>;
  };
}

export const projectsApi = {
  list: async (params?: ListProjectsParams): Promise<ApiResponse<Project[]>> => {
    const response = await apiClient.get('/projects', { params });
    return response.data;
  },

  get: async (id: string): Promise<ApiResponse<Project>> => {
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  create: async (input: CreateProjectInput): Promise<ApiResponse<Project>> => {
    const response = await apiClient.post('/projects', input);
    return response.data;
  },

  update: async (id: string, input: UpdateProjectInput): Promise<ApiResponse<Project>> => {
    const response = await apiClient.put(`/projects/${id}`, input);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete(`/projects/${id}`);
    return response.data;
  },

  getDashboard: async (projectId: string): Promise<ApiResponse<ProjectDashboard>> => {
    const response = await apiClient.get(`/projects/${projectId}/dashboard`);
    return response.data;
  },
};

export default projectsApi;
