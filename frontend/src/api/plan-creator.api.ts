/**
 * Plan Creator API Client
 * AI-powered plan generation from content/requirements
 */

import apiClient from './client';
import type { ApiResponse } from '@/types';

// ============================================================================
// Types for AI-generated plan items
// ============================================================================

export interface GeneratedPlanItem {
  name: string;
  itemType: 'workstream' | 'milestone' | 'activity' | 'task' | 'subtask';
  description?: string;
  owner?: string;
  estimatedDuration?: string;
  children?: GeneratedPlanItem[];
}

export interface PlanCreatorResult {
  summary: string;
  planItems: GeneratedPlanItem[];
  assumptions: string[];
  suggestedDuration: string;
  risks: string[];
  context: {
    planItemTypes: Array<{
      id: number;
      name: string;
      slug: string;
      level: number;
    }>;
  };
}

// ============================================================================
// Input types
// ============================================================================

export interface AnalyzePlanContentInput {
  content: string;
  additionalContext?: string;
}

export interface PlanItemToCreate {
  name: string;
  itemType: 'workstream' | 'milestone' | 'activity' | 'task' | 'subtask';
  description?: string;
  owner?: string;
  estimatedDuration?: string;
  startDate?: string;
  targetEndDate?: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  children?: PlanItemToCreate[];
}

export interface CreatePlanFromSuggestionsInput {
  planItems: PlanItemToCreate[];
}

// ============================================================================
// Response types
// ============================================================================

export interface CreatePlanResponse {
  created: number;
  items: Array<{
    id: string;
    name: string;
    itemType: string;
    parentId: string | null;
  }>;
}

// ============================================================================
// API Client
// ============================================================================

export const planCreatorApi = {
  /**
   * Analyze content with AI to generate plan structure suggestions
   */
  analyze: async (
    projectId: string,
    input: AnalyzePlanContentInput
  ): Promise<ApiResponse<PlanCreatorResult>> => {
    const response = await apiClient.post(`/projects/${projectId}/plan/ai-analyze`, input);
    return response.data;
  },

  /**
   * Create plan items from accepted AI suggestions
   */
  create: async (
    projectId: string,
    input: CreatePlanFromSuggestionsInput
  ): Promise<ApiResponse<CreatePlanResponse>> => {
    const response = await apiClient.post(`/projects/${projectId}/plan/ai-create`, input);
    return response.data;
  },
};

export default planCreatorApi;
