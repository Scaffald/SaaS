/**
 * Organization Router Tests
 * REQ-286: Create tRPC Router Structure for Forsured
 * REQ-9: Testing Policy - Use real Supabase, no mocking internal systems
 *
 * These tests run against local Supabase (localhost:54321)
 * Requires: pnpm supa start
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { organizationRouter } from '../organization';
import { TRPCError } from '@trpc/server';
import type { User } from '@supabase/supabase-js';
import {
  testSupabaseAdmin,
  forsured,
  core,
  waitForSupabase,
  TEST_ORG_IDS,
  TEST_USER_IDS,
} from '../../../../../tests/fixtures';

// Test data created during tests
let testProjectId: string | null = null;
let testOrgId: string = TEST_ORG_IDS.primary;
let testUserId: string = TEST_USER_IDS.manager;

// Different org for cross-org tests
const OTHER_ORG_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('Organization Router', () => {
  beforeAll(async () => {
    // Wait for Supabase to be available
    await waitForSupabase();

    // Create a test project for the tests
    const { data: project, error } = await forsured('projects')
      .insert({
        name: 'Test Project for Org Router',
        organization_id: testOrgId,
        status: 'active',
        manager_id: testUserId,
      })
      .select()
      .single();

    if (!error && project) {
      testProjectId = project.id;
    }
  });

  afterAll(async () => {
    // Clean up test project
    if (testProjectId) {
      await forsured('projects').delete().eq('id', testProjectId);
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
    it('allows authorized user to access own organization data', async () => {
      const ctx = createContext();
      const caller = organizationRouter.createCaller(ctx);

      const result = await caller.get({ organizationId: testOrgId });

      expect(result).toBeDefined();
      expect(result.id).toBe(testOrgId);
    });

    it('rejects unauthorized user accessing other organization data', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = organizationRouter.createCaller(ctx);

      // Attempt to access different organization
      await expect(caller.get({ organizationId: OTHER_ORG_UUID })).rejects.toThrow(TRPCError);
      await expect(caller.get({ organizationId: OTHER_ORG_UUID })).rejects.toThrow(
        'You do not have permission to access data from this organization'
      );
    });

    it('rejects user without organization', async () => {
      const ctx = createContext(testUserId, null);
      const caller = organizationRouter.createCaller(ctx);

      await expect(caller.get({ organizationId: testOrgId })).rejects.toThrow(TRPCError);
      await expect(caller.get({ organizationId: testOrgId })).rejects.toThrow(
        'You must belong to an organization to access this resource'
      );
    });

    it('rejects invalid organization ID format', async () => {
      const ctx = createContext();
      const caller = organizationRouter.createCaller(ctx);

      // Zod validation should reject invalid UUID formats
      await expect(caller.get({ organizationId: '' })).rejects.toThrow();
      await expect(caller.get({ organizationId: 'invalid-id' })).rejects.toThrow();
    });
  });

  describe('listProjects', () => {
    it('returns organization projects for authorized user', async () => {
      const ctx = createContext();
      const caller = organizationRouter.createCaller(ctx);

      const result = await caller.listProjects({
        organizationId: testOrgId,
        limit: 20,
        offset: 0,
      });

      expect(result.projects).toBeDefined();
      expect(Array.isArray(result.projects)).toBe(true);
      // Should include our test project
      if (testProjectId) {
        const hasTestProject = result.projects.some((p) => p.id === testProjectId);
        expect(hasTestProject).toBe(true);
      }
    });

    it('rejects cross-organization project access', async () => {
      const ctx = createContext(testUserId, testOrgId);
      const caller = organizationRouter.createCaller(ctx);

      await expect(
        caller.listProjects({
          organizationId: OTHER_ORG_UUID,
          limit: 20,
          offset: 0,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getStats', () => {
    it('returns organization statistics for authorized user', async () => {
      const ctx = createContext();
      const caller = organizationRouter.createCaller(ctx);

      const result = await caller.getStats({ organizationId: testOrgId });

      expect(result).toBeDefined();
      expect(result.organizationId).toBe(testOrgId);
      expect(typeof result.projectCount).toBe('number');
      expect(typeof result.taskCount).toBe('number');
    });
  });

  describe('getProjectWithDetails', () => {
    it('returns combined data from multiple schemas', async () => {
      // Skip if no test project was created
      if (!testProjectId) {
        console.warn('Skipping test - no test project available');
        return;
      }

      const ctx = createContext();
      const caller = organizationRouter.createCaller(ctx);

      const result = await caller.getProjectWithDetails({
        organizationId: testOrgId,
        projectId: testProjectId,
        includeSubcontractors: true,
        includeUsers: true,
      });

      expect(result.project).toBeDefined();
      expect(result.project.id).toBe(testProjectId);
      expect(result.project.name).toBe('Test Project for Org Router');
      expect(Array.isArray(result.subcontractors)).toBe(true);
      expect(Array.isArray(result.users)).toBe(true);
    });

    it('respects organization boundaries across all queries', async () => {
      if (!testProjectId) {
        console.warn('Skipping test - no test project available');
        return;
      }

      const ctx = createContext(testUserId, testOrgId);
      const caller = organizationRouter.createCaller(ctx);

      // Attempt cross-organization access
      await expect(
        caller.getProjectWithDetails({
          organizationId: OTHER_ORG_UUID,
          projectId: testProjectId,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('handles missing related data gracefully', async () => {
      if (!testProjectId) {
        console.warn('Skipping test - no test project available');
        return;
      }

      const ctx = createContext();
      const caller = organizationRouter.createCaller(ctx);

      // Request without includes
      const result = await caller.getProjectWithDetails({
        organizationId: testOrgId,
        projectId: testProjectId,
      });

      expect(result.project).toBeDefined();
      // Related data should be empty arrays, not null
      expect(result.subcontractors).toEqual([]);
      expect(result.users).toEqual([]);
    });
  });
});
