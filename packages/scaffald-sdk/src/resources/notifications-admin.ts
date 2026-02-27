import { Resource } from './base.js'

export interface NotificationDelivery {
  id: string
  notification_id: string
  channel: string
  provider: string | null
  provider_msg_id: string | null
  status: string
  attempts: number
  last_error: string | null
  next_attempt_at: string | null
  metadata: unknown
  created_at: string
  updated_at: string
  notification: {
    id: string
    severity: 'info' | 'important' | 'critical' | null
    title: string | null
    preview: string | null
    message: string | null
  } | null
}

export interface DigestQueueItem {
  id: string
  user_id: string
  type: string
  bucket: string
  count: number
  channels: string[] | null
  examples: unknown
  last_event_at: string | null
  processed_at: string | null
  updated_at: string
}

export interface AdminListDeliveriesParams {
  status?: 'all' | 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'bounce' | 'blocked'
  limit?: number
}

export interface AdminListDigestQueueParams {
  limit?: number
}

export class NotificationsAdmin extends Resource {
  async listDeliveries(params?: AdminListDeliveriesParams): Promise<NotificationDelivery[]> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.limit !== undefined) searchParams.set('limit', String(params.limit))
    const qs = searchParams.toString()
    return this.get<NotificationDelivery[]>(
      `/v1/notifications/admin/deliveries${qs ? `?${qs}` : ''}`
    )
  }

  async listDigestQueue(params?: AdminListDigestQueueParams): Promise<DigestQueueItem[]> {
    const searchParams = new URLSearchParams()
    if (params?.limit !== undefined) searchParams.set('limit', String(params.limit))
    const qs = searchParams.toString()
    return this.get<DigestQueueItem[]>(
      `/v1/notifications/admin/digest-queue${qs ? `?${qs}` : ''}`
    )
  }
}
