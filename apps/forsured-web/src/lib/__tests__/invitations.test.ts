/**
 * REQ-126: Broker Invitation System
 * Unit tests for invitations service
 *
 * REQ-306: Mock Validation
 * These mocks are validated against the real Supabase API in invitations.mockValidation.test.ts
 * The mocks MUST match the real API behavior or tests will give false confidence.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateInvitation,
  markInvitationUsed,
  createInvitation,
  listInvitations,
  revokeInvitation,
  type Invitation,
} from '../invitations';

/**
 * Mock the forsured function to match real Supabase PostgREST API behavior
 *
 * VALIDATED AGAINST REALITY (see invitations.mockValidation.test.ts):
 * - forsured() returns a query builder object
 * - select(), insert(), update(), eq(), order() return 'this' for chaining
 * - single() returns an awaitable builder that resolves to {data: T | null, error: PostgrestError | null}
 * - Error codes match Supabase (PGRST116 for not found)
 * - Response format is always {data, error}
 * 
 * NOTE: In the mock, we simplify by having single() return a Promise directly,
 * which is functionally equivalent for testing purposes.
 */
vi.mock('../supabase', () => {
  const mockQueryBuilder = {
    // Chainable methods - return 'this' to allow chaining
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    // Terminal method - returns Promise with {data, error} format
    single: vi.fn(),
  };

  return {
    forsured: vi.fn(() => mockQueryBuilder),
  };
});

import { forsured } from '../supabase';

