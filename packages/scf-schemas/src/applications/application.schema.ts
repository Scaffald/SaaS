import { z } from 'zod';

/**
 * Screening answers schema - basic screening questions
 */
export const screeningAnswersSchema = z.object({
  current_location: z.string().min(1, 'Current location is required'),
  willing_to_relocate: z.boolean(),
  years_experience: z.number().int().nonnegative('Years of experience must be 0 or greater'),
  is_authorized_to_work: z.boolean(),
  earliest_start_date: z.string().min(1, 'Start date is required'),
})

/**
 * Custom question answer schema - for job-specific questions
 */
export const customQuestionAnswerSchema = z.object({
  question_id: z.string().uuid('Invalid question ID'),
  question: z.string(),
  answer: z.union([z.string(), z.array(z.string()), z.boolean()]),
  type: z.enum(['short_text', 'long_text', 'single_choice', 'multiple_choice', 'yes_no']),
})

/**
 * Attachment metadata schema - file upload information
 */
export const attachmentMetadataSchema = z.object({
  path: z.string(),
  filename: z.string(),
  size: z.number().positive('File size must be positive'),
  mime_type: z.string(),
  uploaded_at: z.string().datetime(),
})

/**
 * Attachments schema - all file attachments
 */
export const attachmentsSchema = z.object({
  resume: attachmentMetadataSchema.optional(),
  cover_letter: attachmentMetadataSchema.optional(),
  portfolio: attachmentMetadataSchema.optional(),
  assessment: attachmentMetadataSchema.optional(),
  video_interview: attachmentMetadataSchema.optional(),
})

/**
 * Application create schema - for new applications
 */
export const applicationCreateSchema = z.object({
  job_id: z.string().uuid('Invalid job ID'),

  // Screening answers
  current_location: z.string().optional(),
  willing_to_relocate: z.boolean().optional(),
  years_experience: z.number().int().nonnegative().optional(),
  is_authorized_to_work: z.boolean().optional(),
  earliest_start_date: z.string().optional(),

  // Additional screening data
  screening_answers: z.record(z.string(), z.unknown()).optional(),

  // Custom question answers
  custom_question_answers: z.array(customQuestionAnswerSchema).optional(),

  // File attachments
  attachments: attachmentsSchema.optional(),

  // Legacy fields (optional for compatibility)
  cover_letter: z.string().optional(),
  resume_path: z.string().optional(),

  // Progress tracking
  completed_steps: z.array(z.string()).optional(),
  is_complete: z.boolean().default(false),

  // Additional metadata
  notes: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Application update schema - for updating existing applications
 */
export const applicationUpdateSchema = z.object({
  application_id: z.string().uuid('Invalid application ID'),

  // Screening answers (all optional for updates)
  current_location: z.string().optional(),
  willing_to_relocate: z.boolean().optional(),
  years_experience: z.number().int().nonnegative().optional(),
  is_authorized_to_work: z.boolean().optional(),
  earliest_start_date: z.string().optional(),

  // Additional screening data
  screening_answers: z.record(z.string(), z.unknown()).optional(),

  // Custom question answers
  custom_question_answers: z.array(customQuestionAnswerSchema).optional(),

  // File attachments
  attachments: attachmentsSchema.optional(),

  // Progress tracking
  completed_steps: z.array(z.string()).optional(),
  is_complete: z.boolean().optional(),

  // Additional fields
  notes: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  // NO `status` HERE, deliberately.
  //
  // This schema backs PATCH /v1/applications/{id}, which is the *applicant's*
  // endpoint — it authorises on `application.user_id === auth user`. While
  // `status` was accepted here, an applicant could PATCH their own application
  // straight to `hired`: they own the row, and the only other guard was that
  // the current status be `new` or `screen`, which is exactly where a fresh
  // application sits. Verified against a live local API before removing it.
  //
  // The applicant's one legitimate status change is withdrawal, which has its
  // own endpoint (POST /v1/applications/{id}/withdraw) and its own rules.
  // Employer-side moves belong to PATCH /v1/employer/applications/{id}, which
  // authorises on organisation access and validates the transition.
})

/**
 * Application step update schema - for saving progress on specific steps
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
  data: z.record(z.string(), z.unknown()),
})

/**
 * File upload schema - for validating file uploads
 */
export const fileUploadSchema = z.object({
  application_id: z.string().uuid('Invalid application ID'),
  attachment_type: z.enum(['resume', 'cover_letter', 'portfolio', 'assessment', 'video_interview']),
  filename: z.string().min(1, 'Filename is required'),
  mime_type: z.string().min(1, 'MIME type is required'),
  size: z.number().positive('File size must be positive'),
})

/**
 * Application submit schema - final submission with all required fields
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
  .refine(
    (data) => {
      // Validate that at least resume is attached
      return data.attachments?.resume !== undefined
    },
    {
      message: 'Resume is required to submit application',
      path: ['attachments', 'resume'],
    }
  )

/**
 * Application filter schema - for filtering applications in admin view
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

/**
 * Default values for application form
 */
export const applicationFormDefaults = {
  current_location: '',
  willing_to_relocate: false,
  years_experience: 0,
  is_authorized_to_work: false,
  earliest_start_date: '',
  screening_answers: {},
  custom_question_answers: [],
  attachments: {},
  completed_steps: [],
  is_complete: false,
  notes: {},
  metadata: {},
}
