import type { z } from 'zod'
import type {
  applicationCreateSchema,
  applicationUpdateSchema,
  attachmentMetadataSchema,
  customQuestionAnswerSchema,
  screeningAnswersSchema,
} from './application.schema'

/**
 * Application form data types derived from Zod schemas
 */
export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>
export type ScreeningAnswers = z.infer<typeof screeningAnswersSchema>
export type CustomQuestionAnswer = z.infer<typeof customQuestionAnswerSchema>
export type AttachmentMetadata = z.infer<typeof attachmentMetadataSchema>

/**
 * Application status enum for type safety
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
 * Application step enum for wizard navigation
 */
export const ApplicationStep = {
  SCREENING: 'screening',
  CUSTOM_QUESTIONS: 'custom_questions',
  ATTACHMENTS: 'attachments',
  ASSESSMENT: 'assessment',
  VIDEO_INTERVIEW: 'video_interview',
  REVIEW: 'review',
} as const

export type ApplicationStepType = (typeof ApplicationStep)[keyof typeof ApplicationStep]

/**
 * Attachment type enum
 */
export const AttachmentType = {
  RESUME: 'resume',
  COVER_LETTER: 'cover_letter',
  PORTFOLIO: 'portfolio',
  ASSESSMENT: 'assessment',
  VIDEO_INTERVIEW: 'video_interview',
} as const

export type AttachmentTypeType = (typeof AttachmentType)[keyof typeof AttachmentType]

/**
 * File upload validation limits
 */
export const FILE_SIZE_LIMITS = {
  resume: 5 * 1024 * 1024, // 5MB
  cover_letter: 2 * 1024 * 1024, // 2MB
  portfolio: 50 * 1024 * 1024, // 50MB
  assessment: 10 * 1024 * 1024, // 10MB
  video_interview: 500 * 1024 * 1024, // 500MB
} as const

export const ALLOWED_FILE_TYPES = {
  resume: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  cover_letter: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  portfolio: ['application/pdf', 'application/zip'],
  assessment: ['application/pdf'],
  video_interview: ['video/mp4', 'video/quicktime'],
} as const
