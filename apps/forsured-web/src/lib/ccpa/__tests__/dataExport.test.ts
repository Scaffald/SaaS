/**
 * Data Export Service Tests
 * REQ-131: CCPA Compliance Implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DataExportService,
  initializeDataExportService,
} from '../dataExport';

// Create a chainable mock that properly handles Supabase query patterns
const createChainableMock = () => {
  let singleResult = { data: null, error: null };
  let queryResult = { data: [], error: null };

  const chainable: Record<string, unknown> = {
    _setSingleResult: (result: { data: unknown; error: unknown }) => {
      singleResult = result;
    },
    _setQueryResult: (result: { data: unknown[]; error: unknown }) => {
      queryResult = result;
    },
  };

  // All chainable methods return the chainable object
  const chainMethods = ['select', 'eq', 'or', 'gte', 'lte', 'order', 'limit', 'update', 'insert'];
  chainMethods.forEach(method => {
    chainable[method] = vi.fn(() => chainable);
  });

  // single() returns the single result
  chainable.single = vi.fn(() => Promise.resolve(singleResult));

  // Make it thenable for query results (when not using single())
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
};

describe('DataExportService', () => {
  let service: DataExportService;

  beforeEach(() => {
    // Reset chainable mock for fresh state
    queryChainable = createChainableMock();
    mockSupabaseClient.from = vi.fn(() => queryChainable);

    service = new DataExportService();
    initializeDataExportService(mockSupabaseClient);
    vi.clearAllMocks();
  });

  describe('exportUserData', () => {
    it('should export user data successfully', async () => {
      const userId = 'test-user-id';
      const requestId = 'test-request-id';

      // Mock user profile response
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        created_at: '2025-01-01T00:00:00Z',
      };

      // Set up the single result for getUserProfile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (queryChainable._setSingleResult as any)({ data: mockUser, error: null });

      const result = await service.exportUserData(userId, requestId, 'json');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.consumer.user_id).toBe(userId);
      expect(result.data?.consumer.email).toBe('test@example.com');
    });

    it('should return error if user not found', async () => {
      const userId = 'non-existent-user';
      const requestId = 'test-request-id';

      // Set up single result to return null (user not found)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (queryChainable._setSingleResult as any)({ data: null, error: null });

      const result = await service.exportUserData(userId, requestId, 'json');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('USER_NOT_FOUND');
    });

    it('should include all data categories in export', async () => {
      const userId = 'test-user-id';
      const requestId = 'test-request-id';

      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
      };

      // Set up the single result for getUserProfile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (queryChainable._setSingleResult as any)({ data: mockUser, error: null });

      const result = await service.exportUserData(userId, requestId, 'json');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('consumer');
      expect(result.data).toHaveProperty('collection_sources');
      expect(result.data).toHaveProperty('business_purposes');
      expect(result.data).toHaveProperty('third_parties');
      expect(result.data).toHaveProperty('retention_periods');
    });
  });

  describe('generateExportFile', () => {
    it('should generate JSON export', async () => {
      const mockExport = {
        export_id: 'EXP-123',
        exported_at: '2025-01-01T00:00:00Z',
        consumer: {
          user_id: 'test-user',
          name: 'Test User',
          email: 'test@example.com',
        },
        collection_sources: ['Direct from user'],
        business_purposes: ['Account management'],
        third_parties: ['Vercel'],
      };

      const result = await service.generateExportFile(mockExport, 'json');

      expect(typeof result).toBe('string');
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.export_id).toBe('EXP-123');
    });

    it('should generate CSV export', async () => {
      const mockExport = {
        export_id: 'EXP-123',
        exported_at: '2025-01-01T00:00:00Z',
        consumer: {
          user_id: 'test-user',
          name: 'Test User',
          email: 'test@example.com',
        },
        collection_sources: ['Direct from user'],
        business_purposes: ['Account management'],
        third_parties: ['Vercel'],
      };

      const result = await service.generateExportFile(mockExport, 'csv');

      expect(typeof result).toBe('string');
      expect(result).toContain('CONSUMER INFORMATION');
      expect(result).toContain('Test User');
    });

    it('should throw error for unsupported format', async () => {
      const mockExport = {
        export_id: 'EXP-123',
        exported_at: '2025-01-01T00:00:00Z',
        consumer: {
          name: 'Test User',
        },
        collection_sources: [],
        business_purposes: [],
        third_parties: [],
      };

      await expect(
        service.generateExportFile(mockExport, 'pdf' as any)
      ).rejects.toThrow('PDF export not yet implemented');
    });
  });
});
