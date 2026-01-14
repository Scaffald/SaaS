/**
 * Webhooks Management Types
 *
 * Types for managing webhook endpoints, deliveries, and events
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Webhook delivery status
 */
export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed' | 'retrying'

/**
 * Webhook event type
 * Events that can trigger webhook deliveries
 */
export type WebhookEventType = string

/**
 * Webhook endpoint object
 */
export interface Webhook {
  /** Unique identifier */
  id: string
  /** Organization ID */
  organization_id: string
  /** Webhook URL (must be HTTPS) */
  url: string
  /** Optional description */
  description: string | null
  /** Webhook secret for signature verification (only shown once on creation) */
  secret?: string
  /** Events that trigger this webhook */
  events: string[]
  /** Whether the webhook is active */
  is_active: boolean
  /** Maximum retry attempts for failed deliveries */
  retry_max_attempts: number
  /** Timeout in milliseconds */
  timeout_ms: number
  /** Rate limit per minute */
  rate_limit_per_minute: number | null
  /** Additional metadata */
  metadata: Record<string, unknown>
  /** User who created the webhook */
  created_by: string | null
  /** User who last updated the webhook */
  updated_by: string | null
  /** When the webhook was created (ISO 8601) */
  created_at: string
  /** When the webhook was last updated (ISO 8601) */
  updated_at: string
}

/**
 * Webhook with secret (only returned on creation)
 */
export interface WebhookWithSecret extends Webhook {
  /** The webhook secret - MUST be saved immediately, never shown again */
  secret: string
}

/**
 * Webhook delivery record
 */
export interface WebhookDelivery {
  /** Unique identifier */
  id: string
  /** Webhook ID */
  webhook_id: string
  /** Event type that triggered this delivery */
  event_type: string
  /** Delivery status */
  status: WebhookDeliveryStatus
  /** HTTP status code from webhook endpoint */
  response_status_code: number | null
  /** Response body from webhook endpoint */
  response_body: string | null
  /** Error message if delivery failed */
  error_message: string | null
  /** Number of retry attempts made */
  retry_count: number
  /** When to retry next (ISO 8601) */
  next_retry_at: string | null
  /** Event payload sent to webhook */
  payload: Record<string, unknown>
  /** When the delivery was created (ISO 8601) */
  created_at: string
  /** When the delivery was completed (ISO 8601) */
  completed_at: string | null
}

/**
 * Webhook event type info
 */
export interface WebhookEventTypeInfo {
  /** Event type value (e.g., "job.created") */
  value: string
  /** Human-readable label */
  label: string
  /** Event category (e.g., "job", "application") */
  category: string
}

// ============================================================================
// Request Parameters
// ============================================================================

/**
 * Parameters for creating a webhook
 */
export interface CreateWebhookParams {
  /** Webhook URL (must be HTTPS) */
  url: string
  /** Optional description */
  description?: string
  /** Events that trigger this webhook (at least one required) */
  events: string[]
  /** Maximum retry attempts (0-10, default 3) */
  retry_max_attempts?: number
  /** Timeout in milliseconds (1000-60000, default 10000) */
  timeout_ms?: number
  /** Rate limit per minute */
  rate_limit_per_minute?: number
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Parameters for updating a webhook
 */
export interface UpdateWebhookParams {
  /** Update webhook URL */
  url?: string
  /** Update description */
  description?: string
  /** Activate or deactivate the webhook */
  is_active?: boolean
  /** Update events (at least one required if provided) */
  events?: string[]
  /** Update retry attempts (0-10) */
  retry_max_attempts?: number
  /** Update timeout (1000-60000) */
  timeout_ms?: number
  /** Update rate limit */
  rate_limit_per_minute?: number
  /** Update metadata */
  metadata?: Record<string, unknown>
}

/**
 * Parameters for listing webhook deliveries
 */
export interface ListDeliveriesParams {
  /** Filter by event type */
  event_type?: string
  /** Filter by delivery status */
  status?: WebhookDeliveryStatus
  /** Maximum number of deliveries to return (1-100, default 50) */
  limit?: number
  /** Number of deliveries to skip (default 0) */
  offset?: number
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Response when listing webhooks
 */
export interface WebhooksListResponse {
  data: Webhook[]
}

/**
 * Response when retrieving a webhook
 */
export interface WebhookResponse {
  data: Webhook
}

/**
 * Response when creating a webhook
 */
export interface WebhookCreatedResponse {
  /** The created webhook with secret */
  data: WebhookWithSecret
  /** Important message about saving the secret */
  message: string
}

/**
 * Response when updating a webhook
 */
export interface WebhookUpdatedResponse {
  data: Webhook
}

/**
 * Response when deleting a webhook
 */
export interface DeleteWebhookResponse {
  success: boolean
}

/**
 * Response when listing deliveries
 */
export interface DeliveriesListResponse {
  data: WebhookDelivery[]
}

/**
 * Response when retrying a delivery
 */
export interface RetryDeliveryResponse {
  success: boolean
  message: string
}

/**
 * Response when getting event types
 */
export interface EventTypesResponse {
  data: WebhookEventTypeInfo[]
}
