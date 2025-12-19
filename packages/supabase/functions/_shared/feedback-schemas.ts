import { z } from 'zod'

/**
 * Feedback schemas for Supabase Edge Functions
 * Mirrors definitions in @scf/schemas/src/feedback/feedback.schema.ts
 */

export const FEEDBACK_MIN_LENGTH = 100
export const FEEDBACK_MAX_LENGTH = 5000
export const FEEDBACK_MAX_SCREENSHOT_SIZE_BYTES = 5 * 1024 * 1024

export const FEEDBACK_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
] as const

export const feedbackScreenshotSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Screenshot name is required' })
    .max(255, { message: 'Screenshot name is too long' }),
  mimeType: z.enum(FEEDBACK_ALLOWED_MIME_TYPES),
  base64: z.string().min(1, { message: 'Screenshot data is required' }),
  size: z.number().int().nonnegative().optional(),
})

export const feedbackTypeSchema = z.enum(['bug', 'feature', 'comment'])

export const feedbackTextSchema = z
  .string()
  .trim()
  .min(FEEDBACK_MIN_LENGTH, {
    message: `Please provide at least ${FEEDBACK_MIN_LENGTH} characters`,
  })
  .max(FEEDBACK_MAX_LENGTH, {
    message: `Feedback cannot exceed ${FEEDBACK_MAX_LENGTH} characters`,
  })

export const feedbackSubmitSchema = z.object({
  feedbackType: feedbackTypeSchema,
  feedbackText: feedbackTextSchema,
  screenshotPath: z
    .string()
    .trim()
    .min(1, { message: 'Screenshot path cannot be empty' })
    .max(512, { message: 'Screenshot path is too long' })
    .optional(),
  pageUrl: z.string().trim().min(1, { message: 'Page URL is required' }),
  pageTitle: z
    .string()
    .trim()
    .min(1, { message: 'Page title cannot be empty' })
    .max(255, { message: 'Page title is too long' })
    .optional(),
  userAgent: z.string().trim().min(1, { message: 'User agent is required' }),
  browserName: z
    .string()
    .trim()
    .min(1, { message: 'Browser name cannot be empty' })
    .max(120, { message: 'Browser name is too long' })
    .optional(),
  browserVersion: z
    .string()
    .trim()
    .min(1, { message: 'Browser version cannot be empty' })
    .max(60, { message: 'Browser version is too long' })
    .optional(),
  operatingSystem: z
    .string()
    .trim()
    .min(1, { message: 'Operating system cannot be empty' })
    .max(120, { message: 'Operating system value is too long' })
    .optional(),
  screenResolution: z
    .string()
    .trim()
    .regex(/^\d{2,5}x\d{2,5}$/u, {
      message: 'Screen resolution must be in the format WIDTHxHEIGHT',
    })
    .optional(),
  viewportSize: z
    .string()
    .trim()
    .regex(/^\d{2,5}x\d{2,5}$/u, {
      message: 'Viewport size must be in the format WIDTHxHEIGHT',
    })
    .optional(),
})

export const feedbackHistoryQuerySchema = z
  .object({
    limit: z.number().int().positive().max(100).optional(),
    offset: z.number().int().nonnegative().optional(),
  })
  .refine(
    (value) => {
      if (value.offset !== undefined && value.limit === undefined) {
        return false
      }
      return true
    },
    {
      message: 'Limit is required when offset is provided',
      path: ['offset'],
    }
  )

export const feedbackUploadRequestSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(3, { message: 'File name must be at least 3 characters' })
    .max(255, { message: 'File name is too long' }),
  fileType: z.enum(FEEDBACK_ALLOWED_MIME_TYPES, {
    error: 'File type is required',
    invalid_type_error: 'Unsupported file type',
  }),
  fileSize: z
    .number()
    .int()
    .positive({ message: 'File size must be positive' })
    .max(FEEDBACK_MAX_SCREENSHOT_SIZE_BYTES, {
      message: 'File size must be under 5MB',
    }),
})

export const feedbackPendingSubmissionSchema = feedbackSubmitSchema.extend({
  id: z.string().uuid().optional(),
  createdAt: z.string().datetime().optional(),
  attempts: z.number().int().nonnegative().optional(),
  screenshot: feedbackScreenshotSchema.optional(),
})

export type FeedbackSubmitInput = z.infer<typeof feedbackSubmitSchema>
export type FeedbackHistoryQueryInput = z.infer<typeof feedbackHistoryQuerySchema>
export type FeedbackUploadRequestInput = z.infer<typeof feedbackUploadRequestSchema>
export type FeedbackPendingScreenshot = z.infer<typeof feedbackScreenshotSchema>
