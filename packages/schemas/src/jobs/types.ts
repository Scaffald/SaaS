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

/**
 * Priority level enum
 */
export const PriorityLevel = {
  URGENT: 'urgent',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low',
} as const

export type PriorityLevelType = (typeof PriorityLevel)[keyof typeof PriorityLevel]

/**
 * Team visibility enum
 */
export const TeamVisibility = {
  INTERNAL_ONLY: 'internal_only',
  EXTERNAL_ONLY: 'external_only',
  BOTH: 'both',
} as const

export type TeamVisibilityType = (typeof TeamVisibility)[keyof typeof TeamVisibility]

/**
 * Education level enum
 */
export const EducationLevel = {
  NONE: 'none',
  HIGH_SCHOOL: 'high_school',
  ASSOCIATE: 'associate',
  BACHELOR: 'bachelor',
  MASTER: 'master',
  PHD: 'phd',
} as const

export type EducationLevelType = (typeof EducationLevel)[keyof typeof EducationLevel]

/**
 * Pay frequency enum
 */
export const PayFrequency = {
  HOURLY: 'hourly',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  SEMIMONTHLY: 'semimonthly',
  MONTHLY: 'monthly',
} as const

export type PayFrequencyType = (typeof PayFrequency)[keyof typeof PayFrequency]

/**
 * Auto-rejection criteria interface
 */
export interface AutoRejectCriteria {
  score_minimum?: number
  require_work_authorization?: boolean
  require_all_skills?: boolean
  require_all_certifications?: boolean
}

/**
 * Custom application question interface
 */
export interface CustomApplicationQuestion {
  id: string
  question: string
  type: 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'yes_no'
  required: boolean
  options?: string[]
}

/**
 * Required attachments configuration interface
 */
export interface RequiredAttachments {
  resume?: { required: boolean; max_size_mb?: number }
  cover_letter?: { required: boolean; max_size_mb?: number }
  portfolio?: { required: boolean; max_size_mb?: number }
  [key: string]: { required: boolean; max_size_mb?: number } | undefined
}

/**
 * Language requirement interface
 */
export interface LanguageRequirement {
  language: string
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native'
}

/**
 * Physical requirements interface
 */
export interface PhysicalRequirements {
  lifting?: string
  standing?: string
  sitting?: string
  walking?: string
  climbing?: string
  [key: string]: string | undefined
}

/**
 * Work location interface
 */
export interface WorkLocation {
  address: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    latitude?: number
    longitude?: number
  }
  is_primary: boolean
  percentage_time: number
}

/**
 * Posting channels configuration interface
 */
export interface PostingChannels {
  internal_only: boolean
  external_boards?: string[]
  referral_bonus_enabled?: boolean
  referral_bonus_cents?: number
}

/**
 * UTM parameters interface
 */
export interface UtmParameters {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
}
