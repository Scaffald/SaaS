import { z } from 'zod'

/**
 * Base job schema with all possible fields
 */
const baseJobSchema = z.object({
  // Organization (required)
  organization_id: z.string().uuid('Invalid organization ID'),

  // Basic info
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),

  // Status
  status: z.enum(['draft', 'open', 'paused', 'closed']).default('draft'),

  // Employment details
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'temp', 'intern']).optional(),
  remote_option: z.enum(['on_site', 'hybrid', 'remote']).optional(),
  position_level: z.string().optional(),

  // Location
  location: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),

  // Pay range
  pay_range_min_cents: z.number().int().positive().optional(),
  pay_range_max_cents: z.number().int().positive().optional(),
  pay_range_type: z.enum(['hourly', 'salary', 'contract', 'project']).optional(),

  // Certifications and skills
  certification_ids: z.array(z.string().uuid()).optional(),
  skill_ids: z.array(z.string().uuid()).optional(),

  // Team assignment
  team_id: z.string().uuid().optional(),

  // Application screening requirements (Migration 067)
  require_current_location: z.boolean().optional(),
  require_relocation_willingness: z.boolean().optional(),
  minimum_years_experience: z.number().int().nonnegative().optional(),
  require_work_authorization: z.boolean().optional(),
  require_earliest_start_date: z.boolean().optional(),

  // Auto-rejection configuration
  enable_auto_reject: z.boolean().optional(),
  auto_reject_criteria: z
    .object({
      score_minimum: z.number().min(0).max(100).optional(),
      require_work_authorization: z.boolean().optional(),
      require_all_skills: z.boolean().optional(),
      require_all_certifications: z.boolean().optional(),
    })
    .optional(),

  // Team management and visibility
  assigned_team_id: z.string().uuid().optional(),
  team_ids: z.array(z.string().uuid()).optional(),
  team_visibility: z.enum(['internal_only', 'external_only', 'both']).optional(),
  show_team_on_posting: z.boolean().optional(),

  // Score integration
  minimum_score: z.number().int().min(0).max(100).optional(),

  // Job metadata and management (Migration 068)
  internal_job_code: z.string().optional(),
  department: z.string().optional(),
  cost_center: z.string().optional(),
  hiring_manager_id: z.string().uuid().optional(),
  recruiter_id: z.string().uuid().optional(),
  number_of_openings: z.number().int().positive().optional(),
  priority_level: z.enum(['urgent', 'high', 'normal', 'low']).optional(),
  requisition_number: z.string().optional(),
  job_category: z.string().optional(),
  is_confidential: z.boolean().optional(),

  // Date tracking
  application_deadline: z.string().datetime().optional(),
  target_start_date: z.string().date().optional(),
  estimated_hire_date: z.string().date().optional(),
  scheduled_publish_at: z.string().datetime().optional(),

  // Enhanced requirements (Migration 069)
  minimum_education_level: z
    .enum(['none', 'high_school', 'associate', 'bachelor', 'master', 'phd'])
    .optional(),
  require_background_check: z.boolean().optional(),
  background_check_type: z.string().optional(),
  require_drug_test: z.boolean().optional(),
  require_drivers_license: z.boolean().optional(),
  drivers_license_type: z.string().optional(),

  // Work-specific requirements
  security_clearance_required: z.string().optional(),
  language_requirements: z
    .array(
      z.object({
        language: z.string(),
        proficiency: z.enum(['basic', 'conversational', 'fluent', 'native']),
      })
    )
    .optional(),
  physical_requirements: z.record(z.string()).optional(),
  travel_percentage: z.number().int().min(0).max(100).optional(),
  shift_requirements: z.string().optional(),

  // Compensation and benefits (Migration 070)
  benefits_summary: z.string().optional(),
  has_bonus_structure: z.boolean().optional(),
  bonus_details: z.string().optional(),
  has_equity: z.boolean().optional(),
  equity_details: z.string().optional(),
  sign_on_bonus_cents: z.number().int().nonnegative().optional(),
  has_relocation_package: z.boolean().optional(),
  relocation_package_details: z.string().optional(),
  overtime_eligible: z.boolean().optional(),
  pay_frequency: z.enum(['hourly', 'weekly', 'biweekly', 'semimonthly', 'monthly']).optional(),

  // Application process configuration (Migration 071)
  custom_application_questions: z
    .array(
      z.object({
        id: z.string(),
        question: z.string(),
        type: z.enum(['short_text', 'long_text', 'single_choice', 'multiple_choice', 'yes_no']),
        required: z.boolean(),
        options: z.array(z.string()).optional(),
      })
    )
    .optional(),
  required_attachments: z
    .record(
      z.object({
        required: z.boolean(),
        max_size_mb: z.number().positive().optional(),
      })
    )
    .optional(),
  requires_assessment: z.boolean().optional(),
  assessment_details: z.string().optional(),
  requires_video_interview: z.boolean().optional(),
  estimated_application_time_minutes: z.number().int().positive().optional(),
  application_expiry_days: z.number().int().positive().optional(),

  // Multi-location and scheduling (Migration 072)
  work_locations: z
    .array(
      z.object({
        address: z.object({
          street: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zip: z.string().optional(),
          country: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
        }),
        is_primary: z.boolean(),
        percentage_time: z.number().int().min(0).max(100),
      })
    )
    .optional(),
  relocation_assistance_offered: z.boolean().optional(),
  relocation_assistance_details: z.string().optional(),
  work_schedule_details: z.string().optional(),
  timezone: z.string().optional(),

  // Distribution and visibility (Migration 073)
  posting_channels: z
    .object({
      internal_only: z.boolean(),
      external_boards: z.array(z.string()).optional(),
      referral_bonus_enabled: z.boolean().optional(),
      referral_bonus_cents: z.number().int().nonnegative().optional(),
    })
    .optional(),
  is_featured: z.boolean().optional(),
  featured_until: z.string().datetime().optional(),
  seo_keywords: z.array(z.string()).optional(),
  external_application_url: z.string().url().optional(),

  // Compliance and analytics (Migration 074)
  eeo_job_category: z.string().optional(),
  is_veteran_friendly: z.boolean().optional(),
  is_disability_friendly: z.boolean().optional(),
  affirmative_action_plan: z.boolean().optional(),
  source_tracking_enabled: z.boolean().optional(),
  utm_parameters: z
    .object({
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional(),
      utm_term: z.string().optional(),
      utm_content: z.string().optional(),
    })
    .optional(),
})

