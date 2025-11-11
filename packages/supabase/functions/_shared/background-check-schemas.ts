import { z } from 'zod'

/**
 * Shared background check schemas for Edge Functions (Deno runtime)
 * Mirrors the database schema introduced in migrations 032-036.
 */

export const backgroundCheckStatusEnum = z.enum([
  'pending',
  'invited',
  'submitted',
  'in_progress',
  'under_review',
  'completed_clear',
  'completed_consider',
  'completed_not_clear',
  'partially_completed',
  'failed',
  'cancelled',
  'disputed',
  'expired',
  'refunded',
])

export const backgroundCheckPaidByEnum = z.enum(['worker', 'organization', 'platform'])

export const backgroundCheckDisputeStatusEnum = z.enum([
  'pending',
  'under_review',
  'resolved',
  'upheld',
  'cancelled',
])

export const backgroundCheckTypeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  display_name: z.string().min(1),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  provider_check_code: z.string().nullable().optional(),
  validity_days: z.number().int().positive().nullable().optional(),
  platform_cost_cents: z.number().int().nonnegative(),
  retail_cost_cents: z.number().int().nonnegative().nullable().optional(),
  estimated_completion_days: z.number().int().nonnegative().nullable().optional(),
  required_documents: z.array(z.string()).default([]),
  provider_configuration: z.record(z.unknown()).default({}),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type BackgroundCheckType = z.infer<typeof backgroundCheckTypeSchema>

export const backgroundCheckPackageSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  display_name: z.string().min(1),
  description: z.string().nullable().optional(),
  provider_package_code: z.string().nullable().optional(),
  check_type_ids: z.array(z.string().uuid()).default([]),
  component_overrides: z.array(z.record(z.unknown())).default([]),
  platform_cost_cents: z.number().int().nonnegative(),
  retail_cost_cents: z.number().int().nonnegative(),
  estimated_completion_days: z.number().int().nonnegative().nullable().optional(),
  is_active: z.boolean().default(true),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type BackgroundCheckPackage = z.infer<typeof backgroundCheckPackageSchema>

export const consentMetadataSchema = z.object({
  consent_given_at: z.string().datetime(),
  consent_ip_address: z.string().ip().optional(),
  consent_user_agent: z.string().optional(),
  consent_signature: z.string().optional(),
  disclosure_provided_at: z.string().datetime().optional(),
  summary_of_rights_provided_at: z.string().datetime().optional(),
})

export const backgroundCheckInitiationSchema = z.object({
  package_id: z.string().uuid(),
  custom_configuration: z.record(z.unknown()).optional(),
  organization_id: z.string().uuid().optional(),
  job_id: z.string().uuid().optional(),
  paid_by: backgroundCheckPaidByEnum,
  cost_cents: z.number().int().nonnegative(),
  check_type_overrides: z.array(z.string().uuid()).optional(),
  consent: consentMetadataSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type BackgroundCheckInitiationInput = z.infer<typeof backgroundCheckInitiationSchema>

export const backgroundCheckDocumentUploadSchema = z.object({
  background_check_id: z.string().uuid(),
  document_type: z.string().min(1),
  file_name: z.string().min(1),
  mime_type: z
    .enum(['application/pdf', 'image/jpeg', 'image/png'])
    .default('application/pdf'),
  file_size: z.number().int().positive().max(10 * 1024 * 1024, 'File must be <= 10MB'),
  metadata: z.record(z.unknown()).optional(),
})

export type BackgroundCheckDocumentUploadInput = z.infer<typeof backgroundCheckDocumentUploadSchema>

export const componentStatusSchema = z.object({
  check_type_id: z.string().uuid(),
  status: backgroundCheckStatusEnum,
  completed_at: z.string().datetime().nullable().optional(),
  findings: z.record(z.unknown()).nullable().optional(),
})

export const backgroundCheckStatusUpdateSchema = z.object({
  background_check_id: z.string().uuid(),
  status: backgroundCheckStatusEnum,
  findings: z.record(z.unknown()).nullable().optional(),
  summary: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  provider_reference: z.record(z.unknown()).nullable().optional(),
  last_webhook_event_at: z.string().datetime().optional(),
  component_statuses: z.array(componentStatusSchema).optional(),
  expires_at: z.string().datetime().nullable().optional(),
  estimated_completion_date: z.string().date().nullable().optional(),
})

export type BackgroundCheckStatusUpdateInput = z.infer<typeof backgroundCheckStatusUpdateSchema>

export const backgroundCheckDisputeSchema = z.object({
  background_check_id: z.string().uuid(),
  dispute_reason: z.string().min(1),
  dispute_details: z.string().min(1),
  supporting_documents: z
    .array(
      z.object({
        document_type: z.string(),
        file_path: z.string(),
      }),
    )
    .optional(),
})

export type BackgroundCheckDisputeInput = z.infer<typeof backgroundCheckDisputeSchema>

export const backgroundCheckDisputeResolutionSchema = z.object({
  dispute_id: z.string().uuid(),
  status: backgroundCheckDisputeStatusEnum,
  resolution: z.string().nullable().optional(),
  resolution_notes: z.string().nullable().optional(),
  resolved_at: z.string().datetime().optional(),
})

export type BackgroundCheckDisputeResolutionInput = z.infer<
  typeof backgroundCheckDisputeResolutionSchema
>

