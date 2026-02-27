/**
 * Root Router and API Handler Tests
 * Create tRPC Router Structure for Forsured
 * TASK-4: Create Root Router and API Handler Integration - Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter, type AppRouter } from '../root';
import { handleTRPCRequest } from '../handler';
import type { User } from '@supabase/supabase-js';
import * as supabaseModule from '../../../lib/supabase';

// Mock the procore router to avoid env var requirements at import time
vi.mock('../routers/procore', () => ({
  procoreRouter: {
    _def: { procedures: {}, _config: {} },
  },
}));

// Mock the supabase module
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    schema: vi.fn(() => ({
      from: vi.fn(),
    })),
  },
  getCurrentUser: vi.fn(),
  getUserOrganizationId: vi.fn(),
  forsured: vi.fn(),
  core: vi.fn(),
}));

describe('Root Router', () => {
  it('successfully combines all individual routers', () => {
    // Expect: appRouter includes organization router
    expect(appRouter._def.procedures).toBeDefined();
    expect('organization.get' in appRouter._def.procedures).toBe(true);
    expect('organization.listProjects' in appRouter._def.procedures).toBe(true);
    expect('organization.getStats' in appRouter._def.procedures).toBe(true);
    expect('organization.getProjectWithDetails' in appRouter._def.procedures).toBe(true);
  });

  it('exports AppRouter type for client-side type inference', () => {
    // This is a compile-time test - if this compiles, the type is exported correctly
    type TestType = AppRouter;
    const _typeCheck: TestType = appRouter;
    expect(_typeCheck).toBeDefined();
  });
});

describe('API Handler', () => {
  const ORG_UUID = '550e8400-e29b-41d4-a716-446655440000';
  const USER_UUID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('API handler is properly configured and exported', () => {
    // Verify handler function exists
    expect(handleTRPCRequest).toBeDefined();
    expect(typeof handleTRPCRequest).toBe('function');
  });

  it('can call procedures directly through root router', async () => {
    // Setup: Create context and caller
    const mockUser: User = {
      id: USER_UUID,
      email: 'test@example.com',
    } as User;

    const ctx = {
      db: {} as any,
      session: mockUser,
      userId: USER_UUID, // Required by isAuthenticated middleware
      organizationId: ORG_UUID,
    };

    const mockOrgData = {
      id: ORG_UUID,
      name: 'Test Organization',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(supabaseModule.core).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockOrgData, error: null }),
    } as any);

    const caller = appRouter.createCaller(ctx);

    // Action: Call procedure through root router
    const result = await caller.organization.get({ organizationId: ORG_UUID });

    // Expect: Returns properly formatted response
    expect(result).toEqual(mockOrgData);
  });

  it('integrates multiple routers correctly', async () => {
    // Setup: Mock context
    const mockUser: User = {
      id: USER_UUID,
      email: 'test@example.com',
    } as User;

    const ctx = {
      db: {} as any,
      session: mockUser,
      userId: USER_UUID, // Required by isAuthenticated middleware
      organizationId: ORG_UUID,
    };

    // Mock forsured queries for stats
    vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
      if (tableName === 'projects') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
        } as any;
      } else if (tableName === 'tasks') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
        } as any;
      }
      return {} as any;
    });

    const caller = appRouter.createCaller(ctx);

    // Action: Call different procedures from organization router
    const stats = await caller.organization.getStats({ organizationId: ORG_UUID });

    // Expect: All procedures accessible through root router
    expect(stats).toBeDefined();
    expect(stats.projectCount).toBe(5);
    expect(stats.taskCount).toBe(10);
  });
});
