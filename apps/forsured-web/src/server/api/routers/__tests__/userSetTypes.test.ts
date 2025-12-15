/**
 * User Set Types Router Tests
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 * TASK-13: Write comprehensive test suite for user set type system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { userSetTypesRouter } from '../userSetTypes';
import { TRPCError } from '@trpc/server';
import type { User } from '@supabase/supabase-js';
import * as supabaseModule from '../../../../lib/supabase';

// Mock the supabase module
vi.mock('../../../../lib/supabase', () => ({
  forsured: vi.fn(),
}));

// Test UUIDs (v4 format - must use version digit 4)
const ADMIN_USER_UUID = '550e8400-e29b-41d4-a716-446655440000';
const MANAGER_USER_UUID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const UST_CONSTRUCTION_UUID = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
const UST_PROPERTY_UUID = 'a987fbc9-4bed-4078-af07-9141ba07c9f3';

// Mock user set type data
const createMockUserSetType = (overrides = {}) => ({
  id: UST_CONSTRUCTION_UUID,
  name: 'Construction',
  slug: 'construction',
  manager_label_singular: 'General Contractor',
  manager_label_plural: 'General Contractors',
  contractor_label_singular: 'Subcontractor',
  contractor_label_plural: 'Subcontractors',
  description: 'Construction industry vertical',
  is_active: true,
  lexicon: {
    'nav.dashboard': 'Dashboard',
    'nav.contractors': 'Subs',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Mock user profile data
const createMockUserProfile = (overrides = {}) => ({
  id: 'profile-id-1',
  scaffald_user_id: MANAGER_USER_UUID,
  user_type: 'manager',
  user_set_type_id: UST_CONSTRUCTION_UUID,
  ...overrides,
});

// Mock admin profile
const createMockAdminProfile = () => ({
  id: 'admin-profile-id',
  scaffald_user_id: ADMIN_USER_UUID,
  user_type: 'admin',
  user_set_type_id: null,
});

// Helper to create chainable mock query for different return types
const createChainableMock = (finalResult: { data?: unknown; error?: unknown; count?: number }) => {
  // Create a thenable mock that can be chained and awaited at any point
  // Uses lazy evaluation to avoid stack overflow from recursive calls
  const createThenable = (): Record<string, unknown> => {
    const thenable: Record<string, unknown> = {
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(finalResult).then(resolve),
      catch: (reject: (reason: unknown) => unknown) => Promise.resolve(finalResult).catch(reject),
    };
    // Add all chainable methods with lazy evaluation (mockImplementation instead of mockReturnValue)
    thenable.select = vi.fn().mockImplementation(() => createThenable());
    thenable.eq = vi.fn().mockImplementation(() => createThenable());
    thenable.in = vi.fn().mockImplementation(() => createThenable());
    thenable.order = vi.fn().mockImplementation(() => createThenable());
    thenable.limit = vi.fn().mockResolvedValue(finalResult);
    thenable.single = vi.fn().mockResolvedValue(finalResult);
    thenable.insert = vi.fn().mockImplementation(() => createThenable());
    thenable.update = vi.fn().mockImplementation(() => createThenable());
    thenable.delete = vi.fn().mockImplementation(() => createThenable());
    return thenable;
  };

  return createThenable();
};

describe('User Set Types Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create caller context
  // Must match the Context interface from ../context.ts
  const createContext = (userId: string | null = ADMIN_USER_UUID) => {
    const mockUser: User | null = userId
      ? ({
          id: userId,
          email: 'test@example.com',
        } as User)
      : null;

    return {
      db: {},
      session: mockUser,
      userId: userId, // Required by isAuthenticated middleware
      organizationId: null,
    };
  };

  // ==================== listActive Tests ====================

  describe('listActive', () => {
    it('returns only active user set types', async () => {
      const mockTypes = [
        createMockUserSetType(),
        createMockUserSetType({
          id: UST_PROPERTY_UUID,
          name: 'Property Management',
          slug: 'property-management',
        }),
      ];

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: mockTypes, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >
      );

      const ctx = createContext(null); // Public endpoint, no auth needed
      const caller = userSetTypesRouter.createCaller(ctx);

      const result = await caller.listActive();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Construction');
      expect(result[0].managerLabelSingular).toBe('General Contractor');
    });

    it('transforms database columns to camelCase', async () => {
      const mockTypes = [createMockUserSetType()];

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: mockTypes, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >
      );

      const ctx = createContext(null);
      const caller = userSetTypesRouter.createCaller(ctx);

      const result = await caller.listActive();

      expect(result[0]).toHaveProperty('managerLabelSingular');
      expect(result[0]).toHaveProperty('managerLabelPlural');
      expect(result[0]).toHaveProperty('contractorLabelSingular');
      expect(result[0]).toHaveProperty('contractorLabelPlural');
    });

    it('returns empty array when no active types exist', async () => {
      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: [], error: null }) as ReturnType<typeof supabaseModule.forsured>
      );

      const ctx = createContext(null);
      const caller = userSetTypesRouter.createCaller(ctx);

      const result = await caller.listActive();

      expect(result).toHaveLength(0);
    });

    it('throws INTERNAL_SERVER_ERROR on database error', async () => {
      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: null, error: { message: 'Database error' } }) as ReturnType<
          typeof supabaseModule.forsured
        >
      );

      const ctx = createContext(null);
      const caller = userSetTypesRouter.createCaller(ctx);

      await expect(caller.listActive()).rejects.toThrow(TRPCError);
    });
  });

  // ==================== getUserLexicon Tests ====================

  describe('getUserLexicon', () => {
    it('returns lexicon for authenticated user with user set type', async () => {
      const mockProfile = createMockUserProfile();
      const mockUserSetType = createMockUserSetType();

      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'user_profiles') {
          return createChainableMock({ data: mockProfile, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        }
        if (tableName === 'user_set_types') {
          return createChainableMock({ data: mockUserSetType, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        }
        return createChainableMock({ data: null, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext(MANAGER_USER_UUID);
      const caller = userSetTypesRouter.createCaller(ctx);

      const result = await caller.getUserLexicon();

      expect(result.lexicon).toBeDefined();
      expect(result.lexicon['nav.dashboard']).toBe('Dashboard');
      expect(result.userSetType).toBeDefined();
      expect(result.userSetType?.name).toBe('Construction');
    });

    it('returns empty lexicon for broker/admin users without user set type', async () => {
      const mockProfile = createMockUserProfile({
        user_type: 'broker',
        user_set_type_id: null,
      });

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: mockProfile, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >
      );

      const ctx = createContext(MANAGER_USER_UUID);
      const caller = userSetTypesRouter.createCaller(ctx);

      const result = await caller.getUserLexicon();

      expect(result.lexicon).toEqual({});
      expect(result.userSetType).toBeNull();
    });

    it('throws UNAUTHORIZED when no session exists', async () => {
      const ctx = createContext(null);
      const caller = userSetTypesRouter.createCaller(ctx);

      // protectedProcedure throws this message, not our custom check
      await expect(caller.getUserLexicon()).rejects.toThrow('logged in');
    });

    it('throws NOT_FOUND when user profile does not exist', async () => {
      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: null, error: { message: 'Not found' } }) as ReturnType<
          typeof supabaseModule.forsured
        >
      );

      const ctx = createContext(MANAGER_USER_UUID);
      const caller = userSetTypesRouter.createCaller(ctx);

      await expect(caller.getUserLexicon()).rejects.toThrow('User profile not found');
    });

    it('throws NOT_FOUND when user set type does not exist', async () => {
      const mockProfile = createMockUserProfile();

      let callCount = 0;
      vi.mocked(supabaseModule.forsured).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call - user_profiles
          return createChainableMock({ data: mockProfile, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        }
        // Second call - user_set_types (not found)
        return createChainableMock({ data: null, error: { message: 'Not found' } }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });

      const ctx = createContext(MANAGER_USER_UUID);
      const caller = userSetTypesRouter.createCaller(ctx);

      await expect(caller.getUserLexicon()).rejects.toThrow('User set type not found');
    });
  });

  // TASK-14: getByIdWithLexicon - Broker context switching endpoint
  describe('getByIdWithLexicon', () => {
    it('returns user set type with lexicon for valid ID', async () => {
      const mockUserSetType = createMockUserSetType();

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: mockUserSetType, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >
      );

      const ctx = createContext(MANAGER_USER_UUID);
      const caller = userSetTypesRouter.createCaller(ctx);

      const result = await caller.getByIdWithLexicon({ id: UST_CONSTRUCTION_UUID });

      expect(result.userSetType).toBeDefined();
      expect(result.userSetType.name).toBe('Construction');
      expect(result.lexicon).toEqual({
        'nav.dashboard': 'Dashboard',
        'nav.contractors': 'Subs',
      });
    });

    it('returns lexicon and user set type for brokers', async () => {
      const mockUserSetType = createMockUserSetType();

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: mockUserSetType, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >
      );

      // Create broker context
      const ctx = createContext('broker-user-id');
      const caller = userSetTypesRouter.createCaller(ctx);

      const result = await caller.getByIdWithLexicon({ id: UST_CONSTRUCTION_UUID });

      expect(result.userSetType).toBeDefined();
      expect(result.userSetType.name).toBe('Construction');
    });

    it('throws UNAUTHORIZED when no session exists', async () => {
      const ctx = createContext(null);
      const caller = userSetTypesRouter.createCaller(ctx);

      await expect(caller.getByIdWithLexicon({ id: UST_CONSTRUCTION_UUID })).rejects.toThrow(
        'logged in'
      );
    });

    it('throws NOT_FOUND for inactive user set type', async () => {
      const inactiveUserSetType = createMockUserSetType({ is_active: false });

      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: null, error: { message: 'Not found' } }) as ReturnType<
          typeof supabaseModule.forsured
        >
      );

      const ctx = createContext(MANAGER_USER_UUID);
      const caller = userSetTypesRouter.createCaller(ctx);

      await expect(caller.getByIdWithLexicon({ id: UST_CONSTRUCTION_UUID })).rejects.toThrow(
        'User set type not found or inactive'
      );
    });

    it('throws NOT_FOUND for non-existent ID', async () => {
      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: null, error: { message: 'Not found' } }) as ReturnType<
          typeof supabaseModule.forsured
        >
      );

      const ctx = createContext(MANAGER_USER_UUID);
      const caller = userSetTypesRouter.createCaller(ctx);

      await expect(
        caller.getByIdWithLexicon({ id: '00000000-0000-4000-a000-000000000000' })
      ).rejects.toThrow('User set type not found or inactive');
    });

    it('validates UUID format for id parameter', async () => {
      const ctx = createContext(MANAGER_USER_UUID);
      const caller = userSetTypesRouter.createCaller(ctx);

      await expect(caller.getByIdWithLexicon({ id: 'invalid-id' })).rejects.toThrow(
        'ID must be a valid UUID'
      );
    });
  });

  // ==================== Admin Endpoint Tests ====================

  describe('Admin Endpoints', () => {
    const setupAdminMock = () => {
      const adminProfile = createMockAdminProfile();
      vi.mocked(supabaseModule.forsured).mockImplementation((tableName: string) => {
        if (tableName === 'user_profiles') {
          return createChainableMock({ data: adminProfile, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        }
        return createChainableMock({ data: [], error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >;
      });
    };

    const setupNonAdminMock = () => {
      const managerProfile = createMockUserProfile();
      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: managerProfile, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >
      );
    };

    describe('list', () => {
      it('returns all user set types for admin', async () => {
        const adminProfile = createMockAdminProfile();
        const mockTypes = [
          createMockUserSetType(),
          createMockUserSetType({
            id: UST_PROPERTY_UUID,
            name: 'Property Management',
            is_active: false,
          }),
        ];

        let callCount = 0;
        vi.mocked(supabaseModule.forsured).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // Admin check
            return createChainableMock({ data: adminProfile, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          if (callCount === 2) {
            // User set types list
            return createChainableMock({ data: mockTypes, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          // User profiles count
          return createChainableMock({ data: [], error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        });

        const ctx = createContext(ADMIN_USER_UUID);
        const caller = userSetTypesRouter.createCaller(ctx);

        const result = await caller.list();

        expect(result).toHaveLength(2);
        expect(result.some((t) => !t.isActive)).toBe(true);
      });

      it('throws FORBIDDEN for non-admin users', async () => {
        setupNonAdminMock();

        const ctx = createContext(MANAGER_USER_UUID);
        const caller = userSetTypesRouter.createCaller(ctx);

        await expect(caller.list()).rejects.toThrow('Admin access required');
      });

      it('includes user count for each type', async () => {
        const adminProfile = createMockAdminProfile();
        const mockTypes = [createMockUserSetType()];
        const mockProfiles = [
          { user_set_type_id: UST_CONSTRUCTION_UUID },
          { user_set_type_id: UST_CONSTRUCTION_UUID },
          { user_set_type_id: UST_CONSTRUCTION_UUID },
        ];

        let callCount = 0;
        vi.mocked(supabaseModule.forsured).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return createChainableMock({ data: adminProfile, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          if (callCount === 2) {
            return createChainableMock({ data: mockTypes, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          return createChainableMock({ data: mockProfiles, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        });

        const ctx = createContext(ADMIN_USER_UUID);
        const caller = userSetTypesRouter.createCaller(ctx);

        const result = await caller.list();

        expect(result[0].userCount).toBe(3);
      });
    });

    describe('get', () => {
      it('returns user set type with lexicon entries', async () => {
        const adminProfile = createMockAdminProfile();
        const mockType = createMockUserSetType();
        const mockLexiconEntries = [
          { key: 'nav.dashboard', value: 'Dashboard', category: 'navigation' },
          { key: 'nav.contractors', value: 'Subs', category: 'navigation' },
        ];

        let callCount = 0;
        vi.mocked(supabaseModule.forsured).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return createChainableMock({ data: adminProfile, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          if (callCount === 2) {
            return createChainableMock({ data: mockType, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          return createChainableMock({ data: mockLexiconEntries, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        });

        const ctx = createContext(ADMIN_USER_UUID);
        const caller = userSetTypesRouter.createCaller(ctx);

        const result = await caller.get({ id: UST_CONSTRUCTION_UUID });

        expect(result.id).toBe(UST_CONSTRUCTION_UUID);
        expect(result.lexiconEntries).toHaveLength(2);
      });

      it('throws NOT_FOUND for non-existent ID', async () => {
        const adminProfile = createMockAdminProfile();

        let callCount = 0;
        vi.mocked(supabaseModule.forsured).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return createChainableMock({ data: adminProfile, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          return createChainableMock({ data: null, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        });

        const ctx = createContext(ADMIN_USER_UUID);
        const caller = userSetTypesRouter.createCaller(ctx);

        await expect(caller.get({ id: '00000000-0000-0000-0000-000000000000' })).rejects.toThrow(
          'User set type not found'
        );
      });
    });

    describe('create', () => {
      it('creates new user set type successfully', async () => {
        const adminProfile = createMockAdminProfile();
        const newType = createMockUserSetType({
          id: 'new-uuid',
          name: 'Facilities Management',
          slug: 'facilities-management',
        });

        let callCount = 0;
        vi.mocked(supabaseModule.forsured).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return createChainableMock({ data: adminProfile, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          return createChainableMock({ data: newType, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        });

        const ctx = createContext(ADMIN_USER_UUID);
        const caller = userSetTypesRouter.createCaller(ctx);

        const result = await caller.create({
          name: 'Facilities Management',
          slug: 'facilities-management',
          managerLabelSingular: 'Facility Manager',
          managerLabelPlural: 'Facility Managers',
          contractorLabelSingular: 'Contractor',
          contractorLabelPlural: 'Contractors',
        });

        expect(result.name).toBe('Facilities Management');
      });

      it('throws CONFLICT for duplicate name', async () => {
        const adminProfile = createMockAdminProfile();

        let callCount = 0;
        vi.mocked(supabaseModule.forsured).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return createChainableMock({ data: adminProfile, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          return createChainableMock({
            data: null,
            error: { code: '23505', message: 'duplicate key value violates unique constraint name' },
          }) as ReturnType<typeof supabaseModule.forsured>;
        });

        const ctx = createContext(ADMIN_USER_UUID);
        const caller = userSetTypesRouter.createCaller(ctx);

        await expect(
          caller.create({
            name: 'Construction',
            slug: 'construction-2',
            managerLabelSingular: 'GC',
            managerLabelPlural: 'GCs',
            contractorLabelSingular: 'Sub',
            contractorLabelPlural: 'Subs',
          })
        ).rejects.toThrow('A user set type with this name already exists');
      });

      it('throws CONFLICT for duplicate slug', async () => {
        const adminProfile = createMockAdminProfile();

        let callCount = 0;
        vi.mocked(supabaseModule.forsured).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return createChainableMock({ data: adminProfile, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          return createChainableMock({
            data: null,
            error: { code: '23505', message: 'duplicate key value violates unique constraint slug' },
          }) as ReturnType<typeof supabaseModule.forsured>;
        });

        const ctx = createContext(ADMIN_USER_UUID);
        const caller = userSetTypesRouter.createCaller(ctx);

        await expect(
          caller.create({
            name: 'Construction 2',
            slug: 'construction',
            managerLabelSingular: 'GC',
            managerLabelPlural: 'GCs',
            contractorLabelSingular: 'Sub',
            contractorLabelPlural: 'Subs',
          })
        ).rejects.toThrow('A user set type with this slug already exists');
      });
    });

    describe('update', () => {
      it('updates user set type successfully', async () => {
        const adminProfile = createMockAdminProfile();
        const updatedType = createMockUserSetType({ name: 'Updated Name' });

        let callCount = 0;
        vi.mocked(supabaseModule.forsured).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return createChainableMock({ data: adminProfile, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          return createChainableMock({ data: updatedType, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        });

        const ctx = createContext(ADMIN_USER_UUID);
        const caller = userSetTypesRouter.createCaller(ctx);

        const result = await caller.update({
          id: UST_CONSTRUCTION_UUID,
          name: 'Updated Name',
        });

        expect(result.name).toBe('Updated Name');
      });

      it('throws NOT_FOUND for non-existent type', async () => {
        const adminProfile = createMockAdminProfile();

        let callCount = 0;
        vi.mocked(supabaseModule.forsured).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return createChainableMock({ data: adminProfile, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          return createChainableMock({ data: null, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        });

        const ctx = createContext(ADMIN_USER_UUID);
        const caller = userSetTypesRouter.createCaller(ctx);

        await expect(
          caller.update({
            id: '00000000-0000-0000-0000-000000000000',
            name: 'Updated Name',
          })
        ).rejects.toThrow('User set type not found');
      });
    });

    describe('delete', () => {
      it('deletes user set type with no users', async () => {
        const adminProfile = createMockAdminProfile();

        let callCount = 0;
        vi.mocked(supabaseModule.forsured).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return createChainableMock({ data: adminProfile, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          if (callCount === 2) {
            // Check for users - return empty
            return createChainableMock({ data: [], error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          // Delete
          return createChainableMock({ data: null, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        });

        const ctx = createContext(ADMIN_USER_UUID);
        const caller = userSetTypesRouter.createCaller(ctx);

        const result = await caller.delete({ id: UST_PROPERTY_UUID });

        expect(result.success).toBe(true);
      });

      it('throws PRECONDITION_FAILED when users exist', async () => {
        const adminProfile = createMockAdminProfile();

        let callCount = 0;
        vi.mocked(supabaseModule.forsured).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return createChainableMock({ data: adminProfile, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          // Check for users - return some users
          return createChainableMock({ data: [{ id: 'user-1' }], error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        });

        const ctx = createContext(ADMIN_USER_UUID);
        const caller = userSetTypesRouter.createCaller(ctx);

        await expect(caller.delete({ id: UST_CONSTRUCTION_UUID })).rejects.toThrow(
          'Cannot delete user set type with active users'
        );
      });
    });

    describe('updateLexicon', () => {
      it('updates lexicon entries successfully', async () => {
        const adminProfile = createMockAdminProfile();

        let callCount = 0;
        vi.mocked(supabaseModule.forsured).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return createChainableMock({ data: adminProfile, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          return createChainableMock({ data: null, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        });

        const ctx = createContext(ADMIN_USER_UUID);
        const caller = userSetTypesRouter.createCaller(ctx);

        const result = await caller.updateLexicon({
          userSetTypeId: UST_CONSTRUCTION_UUID,
          entries: [
            { key: 'nav.dashboard', value: 'Home', category: 'navigation' },
            { key: 'nav.contractors', value: 'Subcontractors', category: 'navigation' },
          ],
        });

        expect(result.success).toBe(true);
        expect(result.entriesUpdated).toBe(2);
      });
    });

    describe('exportLexicon', () => {
      it('exports lexicon as JSON', async () => {
        const adminProfile = createMockAdminProfile();
        const mockType = createMockUserSetType();

        let callCount = 0;
        vi.mocked(supabaseModule.forsured).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return createChainableMock({ data: adminProfile, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          return createChainableMock({ data: mockType, error: null }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        });

        const ctx = createContext(ADMIN_USER_UUID);
        const caller = userSetTypesRouter.createCaller(ctx);

        const result = await caller.exportLexicon({ userSetTypeId: UST_CONSTRUCTION_UUID });

        expect(result.slug).toBe('construction');
        expect(result.lexicon).toBeDefined();
        expect(result.lexicon['nav.dashboard']).toBe('Dashboard');
      });

      it('throws NOT_FOUND for non-existent type', async () => {
        const adminProfile = createMockAdminProfile();

        let callCount = 0;
        vi.mocked(supabaseModule.forsured).mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return createChainableMock({ data: adminProfile, error: null }) as ReturnType<
              typeof supabaseModule.forsured
            >;
          }
          return createChainableMock({ data: null, error: { message: 'Not found' } }) as ReturnType<
            typeof supabaseModule.forsured
          >;
        });

        const ctx = createContext(ADMIN_USER_UUID);
        const caller = userSetTypesRouter.createCaller(ctx);

        await expect(
          caller.exportLexicon({ userSetTypeId: '00000000-0000-0000-0000-000000000000' })
        ).rejects.toThrow('User set type not found');
      });
    });
  });

  // ==================== Input Validation Tests ====================

  describe('Input Validation', () => {
    it('rejects invalid UUID for get', async () => {
      const ctx = createContext(ADMIN_USER_UUID);
      const caller = userSetTypesRouter.createCaller(ctx);

      await expect(caller.get({ id: 'invalid-uuid' })).rejects.toThrow();
    });

    it('rejects invalid slug format for create', async () => {
      const adminProfile = createMockAdminProfile();
      vi.mocked(supabaseModule.forsured).mockReturnValue(
        createChainableMock({ data: adminProfile, error: null }) as ReturnType<
          typeof supabaseModule.forsured
        >
      );

      const ctx = createContext(ADMIN_USER_UUID);
      const caller = userSetTypesRouter.createCaller(ctx);

      await expect(
        caller.create({
          name: 'Test',
          slug: 'Invalid Slug!', // Invalid - has uppercase and special chars
          managerLabelSingular: 'Manager',
          managerLabelPlural: 'Managers',
          contractorLabelSingular: 'Contractor',
          contractorLabelPlural: 'Contractors',
        })
      ).rejects.toThrow();
    });

    it('rejects empty name for create', async () => {
      const ctx = createContext(ADMIN_USER_UUID);
      const caller = userSetTypesRouter.createCaller(ctx);

      await expect(
        caller.create({
          name: '',
          slug: 'test',
          managerLabelSingular: 'Manager',
          managerLabelPlural: 'Managers',
          contractorLabelSingular: 'Contractor',
          contractorLabelPlural: 'Contractors',
        })
      ).rejects.toThrow();
    });
  });
});
