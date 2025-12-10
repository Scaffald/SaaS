/**
 * tRPC Base Configuration Tests
 * REQ-286: Create tRPC Router Structure for Forsured
 * TASK-1: Create Base tRPC Router Configuration - Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import { createContext } from '../context';
import { TRPCError } from '@trpc/server';
import type { User } from '@supabase/supabase-js';
import * as supabaseModule from '../../../lib/supabase';

// Mock the supabase module
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    schema: vi.fn(() => ({
      from: vi.fn(),
    })),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('tRPC Base Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createContext', () => {
    it('creates context with session and organizationId for authenticated user', async () => {
      // Setup: Mock authenticated user
      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { organization_id: 'org-123' },
      } as User;

      vi.mocked(supabaseModule.supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      // Create mock request with authorization header
      const mockReq = {
        headers: new Headers({ authorization: 'Bearer test-token' }),
      } as Request;

      // Action: Create context
      const ctx = await createContext({ req: mockReq, resHeaders: new Headers() });

      // Expect: Context includes session and organizationId
      expect(ctx.session).toEqual(mockUser);
      expect(ctx.organizationId).toBe('org-123');
      expect(ctx.db).toBeDefined();
    });

    it('creates context with null session for unauthenticated user', async () => {
      // Create mock request without authorization header
      const mockReq = {
        headers: new Headers(),
      } as Request;

      // Action: Create context (no token provided)
      const ctx = await createContext({ req: mockReq, resHeaders: new Headers() });

      // Expect: Context has null session and organizationId
      expect(ctx.session).toBeNull();
      expect(ctx.organizationId).toBeNull();
      expect(ctx.db).toBeDefined();
    });
  });

  describe('publicProcedure', () => {
    it('allows unauthenticated calls', async () => {
      // Setup: Create mock public procedure
      const testRouter = createTRPCRouter({
        publicTest: publicProcedure.query(async () => {
          return { success: true };
        }),
      });

      // Mock context with no session
      const ctx = {
        db: {} as any,
        session: null,
        organizationId: null,
      };

      const caller = testRouter.createCaller(ctx);

      // Action: Call public procedure without authentication
      const result = await caller.publicTest();

      // Expect: Procedure executes successfully
      expect(result).toEqual({ success: true });
    });
  });

  describe('protectedProcedure', () => {
    it('rejects unauthenticated calls with UNAUTHORIZED error', async () => {
      // Setup: Create mock protected procedure, no session in context
      const testRouter = createTRPCRouter({
        protectedTest: protectedProcedure.query(async () => {
          return { success: true };
        }),
      });

      const ctx = {
        db: {} as any,
        session: null,
        organizationId: null,
      };

      const caller = testRouter.createCaller(ctx);

      // Action & Expect: Call protected procedure without authentication
      await expect(caller.protectedTest()).rejects.toThrow(TRPCError);
      await expect(caller.protectedTest()).rejects.toThrow('You must be logged in to access this resource');
    });

    it('allows authenticated calls', async () => {
      // Setup: Create mock protected procedure, valid session in context
      const testRouter = createTRPCRouter({
        protectedTest: protectedProcedure.query(async ({ ctx }) => {
          return {
            success: true,
            userId: ctx.session.id,
            organizationId: ctx.organizationId,
          };
        }),
      });

      const mockUser: User = {
        id: 'user-123',
        email: 'test@example.com',
      } as User;

      const ctx = {
        db: {} as any,
        session: mockUser,
        organizationId: 'org-123',
      };

      const caller = testRouter.createCaller(ctx);

      // Action: Call protected procedure with authentication
      const result = await caller.protectedTest();

      // Expect: Procedure executes successfully without auth errors
      expect(result).toEqual({
        success: true,
        userId: 'user-123',
        organizationId: 'org-123',
      });
    });

    it('allows authenticated calls even without organizationId', async () => {
      // Setup: User authenticated but no organization
      const testRouter = createTRPCRouter({
        protectedTest: protectedProcedure.query(async ({ ctx }) => {
          return {
            success: true,
            hasOrganization: ctx.organizationId !== null,
          };
        }),
      });

      const mockUser: User = {
        id: 'user-456',
        email: 'newuser@example.com',
      } as User;

      const ctx = {
        db: {} as any,
        session: mockUser,
        organizationId: null, // User exists but has no organization yet
      };

      const caller = testRouter.createCaller(ctx);

      // Action: Call protected procedure
      const result = await caller.protectedTest();

      // Expect: Authentication succeeds, organizationId is null
      expect(result).toEqual({
        success: true,
        hasOrganization: false,
      });
    });
  });
});
