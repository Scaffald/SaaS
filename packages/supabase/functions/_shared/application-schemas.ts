import { z } from "zod"

/**
 * Application status enum
 */
export const applicationStatusSchema = z.enum([
  "pending",
  "reviewing",
  "interview",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
])

/**
 * Create application schema
 */
export const applicationCreateSchema = z.object({
  job_id: z.string().uuid(),
  cover_letter: z.string().max(2000).optional(),
  resume_path: z.string().optional(),
  notes: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Update application status schema (for job owners/admins)
 */
export const applicationUpdateStatusSchema = z.object({
  id: z.string().uuid(),
  status: applicationStatusSchema,
  notes: z.record(z.unknown()).optional(),
})

/**
 * Withdraw application schema
 */
export const applicationWithdrawSchema = z.object({
  id: z.string().uuid(),
})

/**
 * Query applications schema
 */
export const applicationQuerySchema = z.object({
  job_id: z.string().uuid().optional(),
  status: applicationStatusSchema.optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
})

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>
export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>
export type ApplicationUpdateStatusInput = z.infer<typeof applicationUpdateStatusSchema>
export type ApplicationWithdrawInput = z.infer<typeof applicationWithdrawSchema>
export type ApplicationQueryInput = z.infer<typeof applicationQuerySchema>
