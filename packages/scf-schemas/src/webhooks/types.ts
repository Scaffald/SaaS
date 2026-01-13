/**
 * Webhook Event Types and Schemas
 * Defines all webhook events and their payload structures
 */

import { z } from 'zod'

/**
 * Webhook Event Types
 */
export const WebhookEventType = z.enum([
  // Job events
  'job.created',
  'job.updated',
  'job.published',
  'job.closed',
  'job.deleted',

  // Application events
  'application.created',
  'application.submitted',
  'application.updated',
  'application.withdrawn',
  'application.accepted',
  'application.rejected',

  // User events
  'user.created',
  'user.updated',
  'user.deleted',

  // Organization events
  'organization.created',
  'organization.updated',
  'organization.member_added',
  'organization.member_removed',

  // Background check events
  'background_check.initiated',
  'background_check.completed',
  'background_check.failed',

  // Work log events
  'work_log.created',
  'work_log.approved',
  'work_log.rejected',

  // Inquiry events
  'inquiry.created',
  'inquiry.responded',
  'inquiry.closed',
])

export type WebhookEventType = z.infer<typeof WebhookEventType>

/**
 * Base Webhook Event Payload
 */
export const WebhookEventPayloadSchema = z.object({
  id: z.string().uuid(),
  type: WebhookEventType,
  created_at: z.string().datetime(),
  organization_id: z.string().uuid(),
  data: z.record(z.string(), z.unknown()),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type WebhookEventPayload = z.infer<typeof WebhookEventPayloadSchema>

/**
 * Job Event Payloads
 */
export const JobCreatedEventSchema = WebhookEventPayloadSchema.extend({
  type: z.literal('job.created'),
  data: z.object({
    id: z.string().uuid(),
    title: z.string(),
    status: z.string(),
    organization_id: z.string().uuid(),
    created_at: z.string().datetime(),
  }),
})

export const JobUpdatedEventSchema = WebhookEventPayloadSchema.extend({
  type: z.literal('job.updated'),
  data: z.object({
    id: z.string().uuid(),
    title: z.string(),
    status: z.string(),
    updated_at: z.string().datetime(),
  }),
})

/**
 * Application Event Payloads
 */
export const ApplicationCreatedEventSchema = WebhookEventPayloadSchema.extend({
  type: z.literal('application.created'),
  data: z.object({
    id: z.string().uuid(),
    job_id: z.string().uuid(),
    user_id: z.string().uuid(),
    status: z.string(),
    created_at: z.string().datetime(),
  }),
})

export const ApplicationSubmittedEventSchema = WebhookEventPayloadSchema.extend({
  type: z.literal('application.submitted'),
  data: z.object({
    id: z.string().uuid(),
    job_id: z.string().uuid(),
    user_id: z.string().uuid(),
    submitted_at: z.string().datetime(),
  }),
})

/**
 * Webhook Configuration
 */
export const WebhookConfigSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  url: z.string().url().startsWith('https://'),
  description: z.string().optional(),
  secret: z.string(),
  is_active: z.boolean(),
  events: z.array(WebhookEventType),
  retry_max_attempts: z.number().int().min(0).max(10).default(3),
  retry_backoff_seconds: z.array(z.number().int().positive()).default([60, 300, 900]),
  timeout_ms: z.number().int().min(1000).max(60000).default(10000),
  rate_limit_per_minute: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type WebhookConfig = z.infer<typeof WebhookConfigSchema>

/**
 * Webhook Delivery Status
 */
export const WebhookDeliveryStatus = z.enum([
  'pending',
  'success',
  'failed',
  'retrying',
  'cancelled',
])

export type WebhookDeliveryStatus = z.infer<typeof WebhookDeliveryStatus>

/**
 * Webhook Delivery
 */
export const WebhookDeliverySchema = z.object({
  id: z.string().uuid(),
  webhook_id: z.string().uuid(),
  event_type: WebhookEventType,
  event_id: z.string().uuid(),
  event_data: z.record(z.string(), z.unknown()),
  attempt_number: z.number().int().positive(),
  status: WebhookDeliveryStatus,
  request_headers: z.record(z.string(), z.string()).optional(),
  request_body: z.record(z.string(), z.unknown()),
  request_signature: z.string().optional(),
  response_status_code: z.number().int().optional(),
  response_headers: z.record(z.string(), z.string()).optional(),
  response_body: z.string().optional(),
  response_time_ms: z.number().int().optional(),
  error_message: z.string().optional(),
  error_code: z.string().optional(),
  next_retry_at: z.string().datetime().optional(),
  retry_count: z.number().int().min(0),
  created_at: z.string().datetime(),
  delivered_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
})

export type WebhookDelivery = z.infer<typeof WebhookDeliverySchema>

/**
 * Create Webhook Input
 */
export const CreateWebhookInputSchema = z.object({
  url: z.string().url().startsWith('https://'),
  description: z.string().optional(),
  events: z.array(WebhookEventType).min(1),
  retry_max_attempts: z.number().int().min(0).max(10).default(3),
  timeout_ms: z.number().int().min(1000).max(60000).default(10000),
  rate_limit_per_minute: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type CreateWebhookInput = z.infer<typeof CreateWebhookInputSchema>

/**
 * Update Webhook Input
 */
export const UpdateWebhookInputSchema = z.object({
  url: z.string().url().startsWith('https://').optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  events: z.array(WebhookEventType).min(1).optional(),
  retry_max_attempts: z.number().int().min(0).max(10).optional(),
  timeout_ms: z.number().int().min(1000).max(60000).optional(),
  rate_limit_per_minute: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type UpdateWebhookInput = z.infer<typeof UpdateWebhookInputSchema>

/**
 * Webhook Delivery Filter
 */
export const WebhookDeliveryFilterSchema = z.object({
  webhook_id: z.string().uuid().optional(),
  event_type: WebhookEventType.optional(),
  status: WebhookDeliveryStatus.optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().min(0).default(0),
})

export type WebhookDeliveryFilter = z.infer<typeof WebhookDeliveryFilterSchema>
