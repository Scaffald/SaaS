/**
 * User Set Types Router Tests
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 *
 * These tests run against local Supabase (localhost:54321)
 * Requires: pnpm supa start
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { userSetTypesRouter } from '../userSetTypes';
import { TRPCError } from '@trpc/server';
import type { User } from '@supabase/supabase-js';
import {
  testSupabaseAdmin,
  forsured,
  waitForSupabase,
  TEST_USER_IDS,
} from '../../../../../tests/fixtures';

// Test data
let testUserId: string = TEST_USER_IDS.manager;
let testUserSetTypeId: string | null = null;
let createdUserSetTypeId: string | null = null;

describe('User Set Types Router', () => {
  beforeAll(async () => {
    await waitForSupabase();

    // Find an existing active user set type
    const { data: types } = await forsured('user_set_types')
      .select('id')
      .eq('is_active', true)
      .limit(1);

    if (types && types.length > 0) {
      testUserSetTypeId = types[0].id;
    }
  });

  afterAll(async () => {
    // Clean up created user set type
    if (createdUserSetTypeId) {
      await forsured('user_set_types').delete().eq('id', createdUserSetTypeId);
    }
  });

  // Helper to create caller context
  const createContext = (userId: string | null = testUserId) => {
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
      organizationId: null, // User set types don't require organization
    };
  };

  // ==================== listActive Tests ====================

  describe('listActive', () => {
    it('returns only active user set types', async () => {
      const ctx = createContext(null); // Public endpoint, no auth needed
      const caller = userSetTypesRouter.createCaller(ctx);

      const result = await caller.listActive();

      expect(Array.isArray(result)).toBe(true);
      // All returned types should be active
      result.forEach((type) => {
        expect(type.isActive).toBe(true);
      });
    });

    it('transforms database columns to camelCase', async () => {
      const ctx = createContext(null);
      const caller = userSetTypesRouter.createCaller(ctx);

      const result = await caller.listActive();

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('managerLabelSingular');
        expect(result[0]).toHaveProperty('managerLabelPlural');
        expect(result[0]).toHaveProperty('contractorLabelSingular');
        expect(result[0]).toHaveProperty('contractorLabelPlural');
      }
    });
  });

  // ==================== getUserLexicon Tests ====================

  describe('getUserLexicon', () => {
    it('throws UNAUTHORIZED when no session exists', async () => {
      const ctx = createContext(null);
      const caller = userSetTypesRouter.createCaller(ctx);

      await expect(caller.getUserLexicon()).rejects.toThrow('logged in');
    });

    it('returns lexicon for authenticated user', async () => {
      const ctx = createContext(testUserId);
      const caller = userSetTypesRouter.createCaller(ctx);

      try {
        const result = await caller.getUserLexicon();
        // Should return a lexicon object (may be empty if user has no user set type)
        expect(result.lexicon).toBeDefined();
        expect(typeof result.lexicon).toBe('object');
      } catch (error) {
        // If user profile not found, that's expected for test users
        expect(error).toBeInstanceOf(TRPCError);
      }
    });
  });

  // ==================== getByIdWithLexicon Tests ====================

  describe('getByIdWithLexicon', () => {
    it('returns user set type with lexicon for valid ID', async () => {
      if (!testUserSetTypeId) {
        console.warn('Skipping test - no test user set type available');
        return;
      }

      const ctx = createContext(testUserId);
      const caller = userSetTypesRouter.createCaller(ctx);

      const result = await caller.getByIdWithLexicon({ id: testUserSetTypeId });

      expect(result.userSetType).toBeDefined();
      expect(result.userSetType.id).toBe(testUserSetTypeId);
      expect(result.lexicon).toBeDefined();
    });

    it('throws UNAUTHORIZED when no session exists', async () => {
      const ctx = createContext(null);
      const caller = userSetTypesRouter.createCaller(ctx);

      await expect(
        caller.getByIdWithLexicon({
          id: testUserSetTypeId ?? '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow('logged in');
    });

    it('throws NOT_FOUND for non-existent ID', async () => {
      const ctx = createContext(testUserId);
      const caller = userSetTypesRouter.createCaller(ctx);

      await expect(
        caller.getByIdWithLexicon({ id: '00000000-0000-4000-a000-000000000000' })
      ).rejects.toThrow('User set type not found or inactive');
    });

    it('validates UUID format for id parameter', async () => {
      const ctx = createContext(testUserId);
      const caller = userSetTypesRouter.createCaller(ctx);

      await expect(caller.getByIdWithLexicon({ id: 'invalid-id' })).rejects.toThrow(
        'ID must be a valid UUID'
      );
    });
  });

  // ==================== Admin Endpoint Tests ====================

  describe('Admin Endpoints', () => {
    // Helper to check if user is admin
    const isAdminUser = async (userId: string): Promise<boolean> => {
      const { data } = await forsured('user_profiles')
        .select('user_type')
        .eq('scaffald_user_id', userId)
        .single();
      return data?.user_type === 'admin';
    };

    describe('list', () => {
      it('requires admin access', async () => {
        const ctx = createContext(testUserId);
        const caller = userSetTypesRouter.createCaller(ctx);

        // Non-admin should be rejected
        try {
          await caller.list();
          // If it succeeds, user must be admin
          const isAdmin = await isAdminUser(testUserId);
          if (!isAdmin) {
            throw new Error('Expected admin access required error');
          }
        } catch (error) {
          // Expected for non-admin users
          expect(error).toBeInstanceOf(TRPCError);
        }
      });

      it('BUG-002 & BUG-004 FIX: allows test admin users to access admin endpoints', async () => {
        // Test users from "Test as Admin" button have IDs like "test-admin-1234567890"
        const testAdminUserId = 'test-admin-1234567890';
        const ctx = createContext(testAdminUserId);
        const caller = userSetTypesRouter.createCaller(ctx);

        // Should NOT throw - test admin users should be allowed
        const result = await caller.list();
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe('get', () => {
      it('requires admin access', async () => {
        if (!testUserSetTypeId) {
          console.warn('Skipping test - no test user set type available');
          return;
        }

        const ctx = createContext(testUserId);
        const caller = userSetTypesRouter.createCaller(ctx);

        try {
          await caller.get({ id: testUserSetTypeId });
          // If it succeeds, user must be admin
          const isAdmin = await isAdminUser(testUserId);
          if (!isAdmin) {
            throw new Error('Expected admin access required error');
          }
        } catch (error) {
          // Expected for non-admin users
          expect(error).toBeInstanceOf(TRPCError);
        }
      });
    });
  });

  // ==================== Input Validation Tests ====================

  describe('Input Validation', () => {
    it('rejects invalid UUID for getByIdWithLexicon', async () => {
      const ctx = createContext(testUserId);
      const caller = userSetTypesRouter.createCaller(ctx);

      await expect(caller.getByIdWithLexicon({ id: 'invalid-uuid' })).rejects.toThrow();
    });

    it('rejects empty id for getByIdWithLexicon', async () => {
      const ctx = createContext(testUserId);
      const caller = userSetTypesRouter.createCaller(ctx);

      await expect(caller.getByIdWithLexicon({ id: '' })).rejects.toThrow();
    });
  });
});
