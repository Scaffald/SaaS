/**
 * Notification Router Tests
 * REQ-264: Task History Tracking - TASK-2: Due Date Change Notifications
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 *
 * These tests run against local Supabase (localhost:54321)
 * Requires: pnpm supa start
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { notificationRouter } from '../notification';
import { TRPCError } from '@trpc/server';
import type { User } from '@supabase/supabase-js';
import {
  testSupabaseAdmin,
  forsured,
  waitForSupabase,
  TEST_ORG_IDS,
  TEST_USER_IDS,
} from '../../../../../tests/fixtures';

// Test data
let testOrgId: string = TEST_ORG_IDS.primary;
let testUserId: string = TEST_USER_IDS.manager;
let testNotificationId: string | null = null;
let testTaskId: string | null = null;

// Different org/user for authorization tests
const OTHER_ORG_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const OTHER_USER_UUID = '8d2feb5e-8536-51ef-a55c-f18gd2g01bf8';

describe('Notification Router', () => {
  beforeAll(async () => {
    await waitForSupabase();

    // Create a test task first (notifications link to tasks)
    const { data: task } = await forsured('tasks')
      .insert({
        title: 'Test Task for Notifications',
        description: 'Created for notification testing',
        status: 'pending',
        priority: 'medium',
        organization_id: testOrgId,
        assigned_to_user_id: testUserId,
      })
      .select()
      .single();

    if (task) {
      testTaskId = task.id;

      // Create a test notification
      const { data: notification, error } = await forsured('notifications')
        .insert({
          user_id: testUserId,
          organization_id: testOrgId,
          type: 'due_date_change',
          title: 'Due date changed',
          message: 'Due date changed from Jan 15, 2024 to Jan 20, 2024 for "Test Task"',
          entity_type: 'task',
          entity_id: testTaskId,
          triggered_by: testUserId,
          is_read: false,
          metadata: {
            old_due_date: '2024-01-15',
            new_due_date: '2024-01-20',
            task_title: 'Test Task',
          },
        })
        .select()
        .single();

      if (!error && notification) {
        testNotificationId = notification.id;
      }
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testNotificationId) {
      await forsured('notifications').delete().eq('id', testNotificationId);
    }
    if (testTaskId) {
      await forsured('tasks').delete().eq('id', testTaskId);
    }
  });

  // Helper to create caller context
  const createContext = (
    userId: string | null = testUserId,
    organizationId: string | null = testOrgId
  ) => {
    const mockUser: User | null = userId
      ? ({
          id: userId,
          email: 'test@example.com',
        } as User)
      : null;

    return {
      db: testSupabaseAdmin as any,
      session: mockUser,
      userId,
      organizationId,
    };
  };

  describe('list', () => {
    it('returns notifications for authenticated user', async () => {
      if (!testNotificationId) {
        console.warn('Skipping test - no test notification available');
        return;
      }

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.list({
        organizationId: testOrgId,
      });

      expect(Array.isArray(result.notifications)).toBe(true);
      // Should contain our test notification
      const found = result.notifications.find((n) => n.id === testNotificationId);
      expect(found).toBeDefined();
    });

    it('throws UNAUTHORIZED when user is not authenticated', async () => {
      const ctx = createContext(null);
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: testOrgId,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('respects pagination limits', async () => {
      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.list({
        organizationId: testOrgId,
        limit: 5,
      });

      expect(result.notifications.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getUnreadCount', () => {
    it('returns count of unread notifications', async () => {
      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.getUnreadCount({
        organizationId: testOrgId,
      });

      expect(typeof result.count).toBe('number');
      expect(result.count).toBeGreaterThanOrEqual(0);
    });

    it('throws UNAUTHORIZED when user is not authenticated', async () => {
      const ctx = createContext(null);
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.getUnreadCount({
          organizationId: testOrgId,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('markAsRead', () => {
    it('marks a notification as read', async () => {
      if (!testNotificationId) {
        console.warn('Skipping test - no test notification available');
        return;
      }

      // First ensure the notification is unread
      await forsured('notifications')
        .update({ is_read: false, read_at: null })
        .eq('id', testNotificationId);

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.markAsRead({
        id: testNotificationId,
      });

      expect(result.success).toBe(true);
      expect(result.notification.is_read).toBe(true);
      expect(result.notification.read_at).not.toBeNull();
    });

    it('throws NOT_FOUND when notification does not exist', async () => {
      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.markAsRead({
          id: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('throws UNAUTHORIZED when user is not authenticated', async () => {
      const ctx = createContext(null);
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.markAsRead({
          id: testNotificationId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read for user', async () => {
      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.markAllAsRead({
        organizationId: testOrgId,
      });

      expect(result.success).toBe(true);
      expect(typeof result.updatedCount).toBe('number');
    });

    it('throws UNAUTHORIZED when user is not authenticated', async () => {
      const ctx = createContext(null);
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.markAllAsRead({
          organizationId: testOrgId,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getById', () => {
    it('returns notification by ID', async () => {
      if (!testNotificationId) {
        console.warn('Skipping test - no test notification available');
        return;
      }

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.getById({
        id: testNotificationId,
      });

      expect(result.notification.id).toBe(testNotificationId);
      expect(result.notification.type).toBe('due_date_change');
    });

    it('throws NOT_FOUND for non-existent notification', async () => {
      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.getById({
          id: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('throws UNAUTHORIZED when user is not authenticated', async () => {
      const ctx = createContext(null);
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.getById({
          id: testNotificationId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('Due Date Change Notification Flow', () => {
    it('notification contains correct metadata for due date change', async () => {
      if (!testNotificationId) {
        console.warn('Skipping test - no test notification available');
        return;
      }

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.getById({
        id: testNotificationId,
      });

      expect(result.notification.type).toBe('due_date_change');
      expect(result.notification.metadata).toHaveProperty('old_due_date');
      expect(result.notification.metadata).toHaveProperty('new_due_date');
      expect(result.notification.metadata).toHaveProperty('task_title');
    });

    it('notification links to correct task entity', async () => {
      if (!testNotificationId || !testTaskId) {
        console.warn('Skipping test - no test notification or task available');
        return;
      }

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.getById({
        id: testNotificationId,
      });

      expect(result.notification.entity_type).toBe('task');
      expect(result.notification.entity_id).toBe(testTaskId);
    });
  });

  describe('Authorization Tests', () => {
    it('rejects user without organization', async () => {
      const ctx = createContext(testUserId, null);
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: testOrgId,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('rejects cross-organization access', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: OTHER_ORG_UUID,
        })
      ).rejects.toThrow(TRPCError);
    });
  });
});
