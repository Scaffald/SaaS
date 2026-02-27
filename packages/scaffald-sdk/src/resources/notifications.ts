import { Resource } from './base'

// ============================================================================
// Type Definitions
// ============================================================================

export type NotificationType =
  | 'application_status'
  | 'connection_request'
  | 'message'
  | 'job_match'
  | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  read_at?: string | null
  metadata?: Record<string, unknown> | null
  action_url?: string | null
  created_at: string
  updated_at?: string
}

export interface ListNotificationsParams {
  read?: boolean
  type?: NotificationType
  page?: number
  limit?: number
}

export interface NotificationsListResponse {
  data: Notification[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export interface NotificationResponse {
  data: Notification
}

export interface UnreadCountResponse {
  data: {
    unread_count: number
  }
}

export interface MarkAllAsReadResponse {
  data: {
    updated_count: number
  }
}

export interface DeleteAllResponse {
  data: {
    deleted_count: number
  }
}

// Preferences Types
export interface QuietHours {
  enabled: boolean
  start: string // Format: HH:MM
  end: string // Format: HH:MM
}

export interface NotificationTypeSettings {
  email: boolean
  push: boolean
}

export interface NotificationPreferences {
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  notification_types: Record<string, NotificationTypeSettings>
  quiet_hours?: QuietHours
}

export interface UpdatePreferencesParams {
  email_notifications?: boolean
  push_notifications?: boolean
  notification_types?: Record<string, Partial<NotificationTypeSettings>>
  quiet_hours?: QuietHours
}

export interface PreferencesResponse {
  data: NotificationPreferences
}

// ============================================================================
// Notifications Resource
// ============================================================================

/**
 * Notifications Resource
 * Handles user notifications and preferences
 */
export class Notifications extends Resource {
  /**
   * List notifications with filtering and pagination
   */
  async list(params?: ListNotificationsParams): Promise<NotificationsListResponse> {
    return super.get<NotificationsListResponse>('/v1/notifications', params)
  }

  /**
   * Get notification by ID
   */
  async getById(id: string): Promise<NotificationResponse> {
    return super.get<NotificationResponse>(`/v1/notifications/${id}`)
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string): Promise<NotificationResponse> {
    return this.patch<NotificationResponse>(`/v1/notifications/${id}/read`, {})
  }

  /**
   * Mark a notification as unread
   */
  async markAsUnread(id: string): Promise<NotificationResponse> {
    return this.patch<NotificationResponse>(`/v1/notifications/${id}/unread`, {})
  }

  /**
   * Mark all unread notifications as read
   */
  async markAllAsRead(): Promise<MarkAllAsReadResponse> {
    return this.post<MarkAllAsReadResponse>('/v1/notifications/read-all')
  }

  /**
   * Delete a notification
   */
  async delete(id: string): Promise<void> {
    return this.del<void>(`/v1/notifications/${id}`)
  }

  /**
   * Delete all notifications
   */
  async deleteAll(): Promise<DeleteAllResponse> {
    return this.del<DeleteAllResponse>('/v1/notifications')
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<PreferencesResponse> {
    return super.get<PreferencesResponse>('/v1/notifications/preferences')
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(params: UpdatePreferencesParams): Promise<PreferencesResponse> {
    return this.patch<PreferencesResponse>('/v1/notifications/preferences', params)
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    return super.get<UnreadCountResponse>('/v1/notifications/unread-count')
  }
}
