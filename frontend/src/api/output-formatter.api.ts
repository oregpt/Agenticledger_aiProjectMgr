/**
 * Output Formatter API
 * Functions for formatting data as Markdown and PowerPoint
 */

import apiClient from './client';
import type { ActivityReport } from './activity-reporter.api';
import type { PlanItem } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export type SourceType = 'plan' | 'activity_report' | 'combined';

export interface FormatMarkdownRequest {
  sourceType: SourceType;
  projectName: string;
  data: ActivityReportData | PlanData | CombinedData;
}

export interface ActivityReportData {
  title: string;
  periodStart: string;
  periodEnd: string;
  reportData: ActivityReport['reportData'];
}

export interface PlanData {
  planItems: PlanItem[];
}

export interface CombinedData extends ActivityReportData {
  planItems?: PlanItem[];
}

export interface FormatMarkdownResponse {
  content: string;
  filename: string;
}

/**
 * Format activity report as Markdown (via API)
 */
export async function formatAsMarkdown(
  request: FormatMarkdownRequest
): Promise<ApiResponse<FormatMarkdownResponse>> {
  const response = await apiClient.post<ApiResponse<FormatMarkdownResponse>>('/format/markdown', request);
  return response.data;
}

/**
 * Format activity report as PowerPoint (via API)
 * Returns a blob for download
 */
export async function formatAsPptx(
  request: FormatMarkdownRequest
): Promise<Blob> {
  const response = await apiClient.post('/format/pptx', request, {
    responseType: 'blob',
  });
  return response.data as Blob;
}

/**
 * Helper to format and download activity report as Markdown
 */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Helper to download PowerPoint blob
 */
export function downloadPptx(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const outputFormatterApi = {
  formatAsMarkdown,
  formatAsPptx,
  downloadMarkdown,
  downloadPptx,
};

export default outputFormatterApi;