/**
 * Schema for creating a job (draft mode - minimal requirements)
 */
export const jobCreateSchema = baseJobSchema
  .refine(
    (data) => {
      // If pay range is provided, both min and max must be present
      if (data.pay_range_min_cents || data.pay_range_max_cents) {
        return data.pay_range_min_cents && data.pay_range_max_cents && data.pay_range_type
      }
      return true
    },
    {
      message: 'Pay range must include min, max, and type (hourly/salary/contract/project)',
      path: ['pay_range_min_cents'],
    }
  )
  .refine(
    (data) => {
      // If pay range is provided, min must be less than or equal to max
      if (data.pay_range_min_cents && data.pay_range_max_cents) {
        return data.pay_range_min_cents <= data.pay_range_max_cents
      }
      return true
    },
    {
      message: 'Minimum pay must be less than or equal to maximum pay',
      path: ['pay_range_min_cents'],
    }
  )

/**
 * Schema for publishing a job (stricter validation)
 */
export const jobPublishSchema = baseJobSchema
  .extend({
    status: z.literal('open'),
  })
  .required({
    title: true,
    description: true,
    organization_id: true,
  })
  .refine(
    (data) => {
      // For published jobs, must have either location or remote option
      return data.location || data.remote_option === 'remote'
    },
    {
      message: 'Published jobs must have a location or be marked as remote',
      path: ['location'],
    }
  )
  .refine(
    (data) => {
      // If pay range is provided, both min and max must be present
      if (data.pay_range_min_cents || data.pay_range_max_cents) {
        return data.pay_range_min_cents && data.pay_range_max_cents && data.pay_range_type
      }
      return true
    },
    {
      message: 'Pay range must include min, max, and type (hourly/salary/contract/project)',
      path: ['pay_range_min_cents'],
    }
  )
  .refine(
    (data) => {
      // If pay range is provided, min must be less than or equal to max
      if (data.pay_range_min_cents && data.pay_range_max_cents) {
        return data.pay_range_min_cents <= data.pay_range_max_cents
      }
      return true
    },
    {
      message: 'Minimum pay must be less than or equal to maximum pay',
      path: ['pay_range_min_cents'],
    }
  )

/**
 * Schema for updating a job
 */
export const jobUpdateSchema = baseJobSchema
  .extend({
    id: z.string().uuid('Invalid job ID'),
  })
  .partial()
  .required({
    id: true,
  })
  .refine(
    (data) => {
      // If pay range is provided, both min and max must be present
      if (data.pay_range_min_cents || data.pay_range_max_cents) {
        return data.pay_range_min_cents && data.pay_range_max_cents && data.pay_range_type
      }
      return true
    },
    {
      message: 'Pay range must include min, max, and type (hourly/salary/contract/project)',
      path: ['pay_range_min_cents'],
    }
  )
  .refine(
    (data) => {
      // If pay range is provided, min must be less than or equal to max
      if (data.pay_range_min_cents && data.pay_range_max_cents) {
        return data.pay_range_min_cents <= data.pay_range_max_cents
      }
      return true
    },
    {
      message: 'Minimum pay must be less than or equal to maximum pay',
      path: ['pay_range_min_cents'],
    }
  )

/**
 * Default values for job form
 */
export const jobFormDefaults = {
  title: '',
  description: '',
  status: 'draft' as const,
  organization_id: '',
  employment_type: undefined,
  remote_option: undefined,
  location: '',
  pay_range_min_cents: undefined,
  pay_range_max_cents: undefined,
  pay_range_type: undefined,
  certification_ids: [],
  skill_ids: [],
  team_id: undefined,
  team_ids: [] as string[],
  position_level: '',
}
