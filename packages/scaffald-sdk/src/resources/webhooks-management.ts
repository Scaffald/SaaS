import { Resource } from './base.js'
import type {
  Webhook,
  WebhookWithSecret,
  WebhookDelivery,
  WebhookEventTypeInfo,
  CreateWebhookParams,
  UpdateWebhookParams,
  ListDeliveriesParams,
  WebhooksListResponse,
  WebhookResponse,
  WebhookCreatedResponse,
  DeliveriesListResponse,
  RetryDeliveryResponse,
  DeleteWebhookResponse,
  EventTypesResponse,
} from '../types/webhooks-management.js'

/**
 * Webhooks Management resource for managing webhook endpoints and deliveries
 *
 * @remarks
 * All methods require authentication (OAuth token)
 * Webhooks enable real-time event notifications to external systems
 */
export class WebhooksManagement extends Resource {
  /**
   * List all webhooks for the user's organization
   *
   * @returns List of webhooks
   *
   * @example
   * ```typescript
   * // List all webhooks
   * const { data: webhooks } = await client.webhooksManagement.list()
   * for (const webhook of webhooks) {
   *   console.log(`${webhook.url} - ${webhook.is_active ? 'Active' : 'Inactive'}`)
   *   console.log(`Events: ${webhook.events.join(', ')}`)
   * }
   * ```
   */
  async list(): Promise<WebhooksListResponse> {
    return this.get<WebhooksListResponse>('/v1/webhooks')
  }

  /**
   * Get a single webhook by ID
   *
   * @param id - The webhook ID
   * @returns The webhook object
   *
   * @example
   * ```typescript
   * const { data: webhook } = await client.webhooksManagement.retrieve('webhook_123')
   * console.log(`URL: ${webhook.url}`)
   * console.log(`Status: ${webhook.is_active ? 'Active' : 'Inactive'}`)
   * ```
   */
  async retrieve(id: string): Promise<WebhookResponse> {
    return this.get<WebhookResponse>(`/v1/webhooks/${id}`)
  }

  /**
   * Create a new webhook
   *
   * @param params - Webhook creation parameters
   * @returns The created webhook with secret
   *
   * @remarks
   * **IMPORTANT**: The webhook secret is only returned once during creation.
   * You must save it immediately - it cannot be retrieved again.
   * Use this secret to verify webhook signatures.
   *
   * @example
   * ```typescript
   * // Create a webhook for job events
   * const result = await client.webhooksManagement.create({
   *   url: 'https://api.example.com/webhooks/scaffald',
   *   description: 'Production webhook for job events',
   *   events: ['job.created', 'job.published', 'job.closed'],
   *   retry_max_attempts: 5,
   *   timeout_ms: 15000,
   *   metadata: { environment: 'production' }
   * })
   *
   * // IMPORTANT: Save result.data.secret immediately!
   * console.log('Secret:', result.data.secret)
   * console.log('Message:', result.message)
   * ```
   */
  async create(params: CreateWebhookParams): Promise<WebhookCreatedResponse> {
    return this.post<WebhookCreatedResponse>('/v1/webhooks', params)
  }

  /**
   * Update a webhook
   *
   * @param id - The webhook ID
   * @param params - Update parameters
   * @returns The updated webhook
   *
   * @remarks
   * Only organization admins can update webhooks
   *
   * @example
   * ```typescript
   * // Update webhook URL and events
   * const { data: webhook } = await client.webhooksManagement.update('webhook_123', {
   *   url: 'https://api.example.com/webhooks/new-endpoint',
   *   events: ['job.created', 'application.created'],
   *   is_active: true
   * })
   *
   * // Deactivate a webhook
   * await client.webhooksManagement.update('webhook_123', {
   *   is_active: false
   * })
   * ```
   */
  async update(id: string, params: UpdateWebhookParams): Promise<WebhookResponse> {
    return this.patch<WebhookResponse>(`/v1/webhooks/${id}`, params)
  }

  /**
   * Delete a webhook
   *
   * @param id - The webhook ID to delete
   * @returns Confirmation of deletion
   *
   * @remarks
   * Only organization owners can delete webhooks.
   * This will permanently delete the webhook and stop all deliveries.
   *
   * @example
   * ```typescript
   * // Delete a webhook
   * const result = await client.webhooksManagement.delete('webhook_123')
   * if (result.success) {
   *   console.log('Webhook deleted successfully')
   * }
   * ```
   */
  async delete(id: string): Promise<DeleteWebhookResponse> {
    return this.del<DeleteWebhookResponse>(`/v1/webhooks/${id}`)
  }

  /**
   * List deliveries for a webhook
   *
   * @param webhookId - The webhook ID
   * @param params - Optional filtering and pagination parameters
   * @returns List of webhook deliveries
   *
   * @example
   * ```typescript
   * // Get recent deliveries
   * const { data: deliveries } = await client.webhooksManagement.listDeliveries('webhook_123')
   * for (const delivery of deliveries) {
   *   console.log(`${delivery.event_type} - ${delivery.status}`)
   *   if (delivery.error_message) {
   *     console.log(`Error: ${delivery.error_message}`)
   *   }
   * }
   *
   * // Get failed deliveries
   * const { data: failed } = await client.webhooksManagement.listDeliveries('webhook_123', {
   *   status: 'failed',
   *   limit: 100
   * })
   * console.log(`${failed.length} failed deliveries`)
   *
   * // Filter by event type
   * const { data: jobEvents } = await client.webhooksManagement.listDeliveries('webhook_123', {
   *   event_type: 'job.created',
   *   limit: 20
   * })
   * ```
   */
  async listDeliveries(
    webhookId: string,
    params?: ListDeliveriesParams
  ): Promise<DeliveriesListResponse> {
    return this.get<DeliveriesListResponse>(`/v1/webhooks/${webhookId}/deliveries`, params)
  }

  /**
   * Retry a failed webhook delivery
   *
   * @param deliveryId - The delivery ID to retry
   * @returns Confirmation of retry scheduling
   *
   * @remarks
   * Only organization admins can retry deliveries.
   * The delivery will be scheduled for immediate retry.
   *
   * @example
   * ```typescript
   * // Retry a failed delivery
   * const result = await client.webhooksManagement.retryDelivery('delivery_456')
   * console.log(result.message) // "Delivery scheduled for retry"
   * ```
   */
  async retryDelivery(deliveryId: string): Promise<RetryDeliveryResponse> {
    return this.post<RetryDeliveryResponse>(`/v1/webhooks/deliveries/${deliveryId}/retry`, {})
  }

  /**
   * Get available webhook event types
   *
   * @returns List of event types with labels and categories
   *
   * @example
   * ```typescript
   * // Get all available event types
   * const { data: eventTypes } = await client.webhooksManagement.eventTypes()
   * const jobEvents = eventTypes.filter(e => e.category === 'job')
   * console.log('Job Events:')
   * for (const event of jobEvents) {
   *   console.log(`  ${event.value} - ${event.label}`)
   * }
   * ```
   */
  async eventTypes(): Promise<EventTypesResponse> {
    return this.get<EventTypesResponse>('/v1/webhooks/event-types')
  }
}
