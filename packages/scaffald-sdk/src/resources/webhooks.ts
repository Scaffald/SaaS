/**
 * Webhooks Resource
 * Manage webhooks and webhook deliveries
 */

import type { HttpClient } from '../http/client.js'

export interface Webhook {
  id: string
  organization_id: string
  url: string
  secret?: string
  description?: string
  events: string[]
  is_active: boolean
  retry_max_attempts: number
  retry_backoff_seconds: number[]
  timeout_ms: number
  created_at: string
  updated_at?: string
  last_delivery_at?: string
}

export interface WebhookDelivery {
  id: string
  webhook_id: string
  event_type: string
  payload: Record<string, unknown>
  status: 'pending' | 'success' | 'failed'
  response_code?: number
  response_body?: string
  error_message?: string
  attempt_count: number
  next_retry_at?: string
  delivered_at?: string
  created_at: string
}

export interface WebhookEventType {
  value: string
  label: string
  category: string
}

export interface CreateWebhookInput {
  organizationId: string
  url: string
  description?: string
  events: string[]
}

export interface UpdateWebhookInput {
  url?: string
  description?: string
  events?: string[]
  is_active?: boolean
}

export interface WebhookListParams {
  organizationId: string
}

export interface WebhookDeliveriesParams {
  limit?: number
}

export class WebhooksResource {
  constructor(private http: HttpClient) {}

  /**
   * List all webhooks for an organization
   */
  async list(params: WebhookListParams): Promise<{ data: Webhook[] }> {
    const searchParams = new URLSearchParams({
      organizationId: params.organizationId,
    })

    const response = await this.http.request<{ data: Webhook[] }>(
      `/v1/webhooks?${searchParams.toString()}`,
      {
        method: 'GET',
      }
    )

    return response
  }

  /**
   * Get webhook by ID
   */
  async retrieve(id: string): Promise<{ data: Webhook }> {
    const response = await this.http.request<{ data: Webhook }>(`/v1/webhooks/${id}`, {
      method: 'GET',
    })

    return response
  }

  /**
   * Create a new webhook
   */
  async create(input: CreateWebhookInput): Promise<{ data: Webhook }> {
    const response = await this.http.request<{ data: Webhook }>('/v1/webhooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    return response
  }

  /**
   * Update an existing webhook
   */
  async update(id: string, input: UpdateWebhookInput): Promise<{ data: Webhook }> {
    const response = await this.http.request<{ data: Webhook }>(`/v1/webhooks/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    return response
  }

  /**
   * Delete a webhook
   */
  async delete(id: string): Promise<{ success: boolean }> {
    const response = await this.http.request<{ success: boolean }>(`/v1/webhooks/${id}`, {
      method: 'DELETE',
    })

    return response
  }

  /**
   * Get available webhook event types
   */
  async eventTypes(): Promise<{ data: WebhookEventType[] }> {
    const response = await this.http.request<{ data: WebhookEventType[] }>(
      '/v1/webhooks/event-types',
      {
        method: 'GET',
      }
    )

    return response
  }

  /**
   * Get webhook delivery history
   */
  async deliveries(
    webhookId: string,
    params?: WebhookDeliveriesParams
  ): Promise<{ data: WebhookDelivery[] }> {
    const searchParams = new URLSearchParams()
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString())
    }

    const url = `/v1/webhooks/${webhookId}/deliveries${
      searchParams.toString() ? `?${searchParams.toString()}` : ''
    }`

    const response = await this.http.request<{ data: WebhookDelivery[] }>(url, {
      method: 'GET',
    })

    return response
  }

  /**
   * Retry a failed webhook delivery
   */
  async retryDelivery(deliveryId: string): Promise<{ success: boolean }> {
    const response = await this.http.request<{ success: boolean }>(
      `/v1/webhooks/deliveries/${deliveryId}/retry`,
      {
        method: 'POST',
      }
    )

    return response
  }
}
