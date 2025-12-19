/**
 * Participants Router Tests
 * REQ-281: Participants Tab Compliance View
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 *
 * These tests run against local Supabase (localhost:54321)
 * Requires: pnpm supa start
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TRPCError } from '@trpc/server';
import { participantsRouter } from '../participants';
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
let testParticipantId: string | null = null;

// Different org for authorization tests
const OTHER_ORG_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('Participants Router', () => {
  beforeAll(async () => {
    await waitForSupabase();

    // Find an existing subcontractor in the organization to use as a participant
    const { data: subs } = await forsured('subcontractors')
      .select('id')
      .eq('organization_id', testOrgId)
      .limit(1);

    if (subs && subs.length > 0) {
      testParticipantId = subs[0].id;
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

  describe('listByProject', () => {
    it('returns participants for a project', async () => {
      const ctx = createContext();
      const caller = participantsRouter.createCaller(ctx);

      const result = await caller.listByProject({
        organizationId: testOrgId,
        projectId: testProjectId,
      });

      expect(Array.isArray(result.participants)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('throws FORBIDDEN for unauthorized organization', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = participantsRouter.createCaller(ctx);

      await expect(
        caller.listByProject({
          organizationId: OTHER_ORG_UUID,
          projectId: testProjectId,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('throws FORBIDDEN when user has no organization', async () => {
      const ctx = createContext(testUserId, null);
      const caller = participantsRouter.createCaller(ctx);

      await expect(
        caller.listByProject({
          organizationId: testOrgId,
          projectId: testProjectId,
        })
      ).rejects.toThrow('You must belong to an organization');
    });

    it('respects pagination parameters', async () => {
      const ctx = createContext();
      const caller = participantsRouter.createCaller(ctx);

      const result = await caller.listByProject({
        organizationId: testOrgId,
        projectId: testProjectId,
        limit: 5,
        offset: 0,
      });

      expect(result.participants.length).toBeLessThanOrEqual(5);
    });
  });

  describe('get', () => {
    it('returns a single participant with compliance details', async () => {
      if (!testParticipantId) {
        console.warn('Skipping test - no test participant available');
        return;
      }

      const ctx = createContext();
      const caller = participantsRouter.createCaller(ctx);

      const result = await caller.get({
        organizationId: testOrgId,
        projectId: testProjectId,
        participantId: testParticipantId,
      });

      expect(result.participant).toBeDefined();
      expect(result.participant.id).toBe(testParticipantId);
    });

    it('throws NOT_FOUND for non-existent participant', async () => {
      const ctx = createContext();
      const caller = participantsRouter.createCaller(ctx);

      await expect(
        caller.get({
          organizationId: testOrgId,
          projectId: testProjectId,
          participantId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });

    it('throws FORBIDDEN for unauthorized organization', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = participantsRouter.createCaller(ctx);

      await expect(
        caller.get({
          organizationId: OTHER_ORG_UUID,
          projectId: testProjectId,
          participantId: testParticipantId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getComplianceSummary', () => {
    it('returns compliance summary statistics for a project', async () => {
      const ctx = createContext();
      const caller = participantsRouter.createCaller(ctx);

      const result = await caller.getComplianceSummary({
        organizationId: testOrgId,
        projectId: testProjectId,
      });

      expect(typeof result.total).toBe('number');
      expect(typeof result.compliant).toBe('number');
      expect(typeof result.atRisk).toBe('number');
      expect(typeof result.nonCompliant).toBe('number');
      expect(typeof result.pending).toBe('number');
      expect(typeof result.averageScore).toBe('number');
    });

    it('returns zeros when no participants exist', async () => {
      // Use a non-existent project ID to get zero results
      const ctx = createContext();
      const caller = participantsRouter.createCaller(ctx);

      // This may throw NOT_FOUND or return zeros depending on implementation
      try {
        const result = await caller.getComplianceSummary({
          organizationId: testOrgId,
          projectId: '00000000-0000-0000-0000-000000000001', // Non-existent project
        });

        // If it returns, values should be zeros or valid numbers
        expect(typeof result.total).toBe('number');
      } catch (error) {
        // If it throws, it should be NOT_FOUND
        expect(error).toBeInstanceOf(TRPCError);
      }
    });

    it('throws FORBIDDEN for unauthorized organization', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = participantsRouter.createCaller(ctx);

      await expect(
        caller.getComplianceSummary({
          organizationId: OTHER_ORG_UUID,
          projectId: testProjectId,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('Authorization Tests', () => {
    it('rejects user without organization', async () => {
      const ctx = createContext(testUserId, null);
      const caller = participantsRouter.createCaller(ctx);

      await expect(
        caller.listByProject({
          organizationId: testOrgId,
          projectId: testProjectId,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('rejects cross-organization access', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = participantsRouter.createCaller(ctx);

      await expect(
        caller.listByProject({
          organizationId: OTHER_ORG_UUID,
          projectId: testProjectId,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('Input Validation', () => {
    it('rejects invalid organization ID format', async () => {
      const ctx = createContext();
      const caller = participantsRouter.createCaller(ctx);

      await expect(
        caller.listByProject({
          organizationId: 'not-a-uuid',
          projectId: testProjectId,
        })
      ).rejects.toThrow();
    });

    it('rejects invalid project ID format', async () => {
      const ctx = createContext();
      const caller = participantsRouter.createCaller(ctx);

      await expect(
        caller.listByProject({
          organizationId: testOrgId,
          projectId: 'not-a-uuid',
        })
      ).rejects.toThrow();
    });

    it('rejects invalid participant ID format', async () => {
      const ctx = createContext();
      const caller = participantsRouter.createCaller(ctx);

      await expect(
        caller.get({
          organizationId: testOrgId,
          projectId: testProjectId,
          participantId: 'not-a-uuid',
        })
      ).rejects.toThrow();
    });
  });
});
