import { z } from 'zod'

/**
 * Application schemas for Supabase Edge Functions
 * These are copies of schemas from @app/schemas for use in Deno runtime
 */

/**
 * Screening answers schema
 */
export const screeningAnswersSchema = z.object({
  current_location: z.string().min(1, 'Current location is required'),
  willing_to_relocate: z.boolean(),
  years_experience: z.number().int().nonnegative('Years of experience must be 0 or greater'),
  is_authorized_to_work: z.boolean(),
  earliest_start_date: z.string().min(1, 'Start date is required'),
})

/**
 * Custom question answer schema
 */
export const customQuestionAnswerSchema = z.object({
  question_id: z.string().uuid('Invalid question ID'),
  question: z.string(),
  answer: z.union([z.string(), z.array(z.string()), z.boolean()]),
  type: z.enum(['short_text', 'long_text', 'single_choice', 'multiple_choice', 'yes_no']),
})

/**
 * Attachment metadata schema
 */
export const attachmentMetadataSchema = z.object({
  path: z.string(),
  filename: z.string(),
  size: z.number().positive('File size must be positive'),
  mime_type: z.string(),
  uploaded_at: z.string().datetime(),
})

/**
 * Attachments schema
 */
export const attachmentsSchema = z.object({
  resume: attachmentMetadataSchema.optional(),
  cover_letter: attachmentMetadataSchema.optional(),
  portfolio: attachmentMetadataSchema.optional(),
  assessment: attachmentMetadataSchema.optional(),
  video_interview: attachmentMetadataSchema.optional(),
})

/**
 * Application create schema
 */
export const applicationCreateSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),
  current_location: z.string().optional(),
  willing_to_relocate: z.boolean().optional(),
  years_experience: z.number().int().nonnegative().optional(),
  is_authorized_to_work: z.boolean().optional(),
  earliest_start_date: z.string().optional(),
  screening_answers: z.record(z.unknown()).optional(),
  custom_question_answers: z.array(customQuestionAnswerSchema).optional(),
  attachments: attachmentsSchema.optional(),
  cover_letter: z.string().optional(),
  resume_path: z.string().optional(),
  completed_steps: z.array(z.string()).optional(),
  is_complete: z.boolean().default(false),
  notes: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Application update schema
 */
export const applicationUpdateSchema = z.object({
  application_id: z.string().uuid('Invalid application ID'),
  current_location: z.string().optional(),
  willing_to_relocate: z.boolean().optional(),
  years_experience: z.number().int().nonnegative().optional(),
  is_authorized_to_work: z.boolean().optional(),
  earliest_start_date: z.string().optional(),
  screening_answers: z.record(z.unknown()).optional(),
  custom_question_answers: z.array(customQuestionAnswerSchema).optional(),
  attachments: attachmentsSchema.optional(),
  completed_steps: z.array(z.string()).optional(),
  is_complete: z.boolean().optional(),
  notes: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  status: z
    .enum(['pending', 'reviewing', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'])
    .optional(),
})

/**
 * Application step update schema
 */
export const applicationStepUpdateSchema = z.object({
  application_id: z.string().uuid('Invalid application ID'),
  step: z.enum([
    'screening',
    'custom_questions',
    'attachments',
    'assessment',
    'video_interview',
    'review',
  ]),
  data: z.record(z.unknown()),
})

/**
 * File upload schema
 */
export const fileUploadSchema = z.object({
  application_id: z.string().uuid('Invalid application ID'),
  attachment_type: z.enum(['resume', 'cover_letter', 'portfolio', 'assessment', 'video_interview']),
  filename: z.string().min(1, 'Filename is required'),
  mime_type: z.string().min(1, 'MIME type is required'),
  size: z.number().positive('File size must be positive'),
})

/**
 * Application submit schema - for final submission with all required fields
 */
export const applicationSubmitSchema = applicationCreateSchema
  .required({
    job_id: true,
    current_location: true,
    willing_to_relocate: true,
    years_experience: true,
    is_authorized_to_work: true,
    earliest_start_date: true,
  })
  .extend({
    is_complete: z.literal(true),
  })

/**
 * Application withdraw schema
 */
export const applicationWithdrawSchema = z.object({
  id: z.string().uuid('Invalid application ID'),
})

/**
 * Application filter schema
 */
export const applicationFilterSchema = z.object({
  job_id: z.string().uuid().optional(),
  status: z
    .enum(['pending', 'reviewing', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'])
    .optional(),
  min_score: z.number().int().min(0).max(100).optional(),
  max_score: z.number().int().min(0).max(100).optional(),
  is_auto_rejected: z.boolean().optional(),
  is_complete: z.boolean().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
})
