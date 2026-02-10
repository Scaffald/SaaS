/**
 * Data Deletion Service Tests
 * CCPA Compliance Implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DataDeletionService,
  initializeDataDeletionService,
} from '../dataDeletion';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        limit: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(),
      or: vi.fn(),
    })),
    delete: vi.fn(() => ({
      count: vi.fn(),
      eq: vi.fn(),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
};

describe('DataDeletionService', () => {
  let service: DataDeletionService;

  beforeEach(() => {
    service = new DataDeletionService();
    initializeDataDeletionService(mockSupabaseClient);
    vi.clearAllMocks();
  });

  describe('initiateSoftDelete', () => {
    it('should initiate soft delete with 90-day grace period', async () => {
      const userId = 'test-user-id';
      const requestId = 'test-request-id';

      // Mock no exceptions
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        update: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
      });

      const result = await service.initiateSoftDelete(userId, requestId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.status).toBe('pending');
      expect(result.data?.deletion_scope.user_profile).toBe(true);

      // Verify 90-day grace period
      const softDelete = new Date(result.data!.soft_delete_date);
      const permanentDelete = new Date(result.data!.permanent_delete_date);
      const daysDiff = (permanentDelete.getTime() - softDelete.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(90, 0);
    });

    it('should return error if deletion exceptions exist', async () => {
      const userId = 'test-user-id';
      const requestId = 'test-request-id';

      // Mock legal hold
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'legal-hold-1' },
          error: null,
        }),
      });

      const result = await service.initiateSoftDelete(userId, requestId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DELETION_EXCEPTIONS');
      expect(result.error?.details?.exceptions).toBeDefined();
    });
  });

  describe('executePermanentDeletion', () => {
    it('should permanently delete user data', async () => {
      const userId = 'test-user-id';

      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
        update: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
      });

      const result = await service.executePermanentDeletion(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.deleted_records).toBeDefined();
    });

    it('should track retained records with reasons', async () => {
      const userId = 'test-user-id';

      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
        update: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        head: vi.fn().mockResolvedValue({ count: 5, error: null }),
        insert: vi.fn().mockReturnThis(),
      });

      const result = await service.executePermanentDeletion(userId);

      expect(result.success).toBe(true);
      expect(result.data?.retained_records).toBeDefined();
      expect(result.data?.retained_records.length).toBeGreaterThan(0);
    });
  });

  describe('cancelDeletion', () => {
    it('should cancel deletion during grace period', async () => {
      const userId = 'test-user-id';
      const requestId = 'test-request-id';

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
        insert: vi.fn().mockReturnThis(),
      });

      const result = await service.cancelDeletion(userId, requestId);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });
  });
});
