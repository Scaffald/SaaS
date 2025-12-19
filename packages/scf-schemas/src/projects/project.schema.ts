import { z } from 'zod';

/**
 * Project status enum
 */
export const projectStatusSchema = z.enum(['planning', 'active', 'completed', 'on_hold'])

/**
 * Location visibility enum
 */
export const locationVisibilitySchema = z.enum([
  'public',
  'authenticated',
  'organization_only',
  'private',
])

/**
 * Project create schema
 */
export const projectCreateSchema = z.object({
  organization_id: z.string().uuid('Invalid organization ID'),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().optional(),
  status: projectStatusSchema.default('planning'),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  location_visibility: locationVisibilitySchema.optional(),
  location_visibility_override: z.boolean().optional(),
})

/**
 * Project update schema
 */
export const projectUpdateSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  status: projectStatusSchema.optional(),
  start_date: z.string().date().optional().nullable(),
  end_date: z.string().date().optional().nullable(),
  location_visibility: locationVisibilitySchema.optional(),
  location_visibility_override: z.boolean().optional(),
})

/**
 * Project worker status enum
 */
export const projectWorkerStatusSchema = z.enum(['pending', 'approved', 'rejected'])

/**
 * Project worker create schema (for managers assigning workers)
 */
export const projectWorkerCreateSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  user_id: z.string().uuid('Invalid user ID'),
  job_id: z.string().uuid('Invalid job ID').optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  role_on_project: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * Project worker claim schema (for workers claiming they worked)
 */
export const projectWorkerClaimSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  job_id: z.string().uuid('Invalid job ID').optional(),
  start_date: z.string().date().optional(),
  end_date: z.string().date().optional(),
  role_on_project: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * Project worker approval schema
 */
export const projectWorkerApprovalSchema = z.object({
  project_worker_id: z.string().uuid('Invalid project worker ID'),
})

/**
 * Project worker rejection schema
 */
export const projectWorkerRejectionSchema = z.object({
  project_worker_id: z.string().uuid('Invalid project worker ID'),
  reason: z.string().optional(),
})

export type ProjectStatus = z.infer<typeof projectStatusSchema>
export type LocationVisibility = z.infer<typeof locationVisibilitySchema>
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>
export type ProjectWorkerStatus = z.infer<typeof projectWorkerStatusSchema>
export type ProjectWorkerCreateInput = z.infer<typeof projectWorkerCreateSchema>
export type ProjectWorkerClaimInput = z.infer<typeof projectWorkerClaimSchema>
export type ProjectWorkerApprovalInput = z.infer<typeof projectWorkerApprovalSchema>
export type ProjectWorkerRejectionInput = z.infer<typeof projectWorkerRejectionSchema>
