/**
 * Organization Router Tests
 * REQ-286: Create tRPC Router Structure for Forsured
 * TASK-2: Create Organization-Scoped Router with Authorization - Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { organizationRouter } from '../organization';
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
  core: vi.fn(),
}));

// Test UUIDs (v4 format)
const ORG_UUID_123 = '550e8400-e29b-41d4-a716-446655440000';
const ORG_UUID_456 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const USER_UUID_123 = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

describe('Organization Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('allows authorized user to access own organization data', async () => {
      // Setup: User session with organizationId, request for same org data
      const mockUser: User = {
        id: USER_UUID_123,
        email: 'test@example.com',
      } as User;

      const ctx = {
        db: {} as any,
        session: mockUser,
        organizationId: ORG_UUID_123,
      };

      const mockOrgData = {
        id: ORG_UUID_123,
        name: 'Test Organization',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock core query
      vi.mocked(supabaseModule.core).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOrgData, error: null }),
      } as any);

      const caller = organizationRouter.createCaller(ctx);

      // Action: Call organization procedure with matching organization ID
      const result = await caller.get({ organizationId: ORG_UUID_123 });

      // Expect: Returns organization data successfully
      expect(result).toEqual(mockOrgData);
      expect(supabaseModule.core).toHaveBeenCalledWith('organizations');
    });

    it('rejects unauthorized user accessing other organization data', async () => {
      // Setup: User session with one org, request for different org data
      const mockUser: User = {
        id: USER_UUID_123,
        email: 'test@example.com',
      } as User;

      const ctx = {
        db: {} as any,
        session: mockUser,
        organizationId: ORG_UUID_123,
      };

      const caller = organizationRouter.createCaller(ctx);

      // Action & Expect: Call organization procedure with different organization ID
      await expect(caller.get({ organizationId: ORG_UUID_456 })).rejects.toThrow(TRPCError);
      await expect(caller.get({ organizationId: ORG_UUID_456 })).rejects.toThrow(
        'You do not have permission to access data from this organization'
      );
    });

    it('rejects user without organization', async () => {
      // Setup: User session without organizationId
      const mockUser: User = {
        id: USER_UUID_123,
        email: 'test@example.com',
      } as User;

      const ctx = {
        db: {} as any,
        session: mockUser,
        organizationId: null,
      };

      const caller = organizationRouter.createCaller(ctx);

      // Action & Expect: Call organization procedure
      await expect(caller.get({ organizationId: ORG_UUID_123 })).rejects.toThrow(TRPCError);
      await expect(caller.get({ organizationId: ORG_UUID_123 })).rejects.toThrow(
        'You must belong to an organization to access this resource'
      );
    });

    it('rejects invalid organization ID format', async () => {
      // Setup: User session with valid organizationId
      const mockUser: User = {
        id: USER_UUID_123,
        email: 'test@example.com',
      } as User;

      const ctx = {
        db: {} as any,
        session: mockUser,
        organizationId: ORG_UUID_123,
      };

      const caller = organizationRouter.createCaller(ctx);

      // Action & Expect: Call procedure with invalid organizationId format (not a UUID)
      await expect(caller.get({ organizationId: '' })).rejects.toThrow();
      await expect(caller.get({ organizationId: 'invalid-id' })).rejects.toThrow();
    });
  });

  describe('listProjects', () => {
    it('returns organization projects for authorized user', async () => {
      // Setup: User from org requesting org projects
      const mockUser: User = {
        id: USER_UUID_123,
        email: 'test@example.com',
      } as User;

      const ctx = {
        db: {} as any,
        session: mockUser,
        organizationId: ORG_UUID_123,
      };

      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project 1',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'project-2',
          name: 'Project 2',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      // Mock forsured query
      vi.mocked(supabaseModule.forsured).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockProjects, error: null, count: 2 }),
      } as any);

      const caller = organizationRouter.createCaller(ctx);

      // Action: Call listProjects
      const result = await caller.listProjects({
        organizationId: ORG_UUID_123,
        limit: 20,
        offset: 0,
      });

      // Expect: Returns projects from organization
      expect(result.projects).toEqual(mockProjects);
      expect(result.total).toBe(2);
      expect(supabaseModule.forsured).toHaveBeenCalledWith('projects');
    });

    it('rejects cross-organization project access', async () => {
      // Setup: User from one org requesting different org projects
      const mockUser: User = {
        id: USER_UUID_123,
        email: 'test@example.com',
      } as User;

      const ctx = {
        db: {} as any,
        session: mockUser,
        organizationId: ORG_UUID_123,
      };

      const caller = organizationRouter.createCaller(ctx);

      // Action & Expect: Attempt to access different organization's projects
      await expect(
        caller.listProjects({
          organizationId: ORG_UUID_456,
          limit: 20,
          offset: 0,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getStats', () => {
    it('returns organization statistics for authorized user', async () => {
      // Setup: User from org requesting org stats
      const mockUser: User = {
        id: USER_UUID_123,
        email: 'test@example.com',
      } as User;

      const ctx = {
        db: {} as any,
        session: mockUser,
        organizationId: ORG_UUID_123,
      };

      // Mock forsured queries for counts
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

      const caller = organizationRouter.createCaller(ctx);

      // Action: Call getStats
      const result = await caller.getStats({ organizationId: ORG_UUID_123 });

      // Expect: Returns organization statistics
      expect(result).toEqual({
        organizationId: ORG_UUID_123,
        projectCount: 5,
        taskCount: 10,
      });
    });
  });

  describe('getProjectWithDetails (Cross-Schema Query - TASK-3)', () => {
    const PROJECT_UUID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

    it('returns combined data from multiple schemas', async () => {
      // Setup: Mock project, subcontractors, and users from different schemas
      const mockUser: User = {
        id: USER_UUID_123,
        email: 'test@example.com',
      } as User;

      const ctx = {
        db: {} as any,
        session: mockUser,
        organizationId: ORG_UUID_123,
      };

      const mockProject = {
        id: PROJECT_UUID,
        name: 'Test Project',
        status: 'active',
        organization_id: ORG_UUID_123,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockSubcontractors = [
        {
          id: 'sub-1',
          name: 'Subcontractor 1',
          status: 'active',
          created_at: new Date().toISOString(),
        },
      ];

      const mockUsers = [
        {
          id: USER_UUID_123,
          name: 'Test User',
          email: 'test@example.com',
          created_at: new Date().toISOString(),
        },
      ];

      // Mock forsured queries
      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'projects') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockProject, error: null }),
          } as any;
        } else if (tableName === 'subcontractors') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockSubcontractors, error: null }),
          } as any;
        }
        return {} as any;
      });

      // Mock core query
      vi.mocked(supabaseModule.core).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
      } as any);

      const caller = organizationRouter.createCaller(ctx);

      // Action: Call cross-schema query procedure
      const result = await caller.getProjectWithDetails({
        organizationId: ORG_UUID_123,
        projectId: PROJECT_UUID,
        includeSubcontractors: true,
        includeUsers: true,
      });

      // Expect: Returns combined data from multiple schemas with proper structure
      expect(result.project).toBeDefined();
      expect(result.project.id).toBe(PROJECT_UUID);
      expect(result.project.name).toBe('Test Project');
      expect(result.subcontractors).toEqual(mockSubcontractors);
      expect(result.users).toEqual(mockUsers);
    });

    it('respects organization boundaries across all queries', async () => {
      // Setup: User from org-123 requesting project from org-456
      const mockUser: User = {
        id: USER_UUID_123,
        email: 'test@example.com',
      } as User;

      const ctx = {
        db: {} as any,
        session: mockUser,
        organizationId: ORG_UUID_123,
      };

      const caller = organizationRouter.createCaller(ctx);

      // Action & Expect: Attempt cross-organization access
      await expect(
        caller.getProjectWithDetails({
          organizationId: ORG_UUID_456,
          projectId: PROJECT_UUID,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('handles missing related data gracefully', async () => {
      // Setup: Project exists but has no subcontractors or users
      const mockUser: User = {
        id: USER_UUID_123,
        email: 'test@example.com',
      } as User;

      const ctx = {
        db: {} as any,
        session: mockUser,
        organizationId: ORG_UUID_123,
      };

      const mockProject = {
        id: PROJECT_UUID,
        name: 'Test Project',
        status: 'active',
        organization_id: ORG_UUID_123,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock forsured queries
      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'projects') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockProject, error: null }),
          } as any;
        } else if (tableName === 'subcontractors') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as any;
        }
        return {} as any;
      });

      // Mock core query - no users
      vi.mocked(supabaseModule.core).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const caller = organizationRouter.createCaller(ctx);

      // Action: Call procedure
      const result = await caller.getProjectWithDetails({
        organizationId: ORG_UUID_123,
        projectId: PROJECT_UUID,
      });

      // Expect: Returns primary data with empty related fields, no errors
      expect(result.project).toBeDefined();
      expect(result.subcontractors).toEqual([]);
      expect(result.users).toEqual([]);
    });
  });
});
