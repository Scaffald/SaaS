/**
 * Client Profile Router Tests
 * REQ-274: Clickable Client Navigation
 * TASK-2: Implement Client Profile Data Fetching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clientProfileRouter } from '../clientProfile';
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
const ORG_UUID_OTHER = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
const USER_UUID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const CLIENT_UUID = '8c9e6679-7425-40de-944b-e07fc1f90ae8';
const GC_UUID_1 = '9c9e6679-7425-40de-944b-e07fc1f90ae9';
const GC_UUID_2 = 'ac9e6679-7425-40de-944b-e07fc1f90aea';

describe('Client Profile Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('returns client profile data for authorized user', async () => {
      // Setup: User session with organizationId, request for client in same org
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

      const mockClient = {
        id: CLIENT_UUID,
        name: 'ABC Construction',
        type: 'subcontractor',
        organization_id: ORG_UUID,
        created_at: new Date().toISOString(),
      };

      const mockGcRelationships = [
        {
          id: 'rel-1',
          gc_id: GC_UUID_1,
          client_id: CLIENT_UUID,
          gcs: { id: GC_UUID_1, name: 'General Contractor A' },
          compliance_scores: [{ score: 85, status: 'compliant' }],
        },
        {
          id: 'rel-2',
          gc_id: GC_UUID_2,
          client_id: CLIENT_UUID,
          gcs: { id: GC_UUID_2, name: 'General Contractor B' },
          compliance_scores: [{ score: 65, status: 'warning' }],
        },
      ];

      const mockRecentActivity = [
        {
          id: 'activity-1',
          type: 'document_uploaded',
          description: 'Uploaded COI document',
          created_at: new Date().toISOString(),
        },
        {
          id: 'activity-2',
          type: 'compliance_updated',
          description: 'Compliance score updated',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      // Mock forsured queries (clients, gc_relationships, activity_logs are in forsured schema)
      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'clients') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
          } as any;
        } else if (tableName === 'gc_relationships') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockGcRelationships, error: null }),
          } as any;
        } else if (tableName === 'activity_logs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: mockRecentActivity, error: null }),
          } as any;
        }
        return {} as any;
      });

      const caller = clientProfileRouter.createCaller(ctx);

      // Action: Call getProfile procedure
      const result = await caller.getProfile({
        organizationId: ORG_UUID,
        clientId: CLIENT_UUID,
      });

      // Expect: Returns client profile data
      expect(result.client.id).toBe(CLIENT_UUID);
      expect(result.client.name).toBe('ABC Construction');
      expect(result.gcRelationships).toHaveLength(2);
      expect(result.gcRelationships[0].gcName).toBe('General Contractor A');
      expect(result.gcRelationships[0].complianceScore).toBe(85);
      expect(result.recentActivity).toHaveLength(2);
    });

    it('rejects unauthorized user accessing other organization client', async () => {
      // Setup: User session with one org, request for client in different org
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

      const caller = clientProfileRouter.createCaller(ctx);

      // Action & Expect: Call procedure with different organization ID
      await expect(
        caller.getProfile({
          organizationId: ORG_UUID_OTHER,
          clientId: CLIENT_UUID,
        })
      ).rejects.toThrow(TRPCError);
      await expect(
        caller.getProfile({
          organizationId: ORG_UUID_OTHER,
          clientId: CLIENT_UUID,
        })
      ).rejects.toThrow('You do not have permission to access data from this organization');
    });

    it('rejects user without organization', async () => {
      // Setup: User session without organizationId
      const mockUser: User = {
        id: USER_UUID,
        email: 'test@example.com',
      } as User;

      const ctx = {
        db: {} as any,
        session: mockUser,
        userId: USER_UUID, // Required by isAuthenticated middleware
        organizationId: null,
      };

      const caller = clientProfileRouter.createCaller(ctx);

      // Action & Expect: Call procedure
      await expect(
        caller.getProfile({
          organizationId: ORG_UUID,
          clientId: CLIENT_UUID,
        })
      ).rejects.toThrow(TRPCError);
      await expect(
        caller.getProfile({
          organizationId: ORG_UUID,
          clientId: CLIENT_UUID,
        })
      ).rejects.toThrow('You must belong to an organization to access this resource');
    });

    it('returns 404 for non-existent client', async () => {
      // Setup: Valid user but client doesn't exist
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

      // Mock forsured to return no client
      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'clients') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' },
            }),
          } as any;
        }
        return {} as any;
      });

      const caller = clientProfileRouter.createCaller(ctx);

      // Action & Expect: Call procedure
      await expect(
        caller.getProfile({
          organizationId: ORG_UUID,
          clientId: CLIENT_UUID,
        })
      ).rejects.toThrow(TRPCError);
      await expect(
        caller.getProfile({
          organizationId: ORG_UUID,
          clientId: CLIENT_UUID,
        })
      ).rejects.toThrow('Client not found');
    });

    it('handles client with no GC relationships', async () => {
      // Setup: Client exists but has no GC relationships
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

      const mockClient = {
        id: CLIENT_UUID,
        name: 'New Client',
        type: 'subcontractor',
        organization_id: ORG_UUID,
        created_at: new Date().toISOString(),
      };

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'clients') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
          } as any;
        } else if (tableName === 'gc_relationships') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as any;
        } else if (tableName === 'activity_logs') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          } as any;
        }
        return {} as any;
      });

      const caller = clientProfileRouter.createCaller(ctx);

      // Action: Call procedure
      const result = await caller.getProfile({
        organizationId: ORG_UUID,
        clientId: CLIENT_UUID,
      });

      // Expect: Returns client with empty relationships
      expect(result.client.id).toBe(CLIENT_UUID);
      expect(result.gcRelationships).toEqual([]);
      expect(result.recentActivity).toEqual([]);
    });

    it('rejects invalid client ID format', async () => {
      // Setup: User session with valid organizationId
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

      const caller = clientProfileRouter.createCaller(ctx);

      // Action & Expect: Call procedure with invalid clientId format (not a UUID)
      await expect(
        caller.getProfile({ organizationId: ORG_UUID, clientId: '' })
      ).rejects.toThrow();
      await expect(
        caller.getProfile({ organizationId: ORG_UUID, clientId: 'invalid-id' })
      ).rejects.toThrow();
    });
  });
});
