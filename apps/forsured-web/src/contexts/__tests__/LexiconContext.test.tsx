/**
 * Lexicon Context Tests
 * REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
 * TASK-13: Write comprehensive test suite for user set type system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { LexiconProvider, useLexicon, DEFAULT_LEXICON } from '../LexiconContext';
import type { ReactNode } from 'react';

// Mock the trpc client
vi.mock('../../lib/trpc', () => ({
  trpc: {
    userSetTypes: {
      getUserLexicon: {
        useQuery: vi.fn(),
      },
      // TASK-14: Mock for broker context switching
      getByIdWithLexicon: {
        useQuery: vi.fn(),
      },
    },
  },
}));

// Import the mocked trpc after mocking
import { trpc } from '../../lib/trpc';

// Mock user set type data
const createMockUserSetType = (overrides = {}) => ({
  id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  name: 'Construction',
  slug: 'construction',
  managerLabelSingular: 'General Contractor',
  managerLabelPlural: 'General Contractors',
  contractorLabelSingular: 'Subcontractor',
  contractorLabelPlural: 'Subcontractors',
  description: 'Construction industry vertical',
  isActive: true,
  ...overrides,
});

// Mock Property Management user set type
const createPropertyManagementType = () => ({
  id: 'a987fbc9-4bed-3078-cf07-9141ba07c9f3',
  name: 'Property Management',
  slug: 'property-management',
  managerLabelSingular: 'Property Manager',
  managerLabelPlural: 'Property Managers',
  contractorLabelSingular: 'Contractor',
  contractorLabelPlural: 'Contractors',
  description: 'Property management industry vertical',
  isActive: true,
});

// Wrapper component for testing
function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <LexiconProvider>{children}</LexiconProvider>;
  };
}

describe('LexiconContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // TASK-14: Default mock for getByIdWithLexicon (override query)
    vi.mocked(trpc.userSetTypes.getByIdWithLexicon.useQuery).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof trpc.userSetTypes.getByIdWithLexicon.useQuery>);
  });

  describe('DEFAULT_LEXICON', () => {
    it('contains all expected navigation keys', () => {
      expect(DEFAULT_LEXICON['nav.dashboard']).toBe('Dashboard');
      expect(DEFAULT_LEXICON['nav.tasks']).toBe('Tasks');
      expect(DEFAULT_LEXICON['nav.projects']).toBe('Projects');
      expect(DEFAULT_LEXICON['nav.contractors']).toBe('Subs');
      expect(DEFAULT_LEXICON['nav.documents']).toBe('Documents');
      expect(DEFAULT_LEXICON['nav.managers']).toBe('GCs');
    });

    it('contains all expected onboarding keys', () => {
      expect(DEFAULT_LEXICON['onboarding.welcome_manager']).toBe('Welcome, General Contractor');
      expect(DEFAULT_LEXICON['onboarding.welcome_contractor']).toBe('Welcome, Subcontractor');
      expect(DEFAULT_LEXICON['onboarding.company_name']).toBe('Company Name');
    });

    it('contains all expected role display keys', () => {
      expect(DEFAULT_LEXICON['role.manager_view']).toBe('GC View');
      expect(DEFAULT_LEXICON['role.contractor']).toBe('Subcontractor');
      expect(DEFAULT_LEXICON['role.broker']).toBe('Broker');
    });
  });

  describe('useLexicon hook', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useLexicon());
      }).toThrow('useLexicon must be used within a LexiconProvider');

      consoleSpy.mockRestore();
    });

    it('returns context value when used within provider', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: null,
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.t).toBeDefined();
      expect(result.current.lexicon).toBeDefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });
  });

  describe('t() translation function', () => {
    it('returns value from user lexicon when available', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {
            'nav.contractors': 'Subcontractors',
          },
          userSetType: createMockUserSetType(),
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.t('nav.contractors')).toBe('Subcontractors');
    });

    it('falls back to DEFAULT_LEXICON when key not in user lexicon', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: createMockUserSetType(),
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.t('nav.dashboard')).toBe('Dashboard');
    });

    it('uses provided fallback when key not found anywhere', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: null,
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.t('nonexistent.key', 'Fallback Value')).toBe('Fallback Value');
    });

    it('returns key itself when no value or fallback found', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: null,
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.t('completely.unknown.key')).toBe('completely.unknown.key');
    });

    it('user lexicon values override DEFAULT_LEXICON', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {
            'nav.contractors': 'Contractors', // Override the 'Subs' default
          },
          userSetType: createPropertyManagementType(),
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.t('nav.contractors')).toBe('Contractors');
    });
  });

  describe('getManagerLabel', () => {
    it('returns singular manager label by default', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: createMockUserSetType(),
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.getManagerLabel()).toBe('General Contractor');
    });

    it('returns plural manager label when requested', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: createMockUserSetType(),
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.getManagerLabel(true)).toBe('General Contractors');
    });

    it('returns default Construction labels when no user set type', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: null,
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.getManagerLabel()).toBe('General Contractor');
      expect(result.current.getManagerLabel(true)).toBe('General Contractors');
    });

    it('returns Property Management labels when that type is selected', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: createPropertyManagementType(),
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.getManagerLabel()).toBe('Property Manager');
      expect(result.current.getManagerLabel(true)).toBe('Property Managers');
    });
  });

  describe('getContractorLabel', () => {
    it('returns singular contractor label by default', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: createMockUserSetType(),
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.getContractorLabel()).toBe('Subcontractor');
    });

    it('returns plural contractor label when requested', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: createMockUserSetType(),
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.getContractorLabel(true)).toBe('Subcontractors');
    });

    it('returns default Construction labels when no user set type', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: null,
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.getContractorLabel()).toBe('Subcontractor');
      expect(result.current.getContractorLabel(true)).toBe('Subcontractors');
    });

    it('returns Property Management labels when that type is selected', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: createPropertyManagementType(),
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.getContractorLabel()).toBe('Contractor');
      expect(result.current.getContractorLabel(true)).toBe('Contractors');
    });
  });

  describe('loading and error states', () => {
    it('indicates loading state', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('indicates error state', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isError).toBe(true);
    });

    it('uses DEFAULT_LEXICON during loading', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      // Should still return defaults during loading
      expect(result.current.t('nav.dashboard')).toBe('Dashboard');
    });
  });

  describe('refetch', () => {
    it('exposes refetch function that invokes user lexicon refetch', () => {
      const mockRefetch = vi.fn();
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: null,
        },
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.refetch).toBeDefined();
      expect(typeof result.current.refetch).toBe('function');

      // TASK-14: refetch is now wrapped in useCallback, so call it to verify
      result.current.refetch();
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('lexicon object', () => {
    it('provides full lexicon object', () => {
      const customLexicon = {
        'nav.contractors': 'Contractors',
        'nav.managers': 'Property Managers',
      };

      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: customLexicon,
          userSetType: createPropertyManagementType(),
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      // Should include both user lexicon and defaults
      expect(result.current.lexicon['nav.contractors']).toBe('Contractors');
      expect(result.current.lexicon['nav.managers']).toBe('Property Managers');
      expect(result.current.lexicon['nav.dashboard']).toBe('Dashboard'); // From defaults
    });
  });

  describe('userSetType', () => {
    it('provides user set type information', () => {
      const userSetType = createMockUserSetType();

      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType,
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.userSetType).toEqual(userSetType);
      expect(result.current.userSetType?.name).toBe('Construction');
    });

    it('returns null for broker/admin users', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: null,
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.userSetType).toBeNull();
    });
  });

  // TASK-14: Broker Context Switching Tests
  describe('broker context switching', () => {
    it('exposes setOverrideUserSetType function', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: null,
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.setOverrideUserSetType).toBeDefined();
      expect(typeof result.current.setOverrideUserSetType).toBe('function');
    });

    it('exposes overrideUserSetTypeId with initial null value', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: null,
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.overrideUserSetTypeId).toBeNull();
    });

    it('exposes isUsingOverride with initial false value', () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: null,
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isUsingOverride).toBe(false);
    });

    it('updates overrideUserSetTypeId when setOverrideUserSetType is called', async () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: null,
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      const testId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
      result.current.setOverrideUserSetType(testId);

      await waitFor(() => {
        expect(result.current.overrideUserSetTypeId).toBe(testId);
      });
    });

    it('clears override when setOverrideUserSetType is called with null', async () => {
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: null,
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      // Set an override
      const testId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
      result.current.setOverrideUserSetType(testId);

      await waitFor(() => {
        expect(result.current.overrideUserSetTypeId).toBe(testId);
      });

      // Clear the override
      result.current.setOverrideUserSetType(null);

      await waitFor(() => {
        expect(result.current.overrideUserSetTypeId).toBeNull();
      });
    });

    it('uses override lexicon when override data is available', async () => {
      const overrideUserSetType = createPropertyManagementType();
      const overrideLexicon = {
        'nav.contractors': 'Contractors',
        'nav.managers': 'Property Managers',
      };

      // User lexicon (broker with no user set type)
      vi.mocked(trpc.userSetTypes.getUserLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: {},
          userSetType: null,
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as ReturnType<typeof trpc.userSetTypes.getUserLexicon.useQuery>);

      // Override lexicon (Property Management)
      vi.mocked(trpc.userSetTypes.getByIdWithLexicon.useQuery).mockReturnValue({
        data: {
          lexicon: overrideLexicon,
          userSetType: overrideUserSetType,
        },
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof trpc.userSetTypes.getByIdWithLexicon.useQuery>);

      const { result } = renderHook(() => useLexicon(), {
        wrapper: createWrapper(),
      });

      // Set override
      result.current.setOverrideUserSetType(overrideUserSetType.id);

      await waitFor(() => {
        expect(result.current.isUsingOverride).toBe(true);
        expect(result.current.t('nav.contractors')).toBe('Contractors');
        expect(result.current.getContractorLabel()).toBe('Contractor');
        expect(result.current.getManagerLabel()).toBe('Property Manager');
      });
    });
  });
});
