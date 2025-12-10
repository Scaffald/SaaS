/**
 * Unit Tests for useComplianceFlags Hook
 * REQ-269: Policy & Endorsement Level Flags
 *
 * Tests the compliance flags hook functionality with mock data.
 */

import { describe, it, expect, beforeEach, vi, afterEach, Mock } from 'vitest';
import { renderHook, waitFor, act } from '@/test/test-utils';
import { ReactNode } from 'react';
import { ComplianceFlag, FlaggableEntityType, ComplianceFlagType } from '../../types';

// Mock the database context to use mock data
vi.mock('../../contexts/DatabaseContext', () => ({
  useDatabase: () => ({
    useMockData: true,
    isInitialized: true,
  }),
}));

// Mock the supabase client
vi.mock('../../lib/supabase', () => ({
  supabaseServiceRole: null,
  forsured: vi.fn(),
}));

// Import after mocks are set up
import { useComplianceFlags } from '../useComplianceFlags';
import MockDatabase from '../../utils/mockDataStore';
import { UserProvider } from '../../contexts/UserContext';

// Wrapper for hooks that need UserContext
const wrapper = ({ children }: { children: ReactNode }) => (
  <UserProvider>{children}</UserProvider>
);

// Test data
const TEST_PROJECT_ID = 'project-test-001';

