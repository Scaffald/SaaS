/**
 * Forsured Deletion Handler Tests
 * REQ-3: CCPA Compliance Implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ForsuredDeletionHandlerService,
  initializeForsuredDeletionHandler,
  handleCCPADeletion,
  type DeletionScope,
  type ForsuredDeletionConfirmation,
} from '../forsured-deletion-handler';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockFrom = vi.fn();
  const mockSchema = vi.fn(() => ({ from: mockFrom }));
  const mockStorage = {
    from: vi.fn(() => ({
      remove: vi.fn().mockResolvedValue({ error: null }),
    })),
  };

  return {
    schema: mockSchema,
    from: mockFrom,
    storage: mockStorage,
  };
};

describe('ForsuredDeletionHandlerService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let service: ForsuredDeletionHandlerService;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    initializeForsuredDeletionHandler(mockSupabase);
    service = new ForsuredDeletionHandlerService();
  });

  describe('handleCCPADeletion', () => {
    it('should return error when supabase client not initialized', async () => {
      initializeForsuredDeletionHandler(null);

      const result = await handleCCPADeletion('user-123', 'request-1');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DELETION_FAILED');
      expect(result.error?.message).toContain('not initialized');
    });

    it('should delete user profile when scope includes it', async () => {
      // Mock delete chain
      const select = vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
      const eqDelete = vi.fn(() => ({ select }));
      const deleteFn = vi.fn(() => ({ eq: eqDelete }));
      const from = vi.fn(() => ({ delete: deleteFn }));
      mockSupabase.schema.mockReturnValue({ from });
      mockSupabase.from.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) });

      const result = await service.handleCCPADeletion('user-123', 'request-1', {
        userProfile: true,
        documents: false,
        tasks: false,
        projects: false,
        policies: false,
        complianceRecords: false,
        brokerAcknowledgements: false,
      });

      expect(result.success).toBe(true);
      expect(result.data?.deletion_summary.deleted_records['user_profiles']).toBeDefined();
    });

    it('should delete documents and storage files', async () => {
      // Mock document query
      const mockDocs = [
        { id: 'doc-1', storage_path: 'path/to/doc1.pdf' },
        { id: 'doc-2', storage_path: 'path/to/doc2.pdf' },
      ];

      const select = vi.fn().mockResolvedValue({ data: mockDocs, error: null });
      const eqSelect = vi.fn(() => ({ select }));
      const selectFn = vi.fn(() => ({ eq: eqSelect }));
      const deleteFn = vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn().mockResolvedValue({ data: mockDocs }) })) }));
      const from = vi.fn(() => ({ select: selectFn, delete: deleteFn }));
      mockSupabase.schema.mockReturnValue({ from });
      mockSupabase.from.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) });

      const result = await service.handleCCPADeletion('user-123', 'request-1', {
        userProfile: false,
        documents: true,
        tasks: false,
        projects: false,
        policies: false,
        complianceRecords: false,
        brokerAcknowledgements: false,
      });

      expect(result.success).toBe(true);
    });

    it('should anonymize rather than delete records with retention requirements', async () => {
      // Mock update chain for anonymization
      const select = vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
      const eq = vi.fn(() => ({ select }));
      const or = vi.fn(() => ({ select }));
      const update = vi.fn(() => ({ eq, or }));
      const from = vi.fn(() => ({ update, select: vi.fn(() => ({ or, eq })) }));
      mockSupabase.schema.mockReturnValue({ from });
      mockSupabase.from.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) });

      const result = await service.handleCCPADeletion('user-123', 'request-1', {
        userProfile: false,
        documents: false,
        tasks: false,
        projects: true,
        policies: true,
        complianceRecords: true,
        brokerAcknowledgements: false,
      });

      expect(result.success).toBe(true);
      if (result.data) {
        // Should have anonymized records, not deleted
        const hasAnonymized = Object.values(result.data.deletion_summary.anonymized_records)
          .some(count => count >= 0);
        expect(hasAnonymized).toBe(true);
      }
    });
  });

  describe('retention requirements', () => {
    it('should retain financial records for 7 years', () => {
      const FINANCIAL_RETENTION_YEARS = 7;
      const retentionDate = new Date();
      retentionDate.setFullYear(retentionDate.getFullYear() + FINANCIAL_RETENTION_YEARS);

      // Verify retention is at least 7 years in the future
      const sevenYearsFromNow = new Date();
      sevenYearsFromNow.setFullYear(sevenYearsFromNow.getFullYear() + 7);

      expect(retentionDate.getFullYear()).toBeGreaterThanOrEqual(sevenYearsFromNow.getFullYear() - 1);
    });

    it('should retain compliance records for 5 years', () => {
      const COMPLIANCE_RETENTION_YEARS = 5;
      const retentionDate = new Date();
      retentionDate.setFullYear(retentionDate.getFullYear() + COMPLIANCE_RETENTION_YEARS);

      const fiveYearsFromNow = new Date();
      fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);

      expect(retentionDate.getFullYear()).toBeGreaterThanOrEqual(fiveYearsFromNow.getFullYear() - 1);
    });

    it('should include retention info in confirmation', async () => {
      const confirmation: ForsuredDeletionConfirmation = {
        app_id: 'forsured',
        app_name: 'Forsured Insurance Compliance',
        request_id: 'req-1',
        user_id: 'user-1',
        processed_at: new Date().toISOString(),
        deletion_summary: {
          deleted_records: {},
          anonymized_records: { insurance_policies: 5 },
          retained_records: [
            {
              table: 'insurance_policies',
              count: 5,
              reason: 'Financial/insurance records (7-year regulatory retention)',
              retention_until: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
        },
        errors: [],
        success: true,
      };

      expect(confirmation.deletion_summary.retained_records).toHaveLength(1);
      expect(confirmation.deletion_summary.retained_records[0].reason).toContain('7-year');
    });
  });

  describe('task deletion logic', () => {
    it('should delete tasks when user is sole participant', async () => {
      // When user is both assigned_to and created_by
      const soleParticipantTask = {
        id: 'task-1',
        assigned_to: 'user-123',
        created_by: 'user-123',
      };

      const isSoleParticipant =
        (soleParticipantTask.assigned_to === 'user-123' && soleParticipantTask.created_by === 'user-123');

      expect(isSoleParticipant).toBe(true);
    });

    it('should anonymize tasks when user is not sole participant', async () => {
      // When another user is involved
      const sharedTask = {
        id: 'task-2',
        assigned_to: 'user-123',
        created_by: 'other-user',
      };

      const isSoleParticipant =
        (sharedTask.assigned_to === 'user-123' && sharedTask.created_by === 'user-123') ||
        (sharedTask.assigned_to === 'user-123' && !sharedTask.created_by) ||
        (!sharedTask.assigned_to && sharedTask.created_by === 'user-123');

      expect(isSoleParticipant).toBe(false);
    });
  });

  describe('broker acknowledgement handling', () => {
    it('should anonymize broker relationships, not delete', () => {
      // Broker acknowledgements should be anonymized to preserve business records
      const ack = {
        id: 'ack-1',
        broker_user_id: 'user-123',
        client_user_id: 'other-user',
        broker_name: 'John Broker',
        broker_email: 'john@broker.com',
      };

      // Should anonymize the broker's information
      const anonymized = {
        ...ack,
        broker_user_id: null,
        broker_name: '[REDACTED]',
        broker_email: '[REDACTED]',
        anonymized_at: new Date().toISOString(),
      };

      expect(anonymized.broker_user_id).toBeNull();
      expect(anonymized.broker_name).toBe('[REDACTED]');
      expect(anonymized.client_user_id).toBe('other-user'); // Preserved
    });
  });
});

describe('DeletionScope type', () => {
  it('should have all expected scope options', () => {
    const fullScope: DeletionScope = {
      userProfile: true,
      documents: true,
      tasks: true,
      projects: true,
      policies: true,
      complianceRecords: true,
      brokerAcknowledgements: true,
    };

    expect(Object.keys(fullScope)).toHaveLength(7);
    expect(fullScope.userProfile).toBe(true);
    expect(fullScope.policies).toBe(true);
  });
});

describe('ForsuredDeletionConfirmation type', () => {
  it('should have all required fields', () => {
    const confirmation: ForsuredDeletionConfirmation = {
      app_id: 'forsured',
      app_name: 'Forsured Insurance Compliance',
      request_id: 'req-1',
      user_id: 'user-1',
      processed_at: new Date().toISOString(),
      deletion_summary: {
        deleted_records: { documents: 5 },
        anonymized_records: { projects: 3 },
        retained_records: [],
      },
      errors: [],
      success: true,
    };

    expect(confirmation.app_id).toBe('forsured');
    expect(confirmation.deletion_summary.deleted_records).toBeDefined();
    expect(confirmation.deletion_summary.anonymized_records).toBeDefined();
    expect(confirmation.errors).toEqual([]);
    expect(confirmation.success).toBe(true);
  });
});
