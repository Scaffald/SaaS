/**
 * Notification Router Tests
 * REQ-264: Task History Tracking - TASK-2: Due Date Change Notifications
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { notificationRouter } from '../notification';
import { TRPCError } from '@trpc/server';
import type { User } from '@supabase/supabase-js';
import * as supabaseModule from '../../../../lib/supabase';

// Mock the supabase module
vi.mock('../../../../lib/supabase', () => ({
  supabase: {
    schema: vi.fn(() => ({
      from: vi.fn(),
    })),
  },
  forsured: vi.fn(),
}));

// Test UUIDs (v4 format)
const ORG_UUID = '550e8400-e29b-41d4-a716-446655440000';
const USER_UUID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const OTHER_USER_UUID = '8d2feb5e-8536-51ef-a55c-f18gd2g01bf8';
const NOTIFICATION_UUID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
const TASK_UUID = 'a987fbc9-4bed-3078-cf07-9141ba07c9f3';

// Mock notification data
const createMockNotification = (overrides = {}) => ({
  id: NOTIFICATION_UUID,
  user_id: USER_UUID,
  organization_id: ORG_UUID,
  type: 'due_date_change',
  title: 'Due date changed',
  message: 'Due date changed from Jan 15, 2024 to Jan 20, 2024 for "Test Task"',
  entity_type: 'task',
  entity_id: TASK_UUID,
  triggered_by: OTHER_USER_UUID,
  is_read: false,
  read_at: null,
  metadata: {
    old_due_date: '2024-01-15',
    new_due_date: '2024-01-20',
    task_title: 'Test Task',
  },
  created_at: new Date().toISOString(),
  ...overrides,
});

// Helper to create chainable mock query
const createChainableMock = (finalResult: { data?: any; error?: any; count?: number }) => {
  const mock: any = {};

  // All methods return the mock (this) for chaining
  mock.select = vi.fn().mockReturnValue(mock);
  mock.eq = vi.fn().mockReturnValue(mock);
  mock.order = vi.fn().mockReturnValue(mock);
  mock.limit = vi.fn().mockReturnValue(mock);
  mock.lt = vi.fn().mockReturnValue(mock);
  mock.update = vi.fn().mockReturnValue(mock);
  mock.single = vi.fn().mockResolvedValue(finalResult);

  // Allow the mock to be awaited directly (for queries that end with limit/eq)
  mock.then = (resolve: any) => Promise.resolve(finalResult).then(resolve);

  return mock;
};

describe('Notification Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create caller context
  const createContext = (userId: string | null = USER_UUID, organizationId: string | null = ORG_UUID) => {
    const mockUser: User | null = userId
      ? ({
          id: userId,
          email: 'test@example.com',
        } as User)
      : null;

    return {
      db: {} as any,
      session: mockUser,
      organizationId,
    };
  };

  describe('list', () => {
    it('returns paginated notifications for authenticated user', async () => {
      const mockNotifications = [
        createMockNotification(),
        createMockNotification({ id: 'notification-2', type: 'task_assigned' }),
      ];

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: mockNotifications, error: null })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.list({
        organizationId: ORG_UUID,
      });

      expect(result.notifications).toHaveLength(2);
      expect(supabaseModule.forsured).toHaveBeenCalledWith('notifications');
    });

    it('filters unread notifications when unreadOnly is true', async () => {
      const mockNotifications = [createMockNotification({ is_read: false })];

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: mockNotifications, error: null })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.list({
        organizationId: ORG_UUID,
        unreadOnly: true,
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].is_read).toBe(false);
    });

    it('filters by entity type', async () => {
      const mockNotifications = [createMockNotification({ entity_type: 'task' })];

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: mockNotifications, error: null })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.list({
        organizationId: ORG_UUID,
        entityType: 'task',
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].entity_type).toBe('task');
    });

    it('filters by notification type', async () => {
      const mockNotifications = [createMockNotification({ type: 'due_date_change' })];

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: mockNotifications, error: null })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.list({
        organizationId: ORG_UUID,
        type: 'due_date_change',
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].type).toBe('due_date_change');
    });

    it('throws UNAUTHORIZED when user is not authenticated', async () => {
      const ctx = createContext(null);
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: ORG_UUID,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('handles database errors gracefully', async () => {
      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: null, error: { message: 'Database error' } })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: ORG_UUID,
        })
      ).rejects.toThrow('Failed to fetch notifications');
    });

    it('returns nextCursor when more results available', async () => {
      const mockNotifications = Array.from({ length: 50 }, (_, i) =>
        createMockNotification({ id: `notification-${i}` })
      );

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: mockNotifications, error: null })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.list({
        organizationId: ORG_UUID,
        limit: 50,
      });

      expect(result.nextCursor).toBe('notification-49');
    });
  });

  describe('getUnreadCount', () => {
    it('returns count of unread notifications', async () => {
      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ count: 5, error: null })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.getUnreadCount({
        organizationId: ORG_UUID,
      });

      expect(result.count).toBe(5);
    });

    it('returns 0 when no unread notifications', async () => {
      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ count: 0, error: null })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.getUnreadCount({
        organizationId: ORG_UUID,
      });

      expect(result.count).toBe(0);
    });

    it('throws UNAUTHORIZED when user is not authenticated', async () => {
      const ctx = createContext(null);
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.getUnreadCount({
          organizationId: ORG_UUID,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('markAsRead', () => {
    it('marks a notification as read', async () => {
      const updatedNotification = createMockNotification({
        is_read: true,
        read_at: new Date().toISOString(),
      });

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: updatedNotification, error: null })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.markAsRead({
        id: NOTIFICATION_UUID,
      });

      expect(result.success).toBe(true);
      expect(result.notification.is_read).toBe(true);
      expect(result.notification.read_at).not.toBeNull();
    });

    it('throws NOT_FOUND when notification does not exist', async () => {
      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: null, error: null })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.markAsRead({
          id: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow('Notification not found');
    });

    it('throws UNAUTHORIZED when user is not authenticated', async () => {
      const ctx = createContext(null);
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.markAsRead({
          id: NOTIFICATION_UUID,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('only allows user to mark their own notifications', async () => {
      // The router uses eq('user_id', userId) to ensure user owns notification
      // If the notification doesn't belong to the user, data will be null
      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: null, error: null })
      );

      const ctx = createContext(OTHER_USER_UUID); // Different user
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.markAsRead({
          id: NOTIFICATION_UUID,
        })
      ).rejects.toThrow('Notification not found or not owned by user');
    });
  });

  describe('markAllAsRead', () => {
    it('marks all unread notifications as read', async () => {
      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ error: null, count: 5 })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.markAllAsRead({
        organizationId: ORG_UUID,
      });

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(5);
    });

    it('returns 0 count when no unread notifications', async () => {
      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ error: null, count: 0 })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.markAllAsRead({
        organizationId: ORG_UUID,
      });

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(0);
    });

    it('throws UNAUTHORIZED when user is not authenticated', async () => {
      const ctx = createContext(null);
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.markAllAsRead({
          organizationId: ORG_UUID,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getById', () => {
    it('returns notification by ID', async () => {
      const mockNotification = createMockNotification();

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: mockNotification, error: null })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.getById({
        id: NOTIFICATION_UUID,
      });

      expect(result.notification.id).toBe(NOTIFICATION_UUID);
      expect(result.notification.type).toBe('due_date_change');
      expect(result.notification.message).toContain('Due date changed');
    });

    it('throws NOT_FOUND for non-existent notification', async () => {
      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.getById({
          id: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow('Notification not found');
    });

    it('throws UNAUTHORIZED when user is not authenticated', async () => {
      const ctx = createContext(null);
      const caller = notificationRouter.createCaller(ctx);

      await expect(
        caller.getById({
          id: NOTIFICATION_UUID,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('Due Date Change Notification Flow', () => {
    it('notification contains correct metadata for due date change', async () => {
      const mockNotification = createMockNotification({
        type: 'due_date_change',
        metadata: {
          old_due_date: '2024-01-15T00:00:00Z',
          new_due_date: '2024-01-20T00:00:00Z',
          task_title: 'Review compliance documents',
        },
      });

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: mockNotification, error: null })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.getById({
        id: NOTIFICATION_UUID,
      });

      expect(result.notification.type).toBe('due_date_change');
      expect(result.notification.metadata).toHaveProperty('old_due_date');
      expect(result.notification.metadata).toHaveProperty('new_due_date');
      expect(result.notification.metadata).toHaveProperty('task_title');
    });

    it('notification links to correct task entity', async () => {
      const mockNotification = createMockNotification({
        entity_type: 'task',
        entity_id: TASK_UUID,
      });

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: mockNotification, error: null })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.getById({
        id: NOTIFICATION_UUID,
      });

      expect(result.notification.entity_type).toBe('task');
      expect(result.notification.entity_id).toBe(TASK_UUID);
    });

    it('notification shows who triggered the change', async () => {
      const mockNotification = createMockNotification({
        triggered_by: OTHER_USER_UUID,
      });

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: mockNotification, error: null })
      );

      const ctx = createContext();
      const caller = notificationRouter.createCaller(ctx);

      const result = await caller.getById({
        id: NOTIFICATION_UUID,
      });

      expect(result.notification.triggered_by).toBe(OTHER_USER_UUID);
      expect(result.notification.triggered_by).not.toBe(USER_UUID);
    });
  });
});
