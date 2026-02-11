import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Scaffald } from '../client.js'
import type {
  Notification,
  NotificationsListResponse,
  NotificationPreferences,
  UpdatePreferencesParams,
} from '../resources/notifications.js'

describe('Notifications Resource', () => {
  let client: Scaffald
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockFetch = vi.fn()
    global.fetch = mockFetch
    client = new Scaffald({
      apiKey: 'test-api-key',
      baseURL: 'https://api.test.com',
    })
  })

  describe('list', () => {
    it('should list all notifications', async () => {
      const mockResponse: NotificationsListResponse = {
        data: [
          {
            id: 'notif_1',
            user_id: 'user_123',
            type: 'application_status',
            title: 'Application Updated',
            message: 'Your application status changed to In Review',
            read: false,
            created_at: '2024-01-15T10:00:00Z',
          },
          {
            id: 'notif_2',
            user_id: 'user_123',
            type: 'connection_request',
            title: 'New Connection',
            message: 'John Doe sent you a connection request',
            read: true,
            created_at: '2024-01-14T10:00:00Z',
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          total_pages: 1,
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      })

      const result = await client.notifications.list()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/notifications',
        expect.any(Object)
      )
      expect(result.data).toHaveLength(2)
    })

    it('should filter unread notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [
            {
              id: 'notif_1',
              user_id: 'user_123',
              type: 'application_status',
              title: 'Application Updated',
              message: 'Status changed',
              read: false,
              created_at: '2024-01-15T10:00:00Z',
            },
          ],
          pagination: { total: 1, page: 1, limit: 20, total_pages: 1 },
        }),
      })

      const result = await client.notifications.list({ read: false })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/notifications?read=false',
        expect.any(Object)
      )
      expect(result.data[0].read).toBe(false)
    })

    it('should filter by notification type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [],
          pagination: { total: 0, page: 1, limit: 20, total_pages: 0 },
        }),
      })

      await client.notifications.list({ type: 'application_status' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/notifications?type=application_status',
        expect.any(Object)
      )
    })

    it('should support pagination', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [],
          pagination: { total: 100, page: 2, limit: 50, total_pages: 2 },
        }),
      })

      await client.notifications.list({ page: 2, limit: 50 })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/notifications?page=2&limit=50',
        expect.any(Object)
      )
    })
  })

  describe('get', () => {
    it('should get notification by ID', async () => {
      const mockNotification: Notification = {
        id: 'notif_123',
        user_id: 'user_123',
        type: 'message',
        title: 'New Message',
        message: 'You have a new message from Jane',
        read: false,
        created_at: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockNotification }),
      })

      const result = await client.notifications.get('notif_123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/notifications/notif_123',
        expect.any(Object)
      )
      expect(result.data.id).toBe('notif_123')
    })

    it('should handle notification not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Notification not found' }),
      })

      await expect(client.notifications.get('invalid_id')).rejects.toThrow()
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification: Notification = {
        id: 'notif_123',
        user_id: 'user_123',
        type: 'message',
        title: 'New Message',
        message: 'You have a new message',
        read: true,
        read_at: '2024-01-15T11:00:00Z',
        created_at: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockNotification }),
      })

      const result = await client.notifications.markAsRead('notif_123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/notifications/notif_123/read',
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(result.data.read).toBe(true)
    })
  })

  describe('markAsUnread', () => {
    it('should mark notification as unread', async () => {
      const mockNotification: Notification = {
        id: 'notif_123',
        user_id: 'user_123',
        type: 'message',
        title: 'New Message',
        message: 'You have a new message',
        read: false,
        created_at: '2024-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockNotification }),
      })

      const result = await client.notifications.markAsUnread('notif_123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/notifications/notif_123/unread',
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(result.data.read).toBe(false)
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: { updated_count: 5 } }),
      })

      const result = await client.notifications.markAllAsRead()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/notifications/read-all',
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(result.data.updated_count).toBe(5)
    })

    it('should handle no unread notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: { updated_count: 0 } }),
      })

      const result = await client.notifications.markAllAsRead()

      expect(result.data.updated_count).toBe(0)
    })
  })

  describe('delete', () => {
    it('should delete a notification', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Headers(),
      })

      await client.notifications.delete('notif_123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/notifications/notif_123',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('should handle notification not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Notification not found' }),
      })

      await expect(client.notifications.delete('invalid_id')).rejects.toThrow()
    })
  })

  describe('deleteAll', () => {
    it('should delete all notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: { deleted_count: 10 } }),
      })

      const result = await client.notifications.deleteAll()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/notifications',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
      expect(result.data.deleted_count).toBe(10)
    })
  })

  describe('getPreferences', () => {
    it('should get notification preferences', async () => {
      const mockPreferences: NotificationPreferences = {
        user_id: 'user_123',
        email_notifications: true,
        push_notifications: true,
        notification_types: {
          application_status: { email: true, push: true },
          connection_request: { email: true, push: true },
          message: { email: false, push: true },
          job_match: { email: true, push: false },
        },
        quiet_hours: {
          enabled: true,
          start: '22:00',
          end: '08:00',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockPreferences }),
      })

      const result = await client.notifications.getPreferences()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/notifications/preferences',
        expect.any(Object)
      )
      expect(result.data.email_notifications).toBe(true)
    })
  })

  describe('updatePreferences', () => {
    it('should update notification preferences', async () => {
      const params: UpdatePreferencesParams = {
        email_notifications: false,
        push_notifications: true,
        notification_types: {
          message: { email: false, push: true },
        },
      }

      const mockPreferences: NotificationPreferences = {
        user_id: 'user_123',
        email_notifications: false,
        push_notifications: true,
        notification_types: {
          application_status: { email: true, push: true },
          connection_request: { email: true, push: true },
          message: { email: false, push: true },
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: mockPreferences }),
      })

      const result = await client.notifications.updatePreferences(params)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/notifications/preferences',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(params),
        })
      )
      expect(result.data.email_notifications).toBe(false)
    })

    it('should enable quiet hours', async () => {
      const params: UpdatePreferencesParams = {
        quiet_hours: {
          enabled: true,
          start: '23:00',
          end: '07:00',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: {
            user_id: 'user_123',
            quiet_hours: params.quiet_hours,
          },
        }),
      })

      const result = await client.notifications.updatePreferences(params)

      expect(result.data.quiet_hours?.enabled).toBe(true)
    })
  })

  describe('getUnreadCount', () => {
    it('should get unread notification count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: { unread_count: 5 } }),
      })

      const result = await client.notifications.getUnreadCount()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/notifications/unread-count',
        expect.any(Object)
      )
      expect(result.data.unread_count).toBe(5)
    })

    it('should return zero for no unread notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ data: { unread_count: 0 } }),
      })

      const result = await client.notifications.getUnreadCount()

      expect(result.data.unread_count).toBe(0)
    })
  })

  describe('error handling', () => {
    it('should handle 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Unauthorized' }),
      })

      await expect(client.notifications.list()).rejects.toThrow()
    })

    it('should handle 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Rate limit exceeded' }),
      })

      await expect(client.notifications.markAllAsRead()).rejects.toThrow()
    })

    it('should handle 500 server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Internal server error' }),
      })

      await expect(client.notifications.get('notif_123')).rejects.toThrow()
    })
  })
})
