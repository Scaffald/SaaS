import type { z } from 'zod'
import type { jobCreateSchema, jobPublishSchema, jobUpdateSchema } from './job-create.schema'

/**
 * Job form data types derived from Zod schemas
 */

export type JobCreateInput = z.infer<typeof jobCreateSchema>
export type JobUpdateInput = z.infer<typeof jobUpdateSchema>
export type JobPublishInput = z.infer<typeof jobPublishSchema>

/**
 * Job status enum for type safety
 */
export const JobStatus = {
  DRAFT: 'draft',
  OPEN: 'open',
  PAUSED: 'paused',
  CLOSED: 'closed',
} as const

export type JobStatusType = (typeof JobStatus)[keyof typeof JobStatus]

/**
 * Employment type enum
 */
export const EmploymentType = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
  TEMP: 'temp',
  INTERN: 'intern',
} as const

export type EmploymentTypeType = (typeof EmploymentType)[keyof typeof EmploymentType]

/**
 * Remote option enum
 */
export const RemoteOption = {
  ON_SITE: 'on_site',
  HYBRID: 'hybrid',
  REMOTE: 'remote',
} as const

export type RemoteOptionType = (typeof RemoteOption)[keyof typeof RemoteOption]

/**
 * Pay range type enum
 */
export const PayRangeType = {
  HOURLY: 'hourly',
  SALARY: 'salary',
  CONTRACT: 'contract',
  PROJECT: 'project',
} as const

export type PayRangeTypeType = (typeof PayRangeType)[keyof typeof PayRangeType]
