/**
 * Config API
 * Functions for managing configuration types (plan item types, content types, activity types)
 */

import apiClient from './client';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============ Plan Item Types ============

export interface PlanItemType {
  id: number;
  organizationId: number | null;
  name: string;
  slug: string;
  description: string | null;
  level: number;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanItemTypeInput {
  name: string;
  slug: string;
  description?: string;
  level: number;
  icon?: string;
  color?: string;
}

export interface UpdatePlanItemTypeInput {
  name?: string;
  slug?: string;
  description?: string;
  level?: number;
  icon?: string;
  color?: string;
}

export interface ListTypesParams {
  page?: number;
  limit?: number;
  search?: string;
  includeSystem?: boolean;
}

export async function listPlanItemTypes(params?: ListTypesParams): Promise<ApiResponse<{ items: PlanItemType[]; pagination: Pagination }>> {
  const response = await apiClient.get<ApiResponse<{ items: PlanItemType[]; pagination: Pagination }>>('/config/plan-item-types', { params });
  return response.data;
}

export async function getPlanItemType(id: number): Promise<ApiResponse<PlanItemType>> {
  const response = await apiClient.get<ApiResponse<PlanItemType>>(`/config/plan-item-types/${id}`);
  return response.data;
}

export async function createPlanItemType(input: CreatePlanItemTypeInput): Promise<ApiResponse<PlanItemType>> {
  const response = await apiClient.post<ApiResponse<PlanItemType>>('/config/plan-item-types', input);
  return response.data;
}

export async function updatePlanItemType(id: number, input: UpdatePlanItemTypeInput): Promise<ApiResponse<PlanItemType>> {
  const response = await apiClient.put<ApiResponse<PlanItemType>>(`/config/plan-item-types/${id}`, input);
  return response.data;
}

export async function deletePlanItemType(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
  const response = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/config/plan-item-types/${id}`);
  return response.data;
}

// ============ Content Types ============

export interface ContentType {
  id: number;
  organizationId: number | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentTypeInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateContentTypeInput {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export async function listContentTypes(params?: ListTypesParams): Promise<ApiResponse<{ items: ContentType[]; pagination: Pagination }>> {
  const response = await apiClient.get<ApiResponse<{ items: ContentType[]; pagination: Pagination }>>('/config/content-types', { params });
  return response.data;
}

export async function getContentType(id: number): Promise<ApiResponse<ContentType>> {
  const response = await apiClient.get<ApiResponse<ContentType>>(`/config/content-types/${id}`);
  return response.data;
}

export async function createContentType(input: CreateContentTypeInput): Promise<ApiResponse<ContentType>> {
  const response = await apiClient.post<ApiResponse<ContentType>>('/config/content-types', input);
  return response.data;
}

export async function updateContentType(id: number, input: UpdateContentTypeInput): Promise<ApiResponse<ContentType>> {
  const response = await apiClient.put<ApiResponse<ContentType>>(`/config/content-types/${id}`, input);
  return response.data;
}

export async function deleteContentType(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
  const response = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/config/content-types/${id}`);
  return response.data;
}

// ============ Activity Types ============

export interface ActivityType {
  id: number;
  organizationId: number | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityTypeInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateActivityTypeInput {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
}

export async function listActivityTypes(params?: ListTypesParams): Promise<ApiResponse<{ items: ActivityType[]; pagination: Pagination }>> {
  const response = await apiClient.get<ApiResponse<{ items: ActivityType[]; pagination: Pagination }>>('/config/activity-types', { params });
  return response.data;
}

export async function getActivityType(id: number): Promise<ApiResponse<ActivityType>> {
  const response = await apiClient.get<ApiResponse<ActivityType>>(`/config/activity-types/${id}`);
  return response.data;
}

export async function createActivityType(input: CreateActivityTypeInput): Promise<ApiResponse<ActivityType>> {
  const response = await apiClient.post<ApiResponse<ActivityType>>('/config/activity-types', input);
  return response.data;
}

export async function updateActivityType(id: number, input: UpdateActivityTypeInput): Promise<ApiResponse<ActivityType>> {
  const response = await apiClient.put<ApiResponse<ActivityType>>(`/config/activity-types/${id}`, input);
  return response.data;
}

export async function deleteActivityType(id: number): Promise<ApiResponse<{ deleted: boolean }>> {
  const response = await apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/config/activity-types/${id}`);
  return response.data;
}

export const configApi = {
  // Plan Item Types
  listPlanItemTypes,
  getPlanItemType,
  createPlanItemType,
  updatePlanItemType,
  deletePlanItemType,
  // Content Types
  listContentTypes,
  getContentType,
  createContentType,
  updateContentType,
  deleteContentType,
  // Activity Types
  listActivityTypes,
  getActivityType,
  createActivityType,
  updateActivityType,
  deleteActivityType,
};

export default configApi;
