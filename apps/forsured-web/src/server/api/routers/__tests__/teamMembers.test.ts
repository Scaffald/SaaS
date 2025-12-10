/**
 * Team Members Router Tests
 * REQ-283: Team Member Management UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { teamMembersRouter } from '../teamMembers';

// Mock Supabase clients
vi.mock('../../../../lib/supabase', () => {
  const createMockQueryBuilder = () => {
    let mockData: unknown = null;
    let mockError: unknown = null;
    let mockCount: number | null = null;

    const builder = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ data: mockData, error: mockError })),
      then: vi.fn((resolve) =>
        resolve({ data: mockData, error: mockError, count: mockCount })
      ),
      _setMockData: (data: unknown) => {
        mockData = data;
      },
      _setMockError: (error: unknown) => {
        mockError = error;
      },
      _setMockCount: (count: number | null) => {
        mockCount = count;
      },
    };

    return builder;
  };

  return {
    forsured: vi.fn(() => createMockQueryBuilder()),
    core: vi.fn(() => createMockQueryBuilder()),
  };
});

// Import after mocking
import { core } from '../../../../lib/supabase';

// Test UUIDs (must be valid UUID v4 format)
const TEST_ORG_ID = '11111111-1111-4111-a111-111111111111';
const TEST_ORG_ID_2 = '22222222-2222-4222-a222-222222222222';
const TEST_USER_ID = '44444444-4444-4444-a444-444444444444';
const TEST_MEMBER_ID_1 = '55555555-5555-4555-a555-555555555551';
const TEST_MEMBER_ID_2 = '55555555-5555-4555-a555-555555555552';

// Mock context factory
function createMockContext(organizationId: string | null = TEST_ORG_ID) {
  return {
    organizationId,
    userId: TEST_USER_ID,
    session: {
      user: { id: TEST_USER_ID },
    },
  };
}

// Helper to create caller
function createCaller(ctx: ReturnType<typeof createMockContext>) {
  return teamMembersRouter.createCaller(ctx as never);
}

describe('Team Members Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should return team members for the organization', async () => {
      const mockMembers = [
        {
          id: TEST_MEMBER_ID_1,
          name: 'Alice Admin',
          email: 'alice@example.com',
          role: 'admin',
          company: 'Acme Corp',
          avatar: null,
          avatar_url: 'https://example.com/alice.jpg',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: TEST_MEMBER_ID_2,
          name: 'Bob Broker',
          email: 'bob@example.com',
          role: 'broker',
          company: 'Insurance Inc',
          avatar: 'https://example.com/bob.jpg',
          avatar_url: null,
          created_at: '2024-01-02',
          updated_at: '2024-01-02',
        },
      ];

      vi.mocked(core).mockImplementation(() => {
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) =>
            resolve({ data: mockMembers, error: null, count: 2 })
          ),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.list({
        organizationId: TEST_ORG_ID,
      });

      expect(result.members).toHaveLength(2);
      expect(result.members[0].name).toBe('Alice Admin');
      expect(result.members[0].role).toBe('admin');
      expect(result.members[0].avatar).toBe('https://example.com/alice.jpg');
      expect(result.members[1].name).toBe('Bob Broker');
      expect(result.members[1].avatar).toBe('https://example.com/bob.jpg');
      expect(result.total).toBe(2);
    });

    it('should throw FORBIDDEN for unauthorized organization', async () => {
      const ctx = createMockContext(TEST_ORG_ID_2);
      const caller = createCaller(ctx);

      await expect(
        caller.list({
          organizationId: TEST_ORG_ID,
        })
      ).rejects.toThrow(TRPCError);
    });

    it('should throw FORBIDDEN when user has no organization', async () => {
      const ctx = createMockContext(null);
      const caller = createCaller(ctx);

      await expect(
        caller.list({
          organizationId: TEST_ORG_ID,
        })
      ).rejects.toThrow('You must belong to an organization');
    });

    it('should filter by role when provided', async () => {
      const mockMembers = [
        {
          id: TEST_MEMBER_ID_1,
          name: 'Alice Admin',
          email: 'alice@example.com',
          role: 'admin',
          company: 'Acme Corp',
          avatar: null,
          avatar_url: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ];

      const eqMock = vi.fn().mockReturnThis();
      vi.mocked(core).mockImplementation(() => {
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: eqMock,
          or: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) =>
            resolve({ data: mockMembers, error: null, count: 1 })
          ),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      await caller.list({
        organizationId: TEST_ORG_ID,
        role: 'admin',
      });

      // Verify role filter was applied
      expect(eqMock).toHaveBeenCalledWith('role', 'admin');
    });

    it('should return empty array when no members exist', async () => {
      vi.mocked(core).mockImplementation(() => {
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) =>
            resolve({ data: [], error: null, count: 0 })
          ),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.list({
        organizationId: TEST_ORG_ID,
      });

      expect(result.members).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getById', () => {
    it('should return a single team member', async () => {
      const mockMember = {
        id: TEST_MEMBER_ID_1,
        name: 'Alice Admin',
        email: 'alice@example.com',
        role: 'admin',
        company: 'Acme Corp',
        avatar: null,
        avatar_url: 'https://example.com/alice.jpg',
        broker_role: 'senior',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      vi.mocked(core).mockImplementation(() => {
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(() => Promise.resolve({ data: mockMember, error: null })),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.getById({
        organizationId: TEST_ORG_ID,
        memberId: TEST_MEMBER_ID_1,
      });

      expect(result.name).toBe('Alice Admin');
      expect(result.email).toBe('alice@example.com');
      expect(result.role).toBe('admin');
      expect(result.avatar).toBe('https://example.com/alice.jpg');
      expect(result.brokerRole).toBe('senior');
    });

    it('should throw NOT_FOUND for non-existent member', async () => {
      vi.mocked(core).mockImplementation(() => {
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(() =>
            Promise.resolve({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
          ),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      await expect(
        caller.getById({
          organizationId: TEST_ORG_ID,
          memberId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow('Team member not found');
    });

    it('should throw FORBIDDEN for unauthorized organization', async () => {
      const ctx = createMockContext(TEST_ORG_ID_2);
      const caller = createCaller(ctx);

      await expect(
        caller.getById({
          organizationId: TEST_ORG_ID,
          memberId: TEST_MEMBER_ID_1,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getSummary', () => {
    it('should return team summary statistics', async () => {
      let callCount = 0;
      vi.mocked(core).mockImplementation(() => {
        callCount++;
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => {
            if (callCount === 1) {
              // Total count
              return resolve({ data: null, error: null, count: 10 });
            }
            if (callCount === 2) {
              // Admin count
              return resolve({ data: [{}, {}], error: null });
            }
            if (callCount === 3) {
              // Manager count
              return resolve({ data: [{}, {}, {}], error: null });
            }
            if (callCount === 4) {
              // Broker count
              return resolve({ data: [{}], error: null });
            }
            if (callCount === 5) {
              // Subcontractor count
              return resolve({ data: [{}, {}, {}, {}], error: null });
            }
            return resolve({ data: null, error: null });
          }),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.getSummary({
        organizationId: TEST_ORG_ID,
      });

      expect(result.total).toBe(10);
      expect(result.byRole.admin).toBe(2);
      expect(result.byRole.manager).toBe(3);
      expect(result.byRole.broker).toBe(1);
      expect(result.byRole.subcontractor).toBe(4);
    });

    it('should return zeros when no members exist', async () => {
      vi.mocked(core).mockImplementation(() => {
        const builder = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) =>
            resolve({ data: [], error: null, count: 0 })
          ),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.getSummary({
        organizationId: TEST_ORG_ID,
      });

      expect(result.total).toBe(0);
      expect(result.byRole.admin).toBe(0);
      expect(result.byRole.manager).toBe(0);
      expect(result.byRole.broker).toBe(0);
      expect(result.byRole.subcontractor).toBe(0);
    });
  });

  describe('updateRole', () => {
    it('should update member role', async () => {
      const mockUpdatedMember = {
        id: TEST_MEMBER_ID_1,
        name: 'Alice Admin',
        email: 'alice@example.com',
        role: 'manager',
        updated_at: '2024-01-02',
      };

      vi.mocked(core).mockImplementation(() => {
        const builder = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn(() =>
            Promise.resolve({ data: mockUpdatedMember, error: null })
          ),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.updateRole({
        organizationId: TEST_ORG_ID,
        memberId: TEST_MEMBER_ID_1,
        role: 'manager',
      });

      expect(result.id).toBe(TEST_MEMBER_ID_1);
      expect(result.role).toBe('manager');
    });

    it('should throw error on update failure', async () => {
      vi.mocked(core).mockImplementation(() => {
        const builder = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn(() =>
            Promise.resolve({ data: null, error: { message: 'Update failed' } })
          ),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      await expect(
        caller.updateRole({
          organizationId: TEST_ORG_ID,
          memberId: TEST_MEMBER_ID_1,
          role: 'manager',
        })
      ).rejects.toThrow('Failed to update team member role');
    });

    it('should throw FORBIDDEN for unauthorized organization', async () => {
      const ctx = createMockContext(TEST_ORG_ID_2);
      const caller = createCaller(ctx);

      await expect(
        caller.updateRole({
          organizationId: TEST_ORG_ID,
          memberId: TEST_MEMBER_ID_1,
          role: 'manager',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('remove', () => {
    it('should remove member from organization', async () => {
      vi.mocked(core).mockImplementation(() => {
        const builder = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => resolve({ data: null, error: null })),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      const result = await caller.remove({
        organizationId: TEST_ORG_ID,
        memberId: TEST_MEMBER_ID_1,
      });

      expect(result.success).toBe(true);
      expect(result.memberId).toBe(TEST_MEMBER_ID_1);
    });

    it('should throw error on remove failure', async () => {
      vi.mocked(core).mockImplementation(() => {
        const builder = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) =>
            resolve({ data: null, error: { message: 'Remove failed' } })
          ),
        };
        return builder as never;
      });

      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      await expect(
        caller.remove({
          organizationId: TEST_ORG_ID,
          memberId: TEST_MEMBER_ID_1,
        })
      ).rejects.toThrow('Failed to remove team member');
    });

    it('should throw FORBIDDEN for unauthorized organization', async () => {
      const ctx = createMockContext(TEST_ORG_ID_2);
      const caller = createCaller(ctx);

      await expect(
        caller.remove({
          organizationId: TEST_ORG_ID,
          memberId: TEST_MEMBER_ID_1,
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid organization ID format', async () => {
      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      await expect(
        caller.list({
          organizationId: 'not-a-uuid',
        })
      ).rejects.toThrow();
    });

    it('should reject invalid member ID format', async () => {
      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      await expect(
        caller.getById({
          organizationId: TEST_ORG_ID,
          memberId: 'not-a-uuid',
        })
      ).rejects.toThrow();
    });

    it('should reject invalid role value', async () => {
      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      await expect(
        caller.updateRole({
          organizationId: TEST_ORG_ID,
          memberId: TEST_MEMBER_ID_1,
          role: 'invalid-role' as never,
        })
      ).rejects.toThrow();
    });

    it('should enforce limit bounds', async () => {
      const ctx = createMockContext(TEST_ORG_ID);
      const caller = createCaller(ctx);

      await expect(
        caller.list({
          organizationId: TEST_ORG_ID,
          limit: 200, // Max is 100
        })
      ).rejects.toThrow();

      await expect(
        caller.list({
          organizationId: TEST_ORG_ID,
          limit: 0, // Min is 1
        })
      ).rejects.toThrow();
    });
  });
});
