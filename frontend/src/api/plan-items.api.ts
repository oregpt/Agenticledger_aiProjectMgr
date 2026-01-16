import apiClient from './client';
import type { ApiResponse, PlanItem, PlanItemType, PlanItemHistory, CreatePlanItemInput, UpdatePlanItemInput } from '@/types';

export interface PlanTreeResponse {
  items: PlanItem[];
  total: number;
}

export interface ListPlanItemsParams {
  status?: PlanItem['status'];
  itemTypeId?: number;
}

export interface CsvPreviewResponse {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

export interface ImportResult {
  totalRows: number;
  itemsCreated: number;
  itemsUpdated: number;
  errors: Array<{ row: number; error: string }>;
}

export const planItemsApi = {
  // Get full plan tree for a project
  getProjectPlan: async (projectId: string, params?: ListPlanItemsParams): Promise<ApiResponse<PlanTreeResponse>> => {
    const response = await apiClient.get(`/projects/${projectId}/plan`, { params });
    return response.data;
  },

  // Get a single plan item with children
  get: async (id: string): Promise<ApiResponse<PlanItem>> => {
    const response = await apiClient.get(`/plan-items/${id}`);
    return response.data;
  },

  // Create a new plan item
  create: async (projectId: string, input: CreatePlanItemInput): Promise<ApiResponse<PlanItem>> => {
    const response = await apiClient.post(`/projects/${projectId}/plan`, input);
    return response.data;
  },

  // Update a plan item
  update: async (id: string, input: UpdatePlanItemInput): Promise<ApiResponse<PlanItem>> => {
    const response = await apiClient.put(`/plan-items/${id}`, input);
    return response.data;
  },

  // Delete a plan item
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete(`/plan-items/${id}`);
    return response.data;
  },

  // Get plan item history
  getHistory: async (id: string): Promise<ApiResponse<PlanItemHistory[]>> => {
    const response = await apiClient.get(`/plan-items/${id}/history`);
    return response.data;
  },

  // Get plan item types
  getTypes: async (): Promise<ApiResponse<PlanItemType[]>> => {
    const response = await apiClient.get('/plan-item-types');
    return response.data;
  },

  // Preview CSV import
  previewImport: async (projectId: string, file: File): Promise<ApiResponse<CsvPreviewResponse>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/projects/${projectId}/plan/import/preview`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Import plan items from CSV
  importCsv: async (projectId: string, file: File): Promise<ApiResponse<ImportResult>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/projects/${projectId}/plan/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get CSV import template URL
  getTemplateUrl: (): string => {
    const baseUrl = apiClient.defaults.baseURL || '';
    return `${baseUrl}/plan-items/import/template`;
  },
};

export default planItemsApi;
