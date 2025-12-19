/**
 * CCPA Router Zod Validation Schemas
 *
 * Provides type-safe validation for all CCPA-related tRPC endpoints.
 */
import { z } from 'zod'

// ========================================================
// ENUMS
// ========================================================

export const CCPARequestTypeSchema = z.enum([
  'access',
  'deletion',
  'correction',
  'opt_out',
  'opt_in',
  'portability',
])

export const CCPARequestStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'denied',
  'cancelled',
])

export const CCPAVerificationMethodSchema = z.enum(['email', 'enhanced', 'manual'])

export const CCPAOptOutCategorySchema = z.enum([
  'sale',
  'sharing',
  'targeted_advertising',
  'profiling',
])

export const CCPAOptOutSourceSchema = z.enum(['user_request', 'gpc_signal', 'admin'])

// ========================================================
// USER REQUEST SCHEMAS
// ========================================================

/**
 * Schema for requesting data access
 */
export const requestDataAccessInputSchema = z.object({
  /**
   * Optional metadata about the request
   */
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Schema for requesting data deletion
 */
export const requestDeletionInputSchema = z.object({
  /**
   * Reason for deletion request (optional but encouraged)
   */
  reason: z.string().max(1000).optional(),
  /**
   * Additional metadata
   */
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Schema for requesting data correction
 */
export const requestCorrectionInputSchema = z.object({
  /**
   * Description of what data needs correction
   */
  correctionDetails: z.string().min(10).max(5000),
  /**
   * Additional metadata
   */
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Schema for requesting data portability
 */
export const requestPortabilityInputSchema = z.object({
  /**
   * Preferred format for export
   */
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  /**
   * Additional metadata
   */
  metadata: z.record(z.unknown()).optional(),
})

/**
 * Schema for getting request status
 */
export const getRequestStatusInputSchema = z.object({
  requestId: z.string().uuid(),
})

/**
 * Schema for cancelling a request
 */
export const cancelRequestInputSchema = z.object({
  requestId: z.string().uuid(),
  /**
   * Reason for cancellation
   */
  reason: z.string().max(500).optional(),
})

/**
 * Schema for listing user's own requests
 */
export const listMyRequestsInputSchema = z
  .object({
    status: CCPARequestStatusSchema.optional(),
    requestType: CCPARequestTypeSchema.optional(),
    limit: z.number().int().positive().max(100).default(20),
    offset: z.number().int().nonnegative().default(0),
  })
  .optional()

// ========================================================
// OPT-OUT SCHEMAS
// ========================================================

/**
 * Schema for opting out of data processing
 */
export const optOutInputSchema = z.object({
  /**
   * Categories to opt out of. Use 'all' for all categories.
   */
  categories: z
    .union([z.literal('all'), z.array(CCPAOptOutCategorySchema).min(1)])
    .default('all'),
})

/**
 * Schema for opting back in
 */
export const optInInputSchema = z.object({
  /**
   * Categories to opt back into
   */
  categories: z.array(CCPAOptOutCategorySchema).min(1),
})

// ========================================================
// OAUTH APP SCHEMAS
// ========================================================

/**
 * Schema for registering an OAuth app's data categories
 */
export const registerDataCategoryInputSchema = z.object({
  /**
   * Unique identifier for the OAuth app
   */
  appId: z.string().min(1).max(100),
  /**
   * Display name for the app
   */
  appName: z.string().min(1).max(255),
  /**
   * Data categories this app handles
   */
  dataCategories: z.array(
    z.object({
      name: z.string().min(1).max(100),
      ccpaCategory: z.enum(['personal', 'professional', 'financial', 'usage', 'sensitive']),
      description: z.string().max(500).optional(),
    })
  ),
  /**
   * Webhook URL for CCPA notifications
   */
  webhookUrl: z.string().url(),
  /**
   * Secret for webhook signature verification
   */
  webhookSecret: z.string().min(32).optional(),
})

/**
 * Schema for contributing export data from an OAuth app
 */
export const contributeExportDataInputSchema = z.object({
  /**
   * The CCPA request ID
   */
  requestId: z.string().uuid(),
  /**
   * The OAuth app's ID
   */
  appId: z.string().min(1).max(100),
  /**
   * The data payload
   */
  data: z.record(z.unknown()),
  /**
   * Categories included in this data
   */
  categories: z.array(z.string()).min(1),
})

/**
 * Schema for confirming deletion from an OAuth app
 */
export const confirmDeletionInputSchema = z.object({
  /**
   * The CCPA request ID
   */
  requestId: z.string().uuid(),
  /**
   * The OAuth app's ID
   */
  appId: z.string().min(1).max(100),
  /**
   * Categories that were deleted
   */
  deletedCategories: z.array(z.string()),
  /**
   * Categories that were anonymized (retained for legal reasons)
   */
  anonymizedCategories: z.array(z.string()).optional(),
  /**
   * Reason for retaining any data
   */
  retentionReason: z.string().max(500).optional(),
})

// ========================================================
// ADMIN SCHEMAS
// ========================================================

/**
 * Schema for listing all requests (admin)
 */
export const listRequestsInputSchema = z
  .object({
    status: CCPARequestStatusSchema.optional(),
    requestType: CCPARequestTypeSchema.optional(),
    userId: z.string().uuid().optional(),
    /**
     * Filter for overdue requests
     */
    overdueOnly: z.boolean().optional(),
    /**
     * Sort field
     */
    sortBy: z.enum(['deadline_at', 'submitted_at', 'updated_at']).default('deadline_at'),
    /**
     * Sort direction
     */
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    limit: z.number().int().positive().max(100).default(50),
    offset: z.number().int().nonnegative().default(0),
  })
  .optional()

/**
 * Schema for approving a request
 */
export const approveRequestInputSchema = z.object({
  requestId: z.string().uuid(),
  /**
   * Notes about the approval
   */
  notes: z.string().max(1000).optional(),
})

/**
 * Schema for denying a request
 */
export const denyRequestInputSchema = z.object({
  requestId: z.string().uuid(),
  /**
   * Reason for denial (required)
   */
  reason: z.string().min(10).max(1000),
})

/**
 * Schema for extending a request deadline
 */
export const extendDeadlineInputSchema = z.object({
  requestId: z.string().uuid(),
  /**
   * Reason for extension (required by CCPA)
   */
  reason: z.string().min(10).max(1000),
})

/**
 * Schema for getting CCPA metrics
 */
export const getMetricsInputSchema = z
  .object({
    /**
     * Number of days to include in metrics
     */
    days: z.number().int().positive().max(365).default(30),
  })
  .optional()

// ========================================================
// VERIFICATION SCHEMAS
// ========================================================

/**
 * Schema for initiating email verification
 */
export const initiateVerificationInputSchema = z.object({
  requestId: z.string().uuid(),
})

/**
 * Schema for verifying email OTP
 */
export const verifyEmailOTPInputSchema = z.object({
  requestId: z.string().uuid(),
  code: z.string().length(6, 'Verification code must be 6 digits'),
})

/**
 * Schema for completing enhanced verification
 */
export const completeEnhancedVerificationInputSchema = z.object({
  requestId: z.string().uuid(),
  token: z.string().min(32, 'Invalid verification token'),
})

/**
 * Schema for resending verification code
 */
export const resendVerificationInputSchema = z.object({
  requestId: z.string().uuid(),
})

/**
 * Schema for requesting manual verification
 */
export const requestManualVerificationInputSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().min(10).max(500),
})

/**
 * Schema for completing manual verification (admin)
 */
export const completeManualVerificationInputSchema = z.object({
  requestId: z.string().uuid(),
  approved: z.boolean(),
  notes: z.string().max(1000).optional(),
})

/**
 * Schema for getting verification status
 */
export const getVerificationStatusInputSchema = z.object({
  requestId: z.string().uuid(),
})

// ========================================================
// DOWNLOAD SCHEMAS
// ========================================================

/**
 * Schema for downloading an export
 */
export const downloadExportInputSchema = z.object({
  requestId: z.string().uuid(),
})

// ========================================================
// TYPE EXPORTS
// ========================================================

export type CCPARequestType = z.infer<typeof CCPARequestTypeSchema>
export type CCPARequestStatus = z.infer<typeof CCPARequestStatusSchema>
export type CCPAVerificationMethod = z.infer<typeof CCPAVerificationMethodSchema>
export type CCPAOptOutCategory = z.infer<typeof CCPAOptOutCategorySchema>
export type CCPAOptOutSource = z.infer<typeof CCPAOptOutSourceSchema>

export type RequestDataAccessInput = z.infer<typeof requestDataAccessInputSchema>
export type RequestDeletionInput = z.infer<typeof requestDeletionInputSchema>
export type RequestCorrectionInput = z.infer<typeof requestCorrectionInputSchema>
export type RequestPortabilityInput = z.infer<typeof requestPortabilityInputSchema>
export type GetRequestStatusInput = z.infer<typeof getRequestStatusInputSchema>
export type CancelRequestInput = z.infer<typeof cancelRequestInputSchema>
export type ListMyRequestsInput = z.infer<typeof listMyRequestsInputSchema>
export type OptOutInput = z.infer<typeof optOutInputSchema>
export type OptInInput = z.infer<typeof optInInputSchema>
export type RegisterDataCategoryInput = z.infer<typeof registerDataCategoryInputSchema>
export type ContributeExportDataInput = z.infer<typeof contributeExportDataInputSchema>
export type ConfirmDeletionInput = z.infer<typeof confirmDeletionInputSchema>
export type ListRequestsInput = z.infer<typeof listRequestsInputSchema>
export type ApproveRequestInput = z.infer<typeof approveRequestInputSchema>
export type DenyRequestInput = z.infer<typeof denyRequestInputSchema>
export type ExtendDeadlineInput = z.infer<typeof extendDeadlineInputSchema>
export type GetMetricsInput = z.infer<typeof getMetricsInputSchema>
export type DownloadExportInput = z.infer<typeof downloadExportInputSchema>
export type InitiateVerificationInput = z.infer<typeof initiateVerificationInputSchema>
export type VerifyEmailOTPInput = z.infer<typeof verifyEmailOTPInputSchema>
export type CompleteEnhancedVerificationInput = z.infer<typeof completeEnhancedVerificationInputSchema>
export type ResendVerificationInput = z.infer<typeof resendVerificationInputSchema>
export type RequestManualVerificationInput = z.infer<typeof requestManualVerificationInputSchema>
export type CompleteManualVerificationInput = z.infer<typeof completeManualVerificationInputSchema>
export type GetVerificationStatusInput = z.infer<typeof getVerificationStatusInputSchema>
