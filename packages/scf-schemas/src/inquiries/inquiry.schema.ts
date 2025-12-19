import { z } from 'zod';

/**
 * Inquiry section names
 */
export const inquirySectionNameSchema = z.enum([
  'employment',
  'compensation',
  'capabilities',
  'other',
])

export type InquirySectionName = z.infer<typeof inquirySectionNameSchema>

/**
 * Employment type enum
 */
export const employmentTypeSchema = z.enum(['permanent', 'temporary'])

/**
 * Work schedule enum
 */
export const workScheduleSchema = z.enum(['full_time', 'part_time', 'day_week'])

/**
 * Workday enum
 */
export const workdaySchema = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

/**
 * Rate type enum
 */
export const rateTypeSchema = z.enum(['hourly', 'salary'])

/**
 * Inquiry status enum
 */
export const inquiryStatusSchema = z.enum([
  'draft',
  'sent',
  'candidate_responded',
  'organization_responded',
  'accepted',
  'rejected',
  'withdrawn',
])

/**
 * Time string format (HH:MM)
 */
const timeStringSchema = z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
  message: 'Time must be in HH:MM format (24-hour)',
})

/**
 * Date string format (YYYY-MM-DD)
 */
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'Date must be in YYYY-MM-DD format',
})

/**
 * Base inquiry object schema (before refinements)
 * Used to create both single and bulk inquiry schemas
 */
const baseInquiryObjectSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),

  // Employment terms
  employmentType: employmentTypeSchema.optional(),
  employmentTypeNegotiable: z.boolean().default(true),
  workSchedule: workScheduleSchema.optional(),
  workScheduleNegotiable: z.boolean().default(true),
  scheduleShifts: z.boolean().default(false),
  workingHoursStart: timeStringSchema.optional(),
  workingHoursEnd: timeStringSchema.optional(),
  workingHoursTimezone: z.string().optional(),
  workingHoursNegotiable: z.boolean().default(true),
  workdays: z.array(workdaySchema).default([]),
  workdaysNegotiable: z.boolean().default(true),
  employmentStartDate: dateStringSchema,
  employmentEndDate: dateStringSchema.optional(),
  employmentDatesNegotiable: z.boolean().default(true),

  // Compensation
  rateType: rateTypeSchema,
  rateMinCents: z.number().int().positive('Rate minimum must be positive'),
  rateMaxCents: z.number().int().positive('Rate maximum must be positive').optional(),
  rateNegotiable: z.boolean().default(true),

  // Capabilities
  enduranceRequired: z.boolean().default(false),

  // Other
  willingToTravel: z.boolean().optional(),
  travelDistanceMiles: z.number().int().positive().optional(),
  willingToWorkOvertime: z.boolean().optional(),
  hasDriversLicense: z.boolean().optional(),
  additionalNotes: z
    .string()
    .max(2000, 'Additional notes must be 2000 characters or less')
    .optional(),
})

/**
 * Inquiry create schema - for creating new inquiries
 */
export const inquiryCreateSchema = baseInquiryObjectSchema
  .refine(
    (data) => {
      // If rateMaxCents is provided, it must be >= rateMinCents
      if (data.rateMaxCents !== undefined) {
        return data.rateMaxCents >= data.rateMinCents
      }
      return true
    },
    {
      message: 'Rate maximum must be greater than or equal to rate minimum',
      path: ['rateMaxCents'],
    }
  )
  .refine(
    (data) => {
      // If both start and end times are provided, end must be after start
      if (data.workingHoursStart && data.workingHoursEnd) {
        const [startHour, startMin] = data.workingHoursStart.split(':').map(Number)
        const [endHour, endMin] = data.workingHoursEnd.split(':').map(Number)
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        return endMinutes > startMinutes
      }
      return true
    },
    {
      message: 'End time must be after start time',
      path: ['workingHoursEnd'],
    }
  )
  .refine(
    (data) => {
      // If end date is provided, it must be after start date
      if (data.employmentEndDate && data.employmentStartDate) {
        return data.employmentEndDate >= data.employmentStartDate
      }
      return true
    },
    {
      message: 'End date must be on or after start date',
      path: ['employmentEndDate'],
    }
  )

export type InquiryCreateInput = z.infer<typeof inquiryCreateSchema>

/**
 * Bulk inquiry schema - same as inquiryCreateSchema but without applicationId
 * Used for creating inquiries for multiple applications at once
 */
export const bulkInquirySchema = baseInquiryObjectSchema
  .omit({ applicationId: true })
  .refine(
    (data) => {
      // If rateMaxCents is provided, it must be >= rateMinCents
      if (data.rateMaxCents !== undefined) {
        return data.rateMaxCents >= data.rateMinCents
      }
      return true
    },
    {
      message: 'Rate maximum must be greater than or equal to rate minimum',
      path: ['rateMaxCents'],
    }
  )
  .refine(
    (data) => {
      // If both start and end times are provided, end must be after start
      if (data.workingHoursStart && data.workingHoursEnd) {
        const [startHour, startMin] = data.workingHoursStart.split(':').map(Number)
        const [endHour, endMin] = data.workingHoursEnd.split(':').map(Number)
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        return endMinutes > startMinutes
      }
      return true
    },
    {
      message: 'End time must be after start time',
      path: ['workingHoursEnd'],
    }
  )
  .refine(
    (data) => {
      // If end date is provided, it must be after start date
      if (data.employmentEndDate && data.employmentStartDate) {
        return data.employmentEndDate >= data.employmentStartDate
      }
      return true
    },
    {
      message: 'End date must be on or after start date',
      path: ['employmentEndDate'],
    }
  )

export type BulkInquiryInput = z.infer<typeof bulkInquirySchema>

