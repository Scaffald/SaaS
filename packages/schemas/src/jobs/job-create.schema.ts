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
  position_level: '',
}
