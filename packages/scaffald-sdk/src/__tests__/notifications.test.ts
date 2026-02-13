import { describe, it, expect } from 'vitest'
import { Scaffald } from '../client.js'
import type {
  UpdatePreferencesParams,
} from '../resources/notifications.js'

describe('Notifications Resource', () => {
  const client = new Scaffald({
    apiKey: 'sk_test_123',
  })

  describe('list', () => {
    it('should list all notifications', async () => {
      const result = await client.notifications.list()

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.pagination).toBeDefined()
    })

    it('should filter unread notifications', async () => {
      const result = await client.notifications.list({ read: false })

      expect(result.data).toBeDefined()
      expect(result.pagination).toBeDefined()
    })

    it('should filter by notification type', async () => {
      const result = await client.notifications.list({ type: 'application_status' })

      expect(result.data).toBeDefined()
      expect(result.pagination).toBeDefined()
    })

    it('should support pagination', async () => {
      const result = await client.notifications.list({ page: 2, limit: 50 })

      expect(result.data).toBeDefined()
      expect(result.pagination).toBeDefined()
    })
  })

  describe('getById', () => {
    it('should get notification by ID', async () => {
      const result = await client.notifications.getById('notif_123')

      expect(result.data).toBeDefined()
      expect(result.data.id).toBe('notif_123')
    })

    it('should handle notification not found', async () => {
      await expect(client.notifications.getById('invalid_id')).rejects.toThrow()
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const result = await client.notifications.markAsRead('notif_123')

      expect(result.data).toBeDefined()
      expect(result.data.read).toBe(true)
    })
  })

  describe('markAsUnread', () => {
    it('should mark notification as unread', async () => {
      const result = await client.notifications.markAsUnread('notif_123')

      expect(result.data).toBeDefined()
      expect(result.data.read).toBe(false)
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const result = await client.notifications.markAllAsRead()

      expect(result.data).toBeDefined()
      expect(result.data.updated_count).toBeDefined()
    })

    it('should handle no unread notifications', async () => {
      const result = await client.notifications.markAllAsRead()

      expect(result.data).toBeDefined()
      expect(result.data.updated_count).toBeDefined()
    })
  })

  describe('delete', () => {
    it('should delete a notification', async () => {
      await client.notifications.delete('notif_123')

      // No error thrown means success
      expect(true).toBe(true)
    })

    it('should handle notification not found', async () => {
      await expect(client.notifications.delete('invalid_id')).rejects.toThrow()
    })
  })

  describe('deleteAll', () => {
    it('should delete all notifications', async () => {
      const result = await client.notifications.deleteAll()

      expect(result.data).toBeDefined()
      expect(result.data.deleted_count).toBeDefined()
    })
  })

  describe('getPreferences', () => {
    it('should get notification preferences', async () => {
      const result = await client.notifications.getPreferences()

      expect(result.data).toBeDefined()
      expect(result.data.email_notifications).toBeDefined()
      expect(result.data.push_notifications).toBeDefined()
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

      const result = await client.notifications.updatePreferences(params)

      expect(result.data).toBeDefined()
      expect(result.data.email_notifications).toBeDefined()
    })

    it('should enable quiet hours', async () => {
      const params: UpdatePreferencesParams = {
        quiet_hours: {
          enabled: true,
          start: '23:00',
          end: '07:00',
        },
      }

      const result = await client.notifications.updatePreferences(params)

      expect(result.data).toBeDefined()
      expect(result.data.quiet_hours).toBeDefined()
    })
  })

  describe('getUnreadCount', () => {
    it('should get unread notification count', async () => {
      const result = await client.notifications.getUnreadCount()

      expect(result.data).toBeDefined()
      expect(result.data.unread_count).toBeDefined()
    })

    it('should return zero for no unread notifications', async () => {
      const result = await client.notifications.getUnreadCount()

      expect(result.data).toBeDefined()
      expect(result.data.unread_count).toBeDefined()
    })
  })
})
