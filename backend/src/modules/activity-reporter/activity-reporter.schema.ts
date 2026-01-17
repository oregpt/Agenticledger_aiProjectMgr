import { z } from 'zod';

// Schema for generating an activity report
export const generateReportSchema = z.object({
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  workstreamFilter: z.array(z.string().uuid()).optional().default([]),
  activityTypeFilter: z.array(z.coerce.number().int().positive()).optional().default([]),
  title: z.string().min(1).max(500).optional(),
});

// Schema for listing reports
export const listReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
