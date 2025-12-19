/**
 * Team Members Router Tests
 * REQ-283: Team Member Management UI
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 *
 * These tests run against local Supabase (localhost:54321)
 * Requires: pnpm supa start
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TRPCError } from '@trpc/server';
import { teamMembersRouter } from '../teamMembers';
import type { User } from '@supabase/supabase-js';
import {
  testSupabaseAdmin,
  core,
  waitForSupabase,
  TEST_ORG_IDS,
  TEST_USER_IDS,
} from '../../../../../tests/fixtures';

// Test data
let testOrgId: string = TEST_ORG_IDS.primary;
let testUserId: string = TEST_USER_IDS.manager;
let testMemberId: string | null = null;

// Different org for authorization tests
const OTHER_ORG_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('Team Members Router', () => {
  beforeAll(async () => {
    await waitForSupabase();

    // Find an existing user in the organization to use as a team member
    const { data: members } = await core('users')
      .select('id')
      .eq('organization_id', testOrgId)
      .limit(1);

    if (members && members.length > 0) {
      testMemberId = members[0].id;
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
    it('returns team members for the organization', async () => {
      const ctx = createContext();
      const caller = teamMembersRouter.createCaller(ctx);

      const result = await caller.list({
        organizationId: testOrgId,
      });

      expect(Array.isArray(result.members)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('throws FORBIDDEN for unauthorized organization', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = teamMembersRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: OTHER_ORG_UUID,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('throws FORBIDDEN when user has no organization', async () => {
      const ctx = createContext(testUserId, null);
      const caller = teamMembersRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: testOrgId,
        })
      ).rejects.toThrow('You must belong to an organization');
    });

    it('respects pagination parameters', async () => {
      const ctx = createContext();
      const caller = teamMembersRouter.createCaller(ctx);

      const result = await caller.list({
        organizationId: testOrgId,
        limit: 5,
        offset: 0,
      });

      expect(result.members.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getById', () => {
    it('returns a single team member', async () => {
      if (!testMemberId) {
        console.warn('Skipping test - no test member available');
        return;
      }

      const ctx = createContext();
      const caller = teamMembersRouter.createCaller(ctx);

      const result = await caller.getById({
        organizationId: testOrgId,
        memberId: testMemberId,
      });

      expect(result.id).toBe(testMemberId);
    });

    it('throws NOT_FOUND for non-existent member', async () => {
      const ctx = createContext();
      const caller = teamMembersRouter.createCaller(ctx);

      await expect(
        caller.getById({
          organizationId: testOrgId,
          memberId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('throws FORBIDDEN for unauthorized organization', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = teamMembersRouter.createCaller(ctx);

      await expect(
        caller.getById({
          organizationId: OTHER_ORG_UUID,
          memberId: testMemberId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getSummary', () => {
    it('returns team summary statistics', async () => {
      const ctx = createContext();
      const caller = teamMembersRouter.createCaller(ctx);

      const result = await caller.getSummary({
        organizationId: testOrgId,
      });

      expect(typeof result.total).toBe('number');
      expect(result.byRole).toBeDefined();
      expect(typeof result.byRole.admin).toBe('number');
      expect(typeof result.byRole.manager).toBe('number');
      expect(typeof result.byRole.broker).toBe('number');
      expect(typeof result.byRole.subcontractor).toBe('number');
    });

    it('throws FORBIDDEN for unauthorized organization', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = teamMembersRouter.createCaller(ctx);

      await expect(
        caller.getSummary({
          organizationId: OTHER_ORG_UUID,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('Authorization Tests', () => {
    it('rejects user without organization for list', async () => {
      const ctx = createContext(testUserId, null);
      const caller = teamMembersRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: testOrgId,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('rejects cross-organization access for getById', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = teamMembersRouter.createCaller(ctx);

      await expect(
        caller.getById({
          organizationId: OTHER_ORG_UUID,
          memberId: testMemberId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('Input Validation', () => {
    it('rejects invalid organization ID format', async () => {
      const ctx = createContext();
      const caller = teamMembersRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: 'not-a-uuid',
        })
      ).rejects.toThrow();
    });

    it('rejects invalid member ID format', async () => {
      const ctx = createContext();
      const caller = teamMembersRouter.createCaller(ctx);

      await expect(
        caller.getById({
          organizationId: testOrgId,
          memberId: 'not-a-uuid',
        })
      ).rejects.toThrow();
    });

    it('enforces limit bounds', async () => {
      const ctx = createContext();
      const caller = teamMembersRouter.createCaller(ctx);

      await expect(
        caller.list({
          organizationId: testOrgId,
          limit: 200, // Max is 100
        })
      ).rejects.toThrow();

      await expect(
        caller.list({
          organizationId: testOrgId,
          limit: 0, // Min is 1
        })
      ).rejects.toThrow();
    });
  });
});