describe('Invitations Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateInvitation', () => {
    it('should return invitation when code is valid', async () => {
      const mockInvitation: Invitation = {
        id: 'inv-1',
        code: 'ABCD1234',
        email: null,
        expires_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        max_uses: 1,
        use_count: 0,
        created_by: 'admin-1',
        created_at: new Date().toISOString(),
        used_by: null,
        used_at: null,
      };

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvitation, error: null }),
      };

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await validateInvitation('abcd1234');

      expect(result).toEqual(mockInvitation);
      expect(forsured).toHaveBeenCalledWith('broker_invitations');
      expect(mockBuilder.eq).toHaveBeenCalledWith('code', 'ABCD1234');
    });

    it('should return null when code is not found', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await validateInvitation('INVALID');

      expect(result).toBeNull();
    });

    it('should return null when invitation is expired', async () => {
      const expiredInvitation: Invitation = {
        id: 'inv-2',
        code: 'EXPIRED1',
        email: null,
        expires_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        max_uses: 1,
        use_count: 0,
        created_by: 'admin-1',
        created_at: new Date().toISOString(),
        used_by: null,
        used_at: null,
      };

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: expiredInvitation, error: null }),
      };

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await validateInvitation('EXPIRED1');

      expect(result).toBeNull();
    });

    it('should return null when max uses reached', async () => {
      const usedInvitation: Invitation = {
        id: 'inv-3',
        code: 'USED1234',
        email: null,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        max_uses: 1,
        use_count: 1, // Already used
        created_by: 'admin-1',
        created_at: new Date().toISOString(),
        used_by: 'user-1',
        used_at: new Date().toISOString(),
      };

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: usedInvitation, error: null }),
      };

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await validateInvitation('USED1234');

      expect(result).toBeNull();
    });

    it('should convert code to uppercase', async () => {
      const mockInvitation: Invitation = {
        id: 'inv-4',
        code: 'LOWERCASE',
        email: null,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        max_uses: 1,
        use_count: 0,
        created_by: 'admin-1',
        created_at: new Date().toISOString(),
        used_by: null,
        used_at: null,
      };

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvitation, error: null }),
      };

      (forsured as any).mockReturnValue(mockBuilder);

      await validateInvitation('lowercase');

      expect(mockBuilder.eq).toHaveBeenCalledWith('code', 'LOWERCASE');
    });

    it('should return null on database error', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST500', message: 'Database error' },
        }),
      };

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await validateInvitation('ERROR123');

      expect(result).toBeNull();
    });
  });

  describe('markInvitationUsed', () => {
    it('should mark invitation as used and increment use count', async () => {
      const invitationId = 'inv-1';
      const profileId = 'profile-1';
      const currentUseCount = 0;

      // Mock the fetch query
      const fetchBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { use_count: currentUseCount },
          error: null,
        }),
      };

      // Mock the update query
      const updateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      (forsured as any)
        .mockReturnValueOnce(fetchBuilder)
        .mockReturnValueOnce(updateBuilder);

      await markInvitationUsed(invitationId, profileId);

      expect(forsured).toHaveBeenCalledTimes(2);
      expect(updateBuilder.update).toHaveBeenCalledWith({
        used_by: profileId,
        used_at: expect.any(String),
        use_count: 1,
      });
      expect(updateBuilder.eq).toHaveBeenCalledWith('id', invitationId);
    });

    it('should throw error when fetch fails', async () => {
      const invitationId = 'inv-1';
      const profileId = 'profile-1';

      const fetchBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Fetch failed' },
        }),
      };

      (forsured as any).mockReturnValue(fetchBuilder);

      await expect(markInvitationUsed(invitationId, profileId)).rejects.toEqual({
        message: 'Fetch failed',
      });
    });

    it('should throw error when update fails', async () => {
      const invitationId = 'inv-1';
      const profileId = 'profile-1';

      const fetchBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { use_count: 0 },
          error: null,
        }),
      };

      const updateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Update failed' },
        }),
      };

      (forsured as any)
        .mockReturnValueOnce(fetchBuilder)
        .mockReturnValueOnce(updateBuilder);

      await expect(markInvitationUsed(invitationId, profileId)).rejects.toEqual({
        message: 'Update failed',
      });
    });
  });

  describe('createInvitation', () => {
    it('should create invitation with default values', async () => {
      const options = {
        createdBy: 'admin-1',
      };

      const mockInvitation: Invitation = {
        id: 'inv-new',
        code: 'NEWCODE1',
        email: null,
        expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        max_uses: 1,
        use_count: 0,
        created_by: 'admin-1',
        created_at: new Date().toISOString(),
        used_by: null,
        used_at: null,
      };

      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvitation, error: null }),
      };

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await createInvitation(options);

      expect(result).toEqual(mockInvitation);
      expect(mockBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          code: expect.any(String),
          email: null,
          max_uses: 1,
          use_count: 0,
          expires_at: expect.any(String),
          created_by: 'admin-1',
        })
      );
    });

    it('should create invitation with custom email and max uses', async () => {
      const options = {
        email: 'broker@example.com',
        maxUses: 5,
        expiresInDays: 7,
        createdBy: 'admin-1',
      };

      const mockInvitation: Invitation = {
        id: 'inv-custom',
        code: 'CUSTOM1',
        email: 'broker@example.com',
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        max_uses: 5,
        use_count: 0,
        created_by: 'admin-1',
        created_at: new Date().toISOString(),
        used_by: null,
        used_at: null,
      };

      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvitation, error: null }),
      };

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await createInvitation(options);

      expect(result).toEqual(mockInvitation);
      expect(mockBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'broker@example.com',
          max_uses: 5,
          expires_at: expect.any(String),
        })
      );
    });

    it('should throw error when creation fails', async () => {
      const options = {
        createdBy: 'admin-1',
      };

      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Creation failed' },
        }),
      };

      (forsured as any).mockReturnValue(mockBuilder);

      await expect(createInvitation(options)).rejects.toEqual({
        message: 'Creation failed',
      });
    });

    it('should generate unique 8-character code', async () => {
      const options = {
        createdBy: 'admin-1',
      };

      const mockInvitation: Invitation = {
        id: 'inv-1',
        code: 'ABCD1234',
        email: null,
        expires_at: new Date().toISOString(),
        max_uses: 1,
        use_count: 0,
        created_by: 'admin-1',
        created_at: new Date().toISOString(),
        used_by: null,
        used_at: null,
      };

      const mockBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockInvitation, error: null }),
      };

      (forsured as any).mockReturnValue(mockBuilder);

      await createInvitation(options);

      const insertCall = mockBuilder.insert.mock.calls[0][0];
      expect(insertCall.code).toHaveLength(8);
      expect(insertCall.code).toMatch(/^[A-Z2-9]{8}$/); // Only uppercase letters and numbers (excluding confusing chars)
    });
  });

  describe('listInvitations', () => {
    it('should return list of invitations ordered by created_at desc', async () => {
      const mockInvitations: Invitation[] = [
        {
          id: 'inv-1',
          code: 'CODE1',
          email: null,
          expires_at: new Date().toISOString(),
          max_uses: 1,
          use_count: 0,
          created_by: 'admin-1',
          created_at: new Date().toISOString(),
          used_by: null,
          used_at: null,
        },
        {
          id: 'inv-2',
          code: 'CODE2',
          email: 'broker@example.com',
          expires_at: new Date().toISOString(),
          max_uses: 1,
          use_count: 1,
          created_by: 'admin-1',
          created_at: new Date().toISOString(),
          used_by: 'user-1',
          used_at: new Date().toISOString(),
        },
      ];

      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockInvitations, error: null }),
      };

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await listInvitations();

      expect(result).toEqual(mockInvitations);
      expect(mockBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return empty array when no invitations exist', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await listInvitations();

      expect(result).toEqual([]);
    });

    it('should throw error when listing fails', async () => {
      const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'List failed' },
        }),
      };

      (forsured as any).mockReturnValue(mockBuilder);

      await expect(listInvitations()).rejects.toEqual({
        message: 'List failed',
      });
    });
  });

  describe('revokeInvitation', () => {
    it('should revoke invitation by setting max_uses to current use_count', async () => {
      const invitationId = 'inv-1';
      const currentUseCount = 2;

      const fetchBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { use_count: currentUseCount },
          error: null,
        }),
      };

      const updateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      (forsured as any)
        .mockReturnValueOnce(fetchBuilder)
        .mockReturnValueOnce(updateBuilder);

      await revokeInvitation(invitationId);

      expect(updateBuilder.update).toHaveBeenCalledWith({
        max_uses: currentUseCount,
      });
      expect(updateBuilder.eq).toHaveBeenCalledWith('id', invitationId);
    });

    it('should handle invitation with zero use count', async () => {
      const invitationId = 'inv-2';
      const currentUseCount = 0;

      const fetchBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { use_count: currentUseCount },
          error: null,
        }),
      };

      const updateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      (forsured as any)
        .mockReturnValueOnce(fetchBuilder)
        .mockReturnValueOnce(updateBuilder);

      await revokeInvitation(invitationId);

      expect(updateBuilder.update).toHaveBeenCalledWith({
        max_uses: 0,
      });
    });

    it('should throw error when fetch fails', async () => {
      const invitationId = 'inv-1';

      const fetchBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Fetch failed' },
        }),
      };

      (forsured as any).mockReturnValue(fetchBuilder);

      await expect(revokeInvitation(invitationId)).rejects.toEqual({
        message: 'Fetch failed',
      });
    });

    it('should throw error when update fails', async () => {
      const invitationId = 'inv-1';

      const fetchBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { use_count: 0 },
          error: null,
        }),
      };

      const updateBuilder = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Update failed' },
        }),
      };

      (forsured as any)
        .mockReturnValueOnce(fetchBuilder)
        .mockReturnValueOnce(updateBuilder);

      await expect(revokeInvitation(invitationId)).rejects.toEqual({
        message: 'Update failed',
      });
    });
  });
});

