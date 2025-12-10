/**
 * Task Router Tests
 * REQ-264: Task History Tracking
 * REQ-286: Additional tRPC Routers - Task Management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { taskRouter } from '../task';
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
const TASK_UUID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
const PROJECT_UUID = 'a987fbc9-4bed-3078-cf07-9141ba07c9f3';

// Mock task data
const createMockTask = (overrides = {}) => ({
  id: TASK_UUID,
  organization_id: ORG_UUID,
  project_id: PROJECT_UUID,
  title: 'Test Task',
  description: 'Test task description',
  status: 'pending',
  priority: 'medium',
  due_date: '2024-01-20T00:00:00Z',
  assigned_to_user_id: USER_UUID,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Mock task history data
const createMockHistoryEntry = (overrides = {}) => ({
  id: `history-${Math.random().toString(36).substr(2, 9)}`,
  task_id: TASK_UUID,
  organization_id: ORG_UUID,
  field_name: 'status',
  old_value: 'pending',
  new_value: 'in_progress',
  changed_by: USER_UUID,
  created_at: new Date().toISOString(),
  ...overrides,
});

// Helper to create chainable mock query for different return types
const createChainableMock = (finalResult: { data?: any; error?: any; count?: number }) => {
  const mock: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(finalResult),
    single: vi.fn().mockResolvedValue(finalResult),
  };
  // Allow order to also resolve directly for some queries
  mock.order.mockImplementation(() => {
    const result = { ...mock };
    result.then = (resolve: any) => Promise.resolve(finalResult).then(resolve);
    return result;
  });
  return mock;
};

describe('Task Router', () => {
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

  describe('getHistory', () => {
    it('returns task history with transformed UI-compatible format', async () => {
      const mockTask = createMockTask();
      const mockHistory = [
        createMockHistoryEntry({
          field_name: 'created',
          old_value: null,
          new_value: 'Task created',
          created_at: '2024-01-15T10:00:00Z',
        }),
        createMockHistoryEntry({
          field_name: 'status',
          old_value: 'pending',
          new_value: 'in_progress',
          created_at: '2024-01-16T10:00:00Z',
        }),
      ];

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          return createChainableMock({ data: mockTask, error: null });
        } else if (tableName === 'task_history') {
          return createChainableMock({ data: mockHistory, error: null });
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      const result = await caller.getHistory({
        organizationId: ORG_UUID,
        taskId: TASK_UUID,
      });

      expect(result).toHaveLength(2);
      // Verify event type mapping
      expect(result[0].type).toBe('created');
      expect(result[1].type).toBe('status_change');
    });

    it('maps field names to correct event types', async () => {
      const mockTask = createMockTask();
      const mockHistory = [
        createMockHistoryEntry({ field_name: 'created' }),
        createMockHistoryEntry({ field_name: 'status' }),
        createMockHistoryEntry({ field_name: 'assigned_to_user_id' }),
        createMockHistoryEntry({ field_name: 'due_date' }),
        createMockHistoryEntry({ field_name: 'title' }),
        createMockHistoryEntry({ field_name: 'priority' }),
      ];

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          return createChainableMock({ data: mockTask, error: null });
        } else if (tableName === 'task_history') {
          return createChainableMock({ data: mockHistory, error: null });
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      const result = await caller.getHistory({
        organizationId: ORG_UUID,
        taskId: TASK_UUID,
      });

      expect(result[0].type).toBe('created');
      expect(result[1].type).toBe('status_change');
      expect(result[2].type).toBe('assigned');
      expect(result[3].type).toBe('due_date_change');
      expect(result[4].type).toBe('edited'); // title -> edited
      expect(result[5].type).toBe('edited'); // priority -> edited
    });

    it('generates human-readable descriptions for status changes', async () => {
      const mockTask = createMockTask();
      const mockHistory = [
        createMockHistoryEntry({
          field_name: 'status',
          old_value: 'pending',
          new_value: 'in_progress',
        }),
      ];

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          return createChainableMock({ data: mockTask, error: null });
        } else if (tableName === 'task_history') {
          return createChainableMock({ data: mockHistory, error: null });
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      const result = await caller.getHistory({
        organizationId: ORG_UUID,
        taskId: TASK_UUID,
      });

      expect(result[0].description).toContain('changed status');
      expect(result[0].description).toContain('pending');
      expect(result[0].description).toContain('in_progress');
    });

    it('generates description for due date set (null to value)', async () => {
      const mockTask = createMockTask();
      const mockHistory = [
        createMockHistoryEntry({
          field_name: 'due_date',
          old_value: null,
          new_value: '2024-01-20T00:00:00Z',
        }),
      ];

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          return createChainableMock({ data: mockTask, error: null });
        } else if (tableName === 'task_history') {
          return createChainableMock({ data: mockHistory, error: null });
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      const result = await caller.getHistory({
        organizationId: ORG_UUID,
        taskId: TASK_UUID,
      });

      expect(result[0].description).toContain('set due date');
    });

    it('generates description for due date removed (value to null)', async () => {
      const mockTask = createMockTask();
      const mockHistory = [
        createMockHistoryEntry({
          field_name: 'due_date',
          old_value: '2024-01-20T00:00:00Z',
          new_value: null,
        }),
      ];

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          return createChainableMock({ data: mockTask, error: null });
        } else if (tableName === 'task_history') {
          return createChainableMock({ data: mockHistory, error: null });
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      const result = await caller.getHistory({
        organizationId: ORG_UUID,
        taskId: TASK_UUID,
      });

      expect(result[0].description).toContain('removed due date');
    });

    it('generates description for due date changed', async () => {
      const mockTask = createMockTask();
      const mockHistory = [
        createMockHistoryEntry({
          field_name: 'due_date',
          old_value: '2024-01-15T00:00:00Z',
          new_value: '2024-01-20T00:00:00Z',
        }),
      ];

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          return createChainableMock({ data: mockTask, error: null });
        } else if (tableName === 'task_history') {
          return createChainableMock({ data: mockHistory, error: null });
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      const result = await caller.getHistory({
        organizationId: ORG_UUID,
        taskId: TASK_UUID,
      });

      expect(result[0].description).toContain('changed due date');
    });

    it('generates description for task assignment', async () => {
      const mockTask = createMockTask();
      const mockHistory = [
        createMockHistoryEntry({
          field_name: 'assigned_to_user_id',
          old_value: null,
          new_value: USER_UUID,
        }),
      ];

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          return createChainableMock({ data: mockTask, error: null });
        } else if (tableName === 'task_history') {
          return createChainableMock({ data: mockHistory, error: null });
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      const result = await caller.getHistory({
        organizationId: ORG_UUID,
        taskId: TASK_UUID,
      });

      expect(result[0].description).toContain('assigned this task');
    });

    it('generates description for task unassignment', async () => {
      const mockTask = createMockTask();
      const mockHistory = [
        createMockHistoryEntry({
          field_name: 'assigned_to_user_id',
          old_value: USER_UUID,
          new_value: null,
        }),
      ];

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          return createChainableMock({ data: mockTask, error: null });
        } else if (tableName === 'task_history') {
          return createChainableMock({ data: mockHistory, error: null });
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      const result = await caller.getHistory({
        organizationId: ORG_UUID,
        taskId: TASK_UUID,
      });

      expect(result[0].description).toContain('unassigned this task');
    });

    it('generates description for task reassignment', async () => {
      const mockTask = createMockTask();
      const mockHistory = [
        createMockHistoryEntry({
          field_name: 'assigned_to_user_id',
          old_value: USER_UUID,
          new_value: OTHER_USER_UUID,
        }),
      ];

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          return createChainableMock({ data: mockTask, error: null });
        } else if (tableName === 'task_history') {
          return createChainableMock({ data: mockHistory, error: null });
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      const result = await caller.getHistory({
        organizationId: ORG_UUID,
        taskId: TASK_UUID,
      });

      expect(result[0].description).toContain('reassigned this task');
    });

    it('throws NOT_FOUND when task does not exist', async () => {
      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          return createChainableMock({ data: null, error: { message: 'Not found' } });
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      await expect(
        caller.getHistory({
          organizationId: ORG_UUID,
          taskId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('returns empty history for task with no changes', async () => {
      const mockTask = createMockTask();

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          return createChainableMock({ data: mockTask, error: null });
        } else if (tableName === 'task_history') {
          return createChainableMock({ data: [], error: null });
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      const result = await caller.getHistory({
        organizationId: ORG_UUID,
        taskId: TASK_UUID,
      });

      expect(result).toHaveLength(0);
    });

    it('includes metadata in history entries', async () => {
      const mockTask = createMockTask();
      const mockHistory = [
        createMockHistoryEntry({
          field_name: 'due_date',
          old_value: '2024-01-15T00:00:00Z',
          new_value: '2024-01-20T00:00:00Z',
        }),
      ];

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'tasks') {
          return createChainableMock({ data: mockTask, error: null });
        } else if (tableName === 'task_history') {
          return createChainableMock({ data: mockHistory, error: null });
        }
        return {} as any;
      });

      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      const result = await caller.getHistory({
        organizationId: ORG_UUID,
        taskId: TASK_UUID,
      });

      expect(result[0].metadata).toBeDefined();
      expect(result[0].field_name).toBe('due_date');
      expect(result[0].metadata.oldValue).toBe('2024-01-15T00:00:00Z');
      expect(result[0].metadata.newValue).toBe('2024-01-20T00:00:00Z');
    });
  });

  describe('get', () => {
    it('returns single task by ID', async () => {
      const mockTask = createMockTask();

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: mockTask, error: null })
      );

      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      const result = await caller.get({
        organizationId: ORG_UUID,
        taskId: TASK_UUID,
      });

      expect(result.id).toBe(TASK_UUID);
      expect(result.title).toBe('Test Task');
    });

    it('throws NOT_FOUND for non-existent task', async () => {
      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: null, error: { message: 'Not found' } })
      );

      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      await expect(
        caller.get({
          organizationId: ORG_UUID,
          taskId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow('Task not found');
    });
  });
});
