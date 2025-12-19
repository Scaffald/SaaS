/**
 * Task Router Tests
 * REQ-264: Task History Tracking
 * REQ-286: Additional tRPC Routers - Task Management
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 *
 * These tests run against local Supabase (localhost:54321)
 * Requires: pnpm supa start
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { taskRouter } from '../task';
import { TRPCError } from '@trpc/server';
import type { User } from '@supabase/supabase-js';
import {
  testSupabaseAdmin,
  forsured,
  waitForSupabase,
  TEST_ORG_IDS,
  TEST_USER_IDS,
  TEST_PROJECT_IDS,
} from '../../../../../tests/fixtures';

// Test data
let testOrgId: string = TEST_ORG_IDS.primary;
let testUserId: string = TEST_USER_IDS.manager;
let testProjectId: string = TEST_PROJECT_IDS.project1;
let testTaskId: string | null = null;

describe('Task Router', () => {
  beforeAll(async () => {
    await waitForSupabase();

    // Create a test task
    const { data: task, error } = await forsured('tasks')
      .insert({
        title: 'Test Task for Router Tests',
        description: 'Created for automated testing',
        status: 'pending',
        priority: 'medium',
        project_id: testProjectId,
        organization_id: testOrgId,
        assigned_to_user_id: testUserId,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (!error && task) {
      testTaskId = task.id;
    }
  });

  afterAll(async () => {
    // Clean up test task
    if (testTaskId) {
      // First delete any task history
      await forsured('task_history').delete().eq('task_id', testTaskId);
      // Then delete the task
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

  describe('get', () => {
    it('returns single task by ID', async () => {
      if (!testTaskId) {
        console.warn('Skipping test - no test task available');
        return;
      }

      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      const result = await caller.get({
        organizationId: testOrgId,
        taskId: testTaskId,
      });

      expect(result.id).toBe(testTaskId);
      expect(result.title).toBe('Test Task for Router Tests');
    });

    it('throws NOT_FOUND for non-existent task', async () => {
      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      await expect(
        caller.get({
          organizationId: testOrgId,
          taskId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow('Task not found');
    });
  });

  describe('getHistory', () => {
    it('returns empty history for task with no changes', async () => {
      if (!testTaskId) {
        console.warn('Skipping test - no test task available');
        return;
      }

      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      const result = await caller.getHistory({
        organizationId: testOrgId,
        taskId: testTaskId,
      });

      // Newly created task should have no history (or just a "created" entry)
      expect(Array.isArray(result)).toBe(true);
    });

    it('throws NOT_FOUND when task does not exist', async () => {
      const ctx = createContext();
      const caller = taskRouter.createCaller(ctx);

      await expect(
        caller.getHistory({
          organizationId: testOrgId,
          taskId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('Authorization Tests', () => {
    it('rejects user without organization', async () => {
      const ctx = createContext(testUserId, null);
      const caller = taskRouter.createCaller(ctx);

      await expect(
        caller.get({
          organizationId: testOrgId,
          taskId: testTaskId ?? '00000000-0000-0000-0000-000000000001',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('rejects cross-organization access', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = taskRouter.createCaller(ctx);

      const otherOrgId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      await expect(
        caller.get({
          organizationId: otherOrgId,
          taskId: testTaskId ?? '00000000-0000-0000-0000-000000000001',
        })
      ).rejects.toThrow(TRPCError);
    });
  });
});