/**
 * Inquiry template data schema - reuses the bulk inquiry structure
 */
export const inquiryTemplateDataSchema = bulkInquirySchema
export type InquiryTemplateDataInput = z.infer<typeof inquiryTemplateDataSchema>

/**
 * Create a reusable inquiry template
 */
export const inquiryTemplateCreateSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(120, 'Template name must be 120 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  templateData: inquiryTemplateDataSchema,
})

export type InquiryTemplateCreateInput = z.infer<typeof inquiryTemplateCreateSchema>

/**
 * Update an existing template (name/description/data)
 */
export const inquiryTemplateUpdateSchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(120, 'Template name must be 120 characters or less')
    .optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  templateData: inquiryTemplateDataSchema.optional(),
})

export type InquiryTemplateUpdateInput = z.infer<typeof inquiryTemplateUpdateSchema>

/**
 * Apply template to an application (increments usage counts)
 */
export const inquiryTemplateApplySchema = z.object({
  templateId: z.string().uuid('Invalid template ID'),
  applicationId: z.string().uuid('Invalid application ID'),
})

export type InquiryTemplateApplyInput = z.infer<typeof inquiryTemplateApplySchema>

/**
 * Inquiry update schema - for editing existing inquiries
 * All fields are optional except id
 */
export const inquiryUpdateSchema = z
  .object({
    id: z.string().uuid('Invalid inquiry ID'),

    // Employment terms (all optional)
    employmentType: employmentTypeSchema.optional(),
    employmentTypeNegotiable: z.boolean().optional(),
    workSchedule: workScheduleSchema.optional(),
    workScheduleNegotiable: z.boolean().optional(),
    scheduleShifts: z.boolean().optional(),
    workingHoursStart: timeStringSchema.optional(),
    workingHoursEnd: timeStringSchema.optional(),
    workingHoursTimezone: z.string().optional(),
    workingHoursNegotiable: z.boolean().optional(),
    workdays: z.array(workdaySchema).optional(),
    workdaysNegotiable: z.boolean().optional(),
    employmentStartDate: dateStringSchema.optional(),
    employmentEndDate: dateStringSchema.optional(),
    employmentDatesNegotiable: z.boolean().optional(),

    // Compensation (all optional)
    rateType: rateTypeSchema.optional(),
    rateMinCents: z.number().int().positive().optional(),
    rateMaxCents: z.number().int().positive().optional(),
    rateNegotiable: z.boolean().optional(),

    // Capabilities (all optional)
    enduranceRequired: z.boolean().optional(),

    // Other (all optional)
    willingToTravel: z.boolean().optional(),
    travelDistanceMiles: z.number().int().positive().optional(),
    willingToWorkOvertime: z.boolean().optional(),
    hasDriversLicense: z.boolean().optional(),
    additionalNotes: z.string().max(2000).optional(),
  })
  .refine(
    (data) => {
      // If rateMaxCents is provided, rateMinCents must also be provided and rateMaxCents >= rateMinCents
      if (data.rateMaxCents !== undefined && data.rateMinCents !== undefined) {
        return data.rateMaxCents >= data.rateMinCents
      }
      return true
    },
    {
      message: 'Rate maximum must be greater than or equal to rate minimum',
      path: ['rateMaxCents'],
    }
  )
  .refine(
    (data) => {
      // If both start and end times are provided, end must be after start
      if (data.workingHoursStart && data.workingHoursEnd) {
        const [startHour, startMin] = data.workingHoursStart.split(':').map(Number)
        const [endHour, endMin] = data.workingHoursEnd.split(':').map(Number)
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        return endMinutes > startMinutes
      }
      return true
    },
    {
      message: 'End time must be after start time',
      path: ['workingHoursEnd'],
    }
  )
  .refine(
    (data) => {
      // If end date is provided, start date must also be provided and end >= start
      if (data.employmentEndDate && data.employmentStartDate) {
        return data.employmentEndDate >= data.employmentStartDate
      }
      return true
    },
    {
      message: 'End date must be on or after start date',
      path: ['employmentEndDate'],
    }
  )

export type InquiryUpdateInput = z.infer<typeof inquiryUpdateSchema>

/**
 * Inquiry comment schema - for adding comments to sections
 */
export const inquiryCommentSchema = z.object({
  inquiryId: z.string().uuid('Invalid inquiry ID'),
  sectionName: inquirySectionNameSchema,
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be 2000 characters or less'),
})

export type InquiryCommentInput = z.infer<typeof inquiryCommentSchema>

/**
 * Capability response schema - for answering capability questions
 */
export const capabilityResponseSchema = z
  .object({
    inquiryId: z.string().uuid('Invalid inquiry ID'),
    capabilityName: z.string().min(1, 'Capability name is required'),
    responseValue: z.boolean().optional(),
    responseText: z.string().max(500, 'Response text must be 500 characters or less').optional(),
  })
  .refine(
    (data) => {
      // Either responseValue or responseText must be provided
      return data.responseValue !== undefined || data.responseText !== undefined
    },
    {
      message: 'Either response value or response text must be provided',
    }
  )

export type CapabilityResponseInput = z.infer<typeof capabilityResponseSchema>

/**
 * Section acceptance schema - for accepting inquiry sections
 */
export const sectionAcceptanceSchema = z.object({
  inquiryId: z.string().uuid('Invalid inquiry ID'),
  sectionName: inquirySectionNameSchema,
})

export type SectionAcceptanceInput = z.infer<typeof sectionAcceptanceSchema>

/**
 * Comment read status schema - for marking comments as read
 */
export const commentReadStatusSchema = z.object({
  commentId: z.string().uuid('Invalid comment ID'),
})

export type CommentReadStatusInput = z.infer<typeof commentReadStatusSchema>
