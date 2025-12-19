import { z } from 'zod';

/**
 * Application status enum
 */
export const ApplicationStatus = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  HIRED: 'hired',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const

export type ApplicationStatusType = (typeof ApplicationStatus)[keyof typeof ApplicationStatus]

/**
 * Schema for creating a job application
 */
export const applicationCreateSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  cover_letter: z.string().optional(),
  resume_path: z.string().optional(),
})

/**
 * Schema for updating application status (by job owner/admin)
 */
export const applicationUpdateStatusSchema = z.object({
  id: z.string().uuid('Invalid application ID'),
  status: z.enum(['pending', 'reviewing', 'interview', 'offer', 'hired', 'rejected', 'withdrawn']),
  notes: z.string().optional(),
})

/**
 * Schema for withdrawing an application (by user)
 */
export const applicationWithdrawSchema = z.object({
  id: z.string().uuid('Invalid application ID'),
})

/**
 * Schema for querying applications
 */
export const applicationQuerySchema = z.object({
  job_id: z.string().uuid().optional(),
  status: z
    .enum(['pending', 'reviewing', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'])
    .optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
})

/**
 * Type exports
 */
export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>
export type ApplicationUpdateStatusInput = z.infer<typeof applicationUpdateStatusSchema>
export type ApplicationWithdrawInput = z.infer<typeof applicationWithdrawSchema>
export type ApplicationQueryInput = z.infer<typeof applicationQuerySchema>
