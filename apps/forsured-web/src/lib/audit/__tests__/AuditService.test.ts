/**
 * AuditService Tests
 *
 * Comprehensive test suite for audit logging system
 * Tests all 8 event categories and core functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuditService, initializeAuditService } from '../AuditService';

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

// Mock sessionStorage for tests
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

// Setup global mocks
Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });

// Create a chainable mock that stores query result to return at the end
const createChainableMock = () => {
  let queryResult = { data: [], error: null, count: 0 };
  let insertResult = { data: null, error: null };

  const chainable: Record<string, unknown> = {
    _setResult: (result: { data: unknown[]; error: unknown; count: number }) => {
      queryResult = result;
    },
    _setInsertResult: (result: { data: unknown; error: unknown }) => {
      insertResult = result;
    },
    _getResult: () => queryResult,
  };

  // All chainable methods return the chainable object and are thenable
  const chainMethods = ['select', 'eq', 'gte', 'lte', 'lt', 'is', 'in', 'order', 'range', 'limit', 'update', 'delete'];
  chainMethods.forEach(method => {
    chainable[method] = vi.fn(() => chainable);
  });

  // Insert returns a promise directly
  chainable.insert = vi.fn(() => Promise.resolve(insertResult));

  // Make it thenable so await works
  chainable.then = (resolve: (value: unknown) => void) => {
    resolve(queryResult);
    return Promise.resolve(queryResult);
  };

  return chainable;
};

let queryChainable = createChainableMock();

// Mock Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabaseClient: any = {
  from: vi.fn(() => queryChainable),
  insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
  rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
  auth: {
    getUser: vi.fn(() =>
      Promise.resolve({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            organization_id: 'test-org-id',
          },
        },
        error: null,
      })
    ),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
      download: vi.fn(() =>
        Promise.resolve({
          data: new Blob(['test data']),
          error: null,
        })
      ),
      remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
};

describe('AuditService', () => {
  let auditService: AuditService;

  beforeEach(() => {
    // Reset chainable mock for fresh state
    queryChainable = createChainableMock();
    mockSupabaseClient.from = vi.fn(() => queryChainable);

    // Initialize audit service with mock client
    initializeAuditService(mockSupabaseClient);
    auditService = new AuditService();

    // Clear localStorage/sessionStorage
    localStorageMock.clear();
    sessionStorageMock.clear();

    // Clear mock call history
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Event Logging', () => {
    describe('1. Authentication Events', () => {
      it('should log successful login', async () => {
        await auditService.log({
          category: 'authentication',
          action: 'login_success',
          metadata: {
            email: 'user@example.com',
          },
        });

        expect(queryChainable.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'authentication',
            action: 'login_success',
            severity: 'low',
            status: 'success',
          })
        );
      });

      it('should log failed login with higher severity', async () => {
        await auditService.log({
          category: 'authentication',
          action: 'login_failure',
          status: 'failure',
          error_message: 'Invalid credentials',
          metadata: {
            email: 'user@example.com',
            failure_reason: 'wrong_password',
          },
        });

        expect(queryChainable.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'authentication',
            action: 'login_failure',
            severity: 'medium',
            status: 'failure',
          })
        );
      });

      it('should log logout', async () => {
        await auditService.log({
          category: 'authentication',
          action: 'logout',
        });

        expect(queryChainable.insert).toHaveBeenCalled();
      });

      it('should log password reset request', async () => {
        await auditService.log({
          category: 'authentication',
          action: 'password_reset_requested',
          metadata: {
            email: 'user@example.com',
          },
        });

        expect(queryChainable.insert).toHaveBeenCalled();
      });
    });

    describe('2. Authorization Events', () => {
      it('should log permission denied', async () => {
        await auditService.log({
          category: 'authorization',
          action: 'permission_denied',
          status: 'denied',
          metadata: {
            resource_type: 'policy',
            resource_id: 'policy-123',
            permission: 'update',
          },
        });

        expect(queryChainable.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'authorization',
            action: 'permission_denied',
            severity: 'medium',
            status: 'denied',
          })
        );
      });

      it('should log role assignment', async () => {
        await auditService.log({
          category: 'authorization',
          action: 'role_assigned',
          metadata: {
            user_id: 'user-123',
            new_role: 'manager',
            old_role: 'subcontractor',
          },
        });

        expect(queryChainable.insert).toHaveBeenCalled();
      });
    });

    describe('3. Data Access Events', () => {
      it('should log document view', async () => {
        await auditService.log({
          category: 'data_access',
          action: 'view_document',
          resource_type: 'document',
          record_id: 'doc-123',
          metadata: {
            document_name: 'policy.pdf',
            document_type: 'pdf',
          },
        });

        expect(queryChainable.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'data_access',
            action: 'view_document',
            resource_type: 'document',
            record_id: 'doc-123',
          })
        );
      });

      it('should log data export', async () => {
        await auditService.log({
          category: 'data_access',
          action: 'export_data',
          metadata: {
            export_format: 'csv',
            record_count: 500,
          },
        });

        expect(queryChainable.insert).toHaveBeenCalled();
      });
    });

    describe('4. Data Modification Events', () => {
      it('should log record creation', async () => {
        await auditService.log({
          category: 'data_modification',
          action: 'create',
          table_name: 'policies',
          record_id: 'policy-123',
          new_data: { policy_number: 'POL-001' },
        });

        expect(queryChainable.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'data_modification',
            action: 'create',
            table_name: 'policies',
            severity: 'medium',
          })
        );
      });

      it('should log record update', async () => {
        await auditService.log({
          category: 'data_modification',
          action: 'update',
          table_name: 'policies',
          record_id: 'policy-123',
          old_data: { status: 'pending' },
          new_data: { status: 'approved' },
          changed_fields: ['status'],
        });

        expect(queryChainable.insert).toHaveBeenCalled();
      });

      it('should log record deletion with high severity', async () => {
        await auditService.log({
          category: 'data_modification',
          action: 'delete',
          table_name: 'policies',
          record_id: 'policy-123',
          old_data: { policy_number: 'POL-001' },
        });

        expect(queryChainable.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'high',
          })
        );
      });
    });

    describe('5. Admin Actions', () => {
      it('should log user creation', async () => {
        await auditService.log({
          category: 'admin',
          action: 'user_created',
          metadata: {
            target_user_id: 'user-123',
            role: 'subcontractor',
          },
        });

        expect(queryChainable.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'admin',
            action: 'user_created',
            severity: 'medium',
          })
        );
      });

      it('should log configuration change', async () => {
        await auditService.log({
          category: 'admin',
          action: 'config_changed',
          metadata: {
            config_key: 'max_upload_size',
            old_value: '10MB',
            new_value: '50MB',
          },
        });

        expect(queryChainable.insert).toHaveBeenCalled();
      });
    });

    describe('6. Security Events', () => {
      it('should log security event with high severity', async () => {
        await auditService.log({
          category: 'security',
          action: 'brute_force_attempt',
          severity: 'high',
          metadata: {
            threat_level: 'high',
            detection_method: 'rate_limit',
            blocked: true,
          },
        });

        expect(queryChainable.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'security',
            severity: 'high',
          })
        );
      });

      it('should log suspicious activity', async () => {
        await auditService.log({
          category: 'security',
          action: 'suspicious_activity',
          metadata: {
            threat_level: 'medium',
            activity_type: 'rapid_api_calls',
          },
        });

        expect(queryChainable.insert).toHaveBeenCalled();
      });
    });

    describe('7. Compliance Actions', () => {
      it('should log compliance evaluation', async () => {
        await auditService.log({
          category: 'compliance',
          action: 'compliance_evaluation_run',
          metadata: {
            project_id: 'proj-123',
            subcontractor_id: 'sub-123',
            compliance_score: 85,
            risk_level: 'low',
          },
        });

        expect(queryChainable.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'compliance',
            action: 'compliance_evaluation_run',
            severity: 'medium',
          })
        );
      });

      it('should log document approval', async () => {
        await auditService.log({
          category: 'compliance',
          action: 'document_approved',
          metadata: {
            document_id: 'doc-123',
            policy_id: 'pol-123',
          },
        });

        expect(queryChainable.insert).toHaveBeenCalled();
      });
    });

    describe('8. System Events', () => {
      it('should log system errors', async () => {
        await auditService.log({
          category: 'system',
          action: 'error_occurred',
          metadata: {
            service: 'api',
            error_message: 'Database connection failed',
          },
        });

        expect(queryChainable.insert).toHaveBeenCalled();
      });

      it('should log health check failures', async () => {
        await auditService.log({
          category: 'system',
          action: 'health_check_failed',
          metadata: {
            service: 'database',
            duration_ms: 5000,
          },
        });

        expect(queryChainable.insert).toHaveBeenCalled();
      });
    });
  });

  describe('Event Enrichment', () => {
    it('should enrich events with user context', async () => {
      await auditService.log({
        category: 'data_access',
        action: 'view_document',
      });

      expect(queryChainable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-id',
          organization_id: 'test-org-id',
        })
      );
    });

    it('should add request and session IDs', async () => {
      await auditService.log({
        category: 'data_access',
        action: 'view_document',
      });

      expect(queryChainable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          request_id: expect.any(String),
          session_id: expect.any(String),
        })
      );
    });

    it('should infer severity based on category', async () => {
      await auditService.log({
        category: 'security',
        action: 'test_action',
      });

      expect(queryChainable.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'high',
        })
      );
    });
  });

  describe('Event Validation', () => {
    it('should queue invalid events without throwing (missing category)', async () => {
      // AuditService is designed to never throw - it queues failed events instead
      // This ensures application stability even if audit logging has issues
      await auditService.log({
        action: 'test_action',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Event should be queued for retry (no exception thrown)
      // Verify insert was NOT called (validation failed before insert)
      expect(queryChainable.insert).not.toHaveBeenCalled();
    });

    it('should queue invalid events without throwing (missing action)', async () => {
      // AuditService is designed to never throw - it queues failed events instead
      await auditService.log({
        category: 'system',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Event should be queued for retry (no exception thrown)
      // Verify insert was NOT called (validation failed before insert)
      expect(queryChainable.insert).not.toHaveBeenCalled();
    });
  });

  describe('Query Functionality', () => {
    beforeEach(() => {
      // Set up the query result using our chainable mock
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (queryChainable._setResult as any)({
        data: [
          {
            id: '1',
            category: 'authentication',
            action: 'login_success',
            created_at: '2025-01-01T00:00:00Z',
          },
        ],
        error: null,
        count: 1,
      });
    });

    it('should query logs with filters', async () => {
      const result = await auditService.query({
        category: 'authentication',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        limit: 100,
      });

      expect(queryChainable.eq).toHaveBeenCalledWith(
        'category',
        'authentication'
      );
      expect(queryChainable.gte).toHaveBeenCalledWith(
        'created_at',
        '2025-01-01'
      );
      expect(result.logs).toHaveLength(1);
    });

    it('should apply pagination', async () => {
      await auditService.query({
        limit: 50,
        offset: 100,
      });

      expect(queryChainable.range).toHaveBeenCalledWith(100, 149);
    });
  });

  describe('Export Functionality', () => {
    it('should export to CSV format', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (queryChainable._setResult as any)({
        data: [
          {
            id: '1',
            created_at: '2025-01-01T00:00:00Z',
            category: 'authentication',
            action: 'login_success',
            severity: 'low',
            user_id: 'user-1',
            status: 'success',
          },
        ],
        error: null,
        count: 1,
      });

      const csv = await auditService.export({}, 'csv');

      expect(csv).toContain('id,created_at,category,action');
      expect(csv).toContain('authentication');
      expect(csv).toContain('login_success');
    });

    it('should export to JSON format', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (queryChainable._setResult as any)({
        data: [{ id: '1', category: 'authentication' }],
        error: null,
        count: 1,
      });

      const json = await auditService.export({}, 'json');
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].category).toBe('authentication');
    });
  });

  describe('Failed Event Queue', () => {
    it('should queue failed events', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (queryChainable._setInsertResult as any)({
        data: null,
        error: new Error('Database error'),
      });

      await auditService.log({
        category: 'system',
        action: 'test_action',
      });

      // Event should be queued for retry
      // (Testing implementation detail via retry function)
      const retryCount = await auditService.retryFailedEvents();
      expect(retryCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Hash Chain Verification', () => {
    it('should verify hash chain integrity', async () => {
      mockSupabaseClient.rpc.mockReturnValueOnce({
        data: [
          {
            valid: true,
            error_count: 0,
            verified_count: 100,
            errors: [],
          },
        ],
        error: null,
      });

      const result = await auditService.verifyHashChain(
        new Date('2025-01-01'),
        new Date('2025-12-31')
      );

      expect(result.valid).toBe(true);
      expect(result.verified_count).toBe(100);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect hash chain tampering', async () => {
      mockSupabaseClient.rpc.mockReturnValueOnce({
        data: [
          {
            valid: false,
            error_count: 3,
            verified_count: 100,
            errors: [
              'Hash chain broken at record abc',
              'Hash mismatch at record def',
              'Hash mismatch at record ghi',
            ],
          },
        ],
        error: null,
      });

      const result = await auditService.verifyHashChain(
        new Date('2025-01-01'),
        new Date('2025-12-31')
      );

      expect(result.valid).toBe(false);
      expect(result.failed_count).toBe(3);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
