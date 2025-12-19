/**
 * Client Profile Router Tests
 * REQ-274: Clickable Client Navigation
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 *
 * These tests run against local Supabase (localhost:54321)
 * Requires: pnpm supa start
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { clientProfileRouter } from '../clientProfile';
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
let testClientId: string | null = null;

// Different org for cross-org tests
const OTHER_ORG_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('Client Profile Router', () => {
  beforeAll(async () => {
    await waitForSupabase();

    // Check if subcontractors table exists and has data we can use as "clients"
    // In Forsured, "clients" may be subcontractors
    const { data: subs } = await forsured('subcontractors')
      .select('id')
      .eq('organization_id', testOrgId)
      .limit(1);

    if (subs && subs.length > 0) {
      testClientId = subs[0].id;
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

  describe('getProfile - Authorization Tests', () => {
    it('rejects unauthorized user accessing other organization client', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = clientProfileRouter.createCaller(ctx);

      // Attempt to access different organization's client
      await expect(
        caller.getProfile({
          organizationId: OTHER_ORG_UUID,
          clientId: testClientId ?? '00000000-0000-0000-0000-000000000001',
        })
      ).rejects.toThrow(TRPCError);
      await expect(
        caller.getProfile({
          organizationId: OTHER_ORG_UUID,
          clientId: testClientId ?? '00000000-0000-0000-0000-000000000001',
        })
      ).rejects.toThrow('You do not have permission to access data from this organization');
    });

    it('rejects user without organization', async () => {
      const ctx = createContext(testUserId, null);
      const caller = clientProfileRouter.createCaller(ctx);

      await expect(
        caller.getProfile({
          organizationId: testOrgId,
          clientId: testClientId ?? '00000000-0000-0000-0000-000000000001',
        })
      ).rejects.toThrow(TRPCError);
      await expect(
        caller.getProfile({
          organizationId: testOrgId,
          clientId: testClientId ?? '00000000-0000-0000-0000-000000000001',
        })
      ).rejects.toThrow('You must belong to an organization to access this resource');
    });

    it('rejects invalid client ID format', async () => {
      const ctx = createContext();
      const caller = clientProfileRouter.createCaller(ctx);

      // Zod validation should reject invalid UUID formats
      await expect(
        caller.getProfile({ organizationId: testOrgId, clientId: '' })
      ).rejects.toThrow();
      await expect(
        caller.getProfile({ organizationId: testOrgId, clientId: 'invalid-id' })
      ).rejects.toThrow();
    });
  });

  describe('getProfile - Data Tests', () => {
    it('returns 404 for non-existent client', async () => {
      const ctx = createContext();
      const caller = clientProfileRouter.createCaller(ctx);

      // Use a valid UUID that doesn't exist
      await expect(
        caller.getProfile({
          organizationId: testOrgId,
          clientId: '00000000-0000-0000-0000-000000000099',
        })
      ).rejects.toThrow('Client not found');
    });

    it('returns client profile data for authorized user', async () => {
      // Skip if no test client available
      if (!testClientId) {
        console.warn('Skipping test - no test client available in database');
        return;
      }

      const ctx = createContext();
      const caller = clientProfileRouter.createCaller(ctx);

      const result = await caller.getProfile({
        organizationId: testOrgId,
        clientId: testClientId,
      });

      expect(result.client).toBeDefined();
      expect(result.client.id).toBe(testClientId);
      expect(Array.isArray(result.gcRelationships)).toBe(true);
      expect(Array.isArray(result.recentActivity)).toBe(true);
    });
  });
});
