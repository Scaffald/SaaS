import { Resource } from './base'

// ============================================================================
// Type Definitions
// ============================================================================

export type NotificationStatus = 'all' | 'unread' | 'read' | 'archived'
export type NotificationSeverity = 'low' | 'medium' | 'high' | 'critical'
export type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms'
export type DigestFrequency = 'immediate' | 'digest_daily' | 'digest_weekly' | 'mute'
export type DevicePlatform = 'ios' | 'android' | 'web'

export interface Notification {
  id: string
  user_id: string
  type: string
  severity: NotificationSeverity
  title: string
  message: string
  preview?: string | null
  body?: string | null
  metadata?: Record<string, unknown> | null
  read: boolean
  read_at?: string | null
  archived_at?: string | null
  routed_channels?: NotificationChannel[] | null
  cta_label?: string | null
  cta_url?: string | null
  created_at: string
  updated_at: string
}

export interface ListNotificationsParams {
  status?: NotificationStatus
  limit?: number
  cursor?: string
}

export interface ListNotificationsResponse {
  items: Notification[]
  nextCursor: string | null
}

export interface UnreadCountResponse {
  count: number
}

export interface MarkAsReadParams {
  id: string
}

export interface MarkAsUnreadParams {
  id: string
}

export interface BulkIdsParams {
  ids: string[]
}

export interface SuccessResponse {
  success: boolean
}

export interface MarkAllAsReadResponse {
  success: boolean
  updated: number
}

// Preferences Types
export interface QuietHours {
  start: string // Format: HH:MM
  end: string // Format: HH:MM
}

export interface ChannelSettings {
  in_app?: boolean
  email?: boolean
  push?: boolean
  sms?: boolean
}

export interface TypeOverride {
  channels?: Partial<ChannelSettings>
  frequency?: DigestFrequency
}

export interface NotificationPreferences {
  globalEnabled: boolean
  channelEnabled: ChannelSettings
  quietHours: QuietHours | null
  digestFrequency: DigestFrequency
  typeOverrides: Record<string, TypeOverride>
  updatedAt: string | null
}

export interface SavePreferencesParams {
  globalEnabled?: boolean
  channelEnabled?: Partial<ChannelSettings>
  quietHours?: QuietHours
  digestFrequency?: DigestFrequency
  typeOverrides?: Record<string, TypeOverride>
}

// Devices Types
export interface NotificationDevice {
  id: string
  token: string
  platform: DevicePlatform
  metadata?: Record<string, unknown>
  last_seen_at: string
  created_at: string
}

export interface RegisterDeviceParams {
  token: string
  platform: DevicePlatform
  metadata?: Record<string, unknown>
}

export interface RemoveDeviceParams {
  token: string
}

// ============================================================================
// Notifications Resource
// ============================================================================

/**
 * Notifications Resource
 * Handles user notifications, preferences, and device registration
 */
export class Notifications extends Resource {
  /**
   * List notifications with filtering and pagination
   */
  async list(params?: ListNotificationsParams): Promise<ListNotificationsResponse> {
    return this.get<ListNotificationsResponse>('/v1/notifications', params)
  }

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    return this.get<UnreadCountResponse>('/v1/notifications/unread-count')
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(params: MarkAsReadParams): Promise<Notification> {
    return this.patch<Notification>(`/v1/notifications/${params.id}/read`, {})
  }

  /**
   * Mark a notification as unread
   */
  async markAsUnread(params: MarkAsUnreadParams): Promise<Notification> {
    return this.patch<Notification>(`/v1/notifications/${params.id}/unread`, {})
  }

  /**
   * Mark multiple notifications as read
   */
  async markManyRead(params: BulkIdsParams): Promise<SuccessResponse> {
    return this.post<SuccessResponse>('/v1/notifications/mark-read', params)
  }

  /**
   * Mark multiple notifications as unread
   */
  async markManyUnread(params: BulkIdsParams): Promise<SuccessResponse> {
    return this.post<SuccessResponse>('/v1/notifications/mark-unread', params)
  }

  /**
   * Archive multiple notifications
   */
  async archiveMany(params: BulkIdsParams): Promise<SuccessResponse> {
    return this.post<SuccessResponse>('/v1/notifications/archive', params)
  }

  /**
   * Restore multiple notifications from archive
   */
  async restoreMany(params: BulkIdsParams): Promise<SuccessResponse> {
    return this.post<SuccessResponse>('/v1/notifications/restore', params)
  }

  /**
   * Mark all unread notifications as read
   */
  async markAllAsRead(): Promise<MarkAllAsReadResponse> {
    return this.post<MarkAllAsReadResponse>('/v1/notifications/mark-all-read', {})
  }

  /**
   * Delete multiple notifications (soft delete)
   */
  async deleteMany(params: BulkIdsParams): Promise<SuccessResponse> {
    return this.post<SuccessResponse>('/v1/notifications/delete', params)
  }

  // ============================================================================
  // Preferences
  // ============================================================================

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    return this.get<NotificationPreferences>('/v1/notifications/preferences')
  }

  /**
   * Save notification preferences
   */
  async savePreferences(params: SavePreferencesParams): Promise<SuccessResponse> {
    return this.post<SuccessResponse>('/v1/notifications/preferences', params)
  }

  // ============================================================================
  // Devices
  // ============================================================================

  /**
   * List registered notification devices
   */
  async listDevices(): Promise<NotificationDevice[]> {
    return this.get<NotificationDevice[]>('/v1/notifications/devices')
  }

  /**
   * Register a device for push notifications
   */
  async registerDevice(params: RegisterDeviceParams): Promise<SuccessResponse> {
    return this.post<SuccessResponse>('/v1/notifications/devices', params)
  }

  /**
   * Remove a registered device
   */
  async removeDevice(params: RemoveDeviceParams): Promise<SuccessResponse> {
    return this.del<SuccessResponse>(`/v1/notifications/devices/${params.token}`)
  }
}
