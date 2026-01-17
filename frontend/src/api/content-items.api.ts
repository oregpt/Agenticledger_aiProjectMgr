import apiClient from './client';
import type { ApiResponse } from '@/types';

export interface ContentType {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
}

export interface ActivityItemType {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
}

export interface ContentItem {
  id: string;
  projectId: string;
  planItemIds: string[];
  contentTypeIds: number[];
  activityTypeIds: number[];
  sourceType: 'file' | 'text' | 'calendar' | 'transcript' | 'email';
  title: string;
  dateOccurred: string;
  projectWeek: number | null;
  tags: string[];
  rawContent: string | null;
  fileReference: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  aiSummary: string | null;
  aiExtractedEntities: Record<string, unknown>;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  parentItemId: string | null;
  createdBy: string;
  createdByUserId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
}

export interface CreateContentItemInput {
  projectId: string;
  planItemIds?: string[];
  contentTypeIds?: number[];
  activityTypeIds?: number[];
  sourceType: 'file' | 'text' | 'calendar' | 'transcript' | 'email';
  title: string;
  dateOccurred: string;
  tags?: string[];
  rawContent?: string | null;
  fileReference?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
}

export interface UpdateContentItemInput {
  planItemIds?: string[];
  contentTypeIds?: number[];
  activityTypeIds?: number[];
  title?: string;
  dateOccurred?: string;
  tags?: string[];
  rawContent?: string | null;
  aiSummary?: string | null;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ListContentItemsParams {
  page?: number;
  limit?: number;
  projectId?: string;
  planItemId?: string;
  contentTypeId?: number;
  activityTypeId?: number;
  sourceType?: string;
  processingStatus?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ListContentItemsResponse {
  items: ContentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const contentItemsApi = {
  // Get all content types
  getContentTypes: async (): Promise<ApiResponse<ContentType[]>> => {
    const response = await apiClient.get('/projects/lookup/content-types');
    return response.data;
  },

  // Get all activity item types
  getActivityItemTypes: async (): Promise<ApiResponse<ActivityItemType[]>> => {
    const response = await apiClient.get('/projects/lookup/activity-item-types');
    return response.data;
  },

  // List content items for a project
  getProjectContent: async (
    projectId: string,
    params?: ListContentItemsParams
  ): Promise<ApiResponse<ListContentItemsResponse>> => {
    const response = await apiClient.get(`/projects/${projectId}/content`, { params });
    return response.data;
  },

  // List all content items with filters
  list: async (params?: ListContentItemsParams): Promise<ApiResponse<ListContentItemsResponse>> => {
    const response = await apiClient.get('/content-items', { params });
    return response.data;
  },

  // Get a single content item
  get: async (id: string): Promise<ApiResponse<ContentItem>> => {
    const response = await apiClient.get(`/content-items/${id}`);
    return response.data;
  },

  // Create a new content item
  create: async (input: CreateContentItemInput): Promise<ApiResponse<ContentItem>> => {
    const response = await apiClient.post('/content-items', input);
    return response.data;
  },

  // Update a content item
  update: async (id: string, input: UpdateContentItemInput): Promise<ApiResponse<ContentItem>> => {
    const response = await apiClient.put(`/content-items/${id}`, input);
    return response.data;
  },

  // Delete a content item
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete(`/content-items/${id}`);
    return response.data;
  },
};

export default contentItemsApi;