describe('useComplianceFlags Hook', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Clear mock database before each test
    try {
      const flags = await MockDatabase.query<ComplianceFlag>('compliance_flags', {});
      for (const flag of flags) {
        await MockDatabase.delete('compliance_flags', flag.id);
      }
    } catch {
      // Database might be empty, ignore
    }
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Validation', () => {
    it('should reject invalid entity_type', async () => {
      const { result } = renderHook(() => useComplianceFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Attempt to create flag with invalid entity_type
      await expect(
        result.current.createFlag({
          entity_type: 'invalid_type' as FlaggableEntityType,
          entity_id: 'test-123',
          flag_type: 'coverage_gap',
          title: 'Test flag',
        })
      ).rejects.toThrow('Invalid entity_type. Must be one of: policy, provision, endorsement');
    });

    it('should reject missing entity_id', async () => {
      const { result } = renderHook(() => useComplianceFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.createFlag({
          entity_type: 'policy',
          entity_id: '',
          flag_type: 'coverage_gap',
          title: 'Test flag',
        })
      ).rejects.toThrow('entity_id is required');
    });

    it('should reject missing flag_type', async () => {
      const { result } = renderHook(() => useComplianceFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.createFlag({
          entity_type: 'policy',
          entity_id: 'test-123',
          flag_type: '' as ComplianceFlagType,
          title: 'Test flag',
        })
      ).rejects.toThrow('flag_type is required');
    });

    it('should reject missing title', async () => {
      const { result } = renderHook(() => useComplianceFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.createFlag({
          entity_type: 'policy',
          entity_id: 'test-123',
          flag_type: 'coverage_gap',
          title: '',
        })
      ).rejects.toThrow('title is required');
    });
  });

  describe('CRUD Operations', () => {
    it('should create a flag for policy entity', async () => {
      const { result } = renderHook(() => useComplianceFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newFlag = {
        entity_type: 'policy' as FlaggableEntityType,
        entity_id: 'new-policy-123',
        flag_type: 'coverage_gap' as ComplianceFlagType,
        severity: 'critical' as const,
        title: 'New policy flag',
        description: 'Test coverage gap',
        project_id: TEST_PROJECT_ID,
      };

      let createdFlag: ComplianceFlag | undefined;

      await act(async () => {
        createdFlag = await result.current.createFlag(newFlag);
      });

      expect(createdFlag).toBeDefined();
      expect(createdFlag!.id).toBeDefined();
      expect(createdFlag!.entity_type).toBe('policy');
      expect(createdFlag!.entity_id).toBe('new-policy-123');
      expect(createdFlag!.status).toBe('active');
      expect(createdFlag!.created_at).toBeDefined();
    });

    it('should create a flag for provision entity', async () => {
      const { result } = renderHook(() => useComplianceFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newFlag = {
        entity_type: 'provision' as FlaggableEntityType,
        entity_id: 'new-provision-456',
        flag_type: 'limit_insufficient' as ComplianceFlagType,
        severity: 'warning' as const,
        title: 'Provision limit flag',
        project_id: TEST_PROJECT_ID,
      };

      let createdFlag: ComplianceFlag | undefined;

      await act(async () => {
        createdFlag = await result.current.createFlag(newFlag);
      });

      expect(createdFlag).toBeDefined();
      expect(createdFlag!.entity_type).toBe('provision');
    });

    it('should create a flag for endorsement entity', async () => {
      const { result } = renderHook(() => useComplianceFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newFlag = {
        entity_type: 'endorsement' as FlaggableEntityType,
        entity_id: 'new-endorsement-789',
        flag_type: 'missing_endorsement' as ComplianceFlagType,
        severity: 'info' as const,
        title: 'Endorsement flag',
        project_id: TEST_PROJECT_ID,
      };

      let createdFlag: ComplianceFlag | undefined;

      await act(async () => {
        createdFlag = await result.current.createFlag(newFlag);
      });

      expect(createdFlag).toBeDefined();
      expect(createdFlag!.entity_type).toBe('endorsement');
    });

    it('should update a flag status', async () => {
      const { result } = renderHook(() => useComplianceFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First create a flag
      let createdFlag: ComplianceFlag | undefined;

      await act(async () => {
        createdFlag = await result.current.createFlag({
          entity_type: 'policy',
          entity_id: 'update-test-policy',
          flag_type: 'coverage_gap',
          title: 'Flag to update',
        });
      });

      expect(createdFlag).toBeDefined();

      // Update the flag
      let updatedFlag: ComplianceFlag | undefined;

      await act(async () => {
        updatedFlag = await result.current.updateFlag(createdFlag!.id, {
          status: 'acknowledged',
          description: 'Updated description',
        });
      });

      expect(updatedFlag).toBeDefined();
      expect(updatedFlag!.status).toBe('acknowledged');
      expect(updatedFlag!.description).toBe('Updated description');
    });

    it('should resolve a flag with notes', async () => {
      const { result } = renderHook(() => useComplianceFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First create a flag
      let createdFlag: ComplianceFlag | undefined;

      await act(async () => {
        createdFlag = await result.current.createFlag({
          entity_type: 'policy',
          entity_id: 'resolve-test-policy',
          flag_type: 'expired',
          title: 'Flag to resolve',
        });
      });

      // Resolve the flag
      let resolvedFlag: ComplianceFlag | undefined;

      await act(async () => {
        resolvedFlag = await result.current.resolveFlag(
          createdFlag!.id,
          'Issue has been addressed'
        );
      });

      expect(resolvedFlag).toBeDefined();
      expect(resolvedFlag!.status).toBe('resolved');
      expect(resolvedFlag!.resolution_notes).toBe('Issue has been addressed');
      expect(resolvedFlag!.resolved_at).toBeDefined();
    });

    it('should dismiss a flag', async () => {
      const { result } = renderHook(() => useComplianceFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First create a flag
      let createdFlag: ComplianceFlag | undefined;

      await act(async () => {
        createdFlag = await result.current.createFlag({
          entity_type: 'provision',
          entity_id: 'dismiss-test-provision',
          flag_type: 'limit_insufficient',
          title: 'Flag to dismiss',
        });
      });

      // Dismiss the flag
      let dismissedFlag: ComplianceFlag | undefined;

      await act(async () => {
        dismissedFlag = await result.current.dismissFlag(
          createdFlag!.id,
          'Not applicable'
        );
      });

      expect(dismissedFlag).toBeDefined();
      expect(dismissedFlag!.status).toBe('dismissed');
      expect(dismissedFlag!.resolution_notes).toBe('Not applicable');
    });
  });

  describe('Filtering', () => {
    it('should filter flags by entity type', async () => {
      const { result } = renderHook(() => useComplianceFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create flags of different types
      await act(async () => {
        await result.current.createFlag({
          entity_type: 'policy',
          entity_id: 'filter-policy-1',
          flag_type: 'coverage_gap',
          title: 'Policy flag',
        });
        await result.current.createFlag({
          entity_type: 'endorsement',
          entity_id: 'filter-endorsement-1',
          flag_type: 'missing_endorsement',
          title: 'Endorsement flag',
        });
      });

      // Fetch with filter
      let policyFlags: ComplianceFlag[] = [];

      await act(async () => {
        policyFlags = await result.current.getFlagsByEntity('policy', 'filter-policy-1');
      });

      expect(policyFlags.length).toBeGreaterThan(0);
      expect(policyFlags[0].entity_type).toBe('policy');
    });

    it('should get flags by entity', async () => {
      const { result } = renderHook(() => useComplianceFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create a flag for a specific entity
      await act(async () => {
        await result.current.createFlag({
          entity_type: 'policy',
          entity_id: 'specific-policy-id',
          flag_type: 'coverage_gap',
          title: 'Specific policy flag',
        });
      });

      // Get flags by entity
      let entityFlags: ComplianceFlag[] = [];

      await act(async () => {
        entityFlags = await result.current.getFlagsByEntity('policy', 'specific-policy-id');
      });

      expect(entityFlags.length).toBeGreaterThan(0);
      expect(entityFlags[0].entity_id).toBe('specific-policy-id');
    });

    it('should return empty array for entity with no flags', async () => {
      const { result } = renderHook(() => useComplianceFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let entityFlags: ComplianceFlag[] = [];

      await act(async () => {
        entityFlags = await result.current.getFlagsByEntity('policy', 'nonexistent-policy-id');
      });

      expect(entityFlags).toEqual([]);
    });
  });

  describe('Active Flags Count', () => {
    it('should count active flags for an entity', async () => {
      const { result } = renderHook(() => useComplianceFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create multiple flags for same entity
      const testEntityId = 'count-test-entity';

      await act(async () => {
        await result.current.createFlag({
          entity_type: 'policy',
          entity_id: testEntityId,
          flag_type: 'coverage_gap',
          title: 'Active flag 1',
        });

        await result.current.createFlag({
          entity_type: 'policy',
          entity_id: testEntityId,
          flag_type: 'limit_insufficient',
          title: 'Active flag 2',
        });
      });

      let count = 0;

      await act(async () => {
        count = await result.current.getActiveFlagsCount('policy', testEntityId);
      });

      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Default Values', () => {
    it('should set default severity to warning when not provided', async () => {
      const { result } = renderHook(() => useComplianceFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdFlag: ComplianceFlag | undefined;

      await act(async () => {
        createdFlag = await result.current.createFlag({
          entity_type: 'policy',
          entity_id: 'default-test-policy',
          flag_type: 'coverage_gap',
          title: 'Flag without severity',
          // Note: severity not provided
        });
      });

      expect(createdFlag).toBeDefined();
      expect(createdFlag!.severity).toBe('warning');
    });

    it('should set default status to active when creating', async () => {
      const { result } = renderHook(() => useComplianceFlags(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let createdFlag: ComplianceFlag | undefined;

      await act(async () => {
        createdFlag = await result.current.createFlag({
          entity_type: 'endorsement',
          entity_id: 'default-status-test',
          flag_type: 'missing_endorsement',
          title: 'Flag with default status',
        });
      });

      expect(createdFlag).toBeDefined();
      expect(createdFlag!.status).toBe('active');
    });
  });
});
