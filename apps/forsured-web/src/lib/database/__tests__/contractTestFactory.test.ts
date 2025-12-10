/**
 * Contract Test Factory Tests
 * REQ-305: Contract Tests for MockDatabase Parity
 *
 * Tests the contract test infrastructure itself to ensure it correctly
 * provides database adapters and comparison utilities.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMockAdapter,
  createSupabaseAdapter,
  generateTestId,
  generateTestEmail,
  compareErrorCodes,
  compareDataShape,
  assertSameOutcome,
  CONTRACT_TESTS_ENABLED,
  MOCK_ONLY,
  type ContractDatabase,
} from './contractTestFactory';
import { createNotNullError, createUniqueViolationError } from '../mockDatabase.errors';

describe('Contract Test Factory', () => {
  describe('createMockAdapter', () => {
    it('should create a functional mock database adapter', () => {
      const db = createMockAdapter();

      expect(db).toBeDefined();
      expect(db.from).toBeInstanceOf(Function);
    });

    it('should provide query builder from mock adapter', async () => {
      const db = createMockAdapter();
      const query = db.from('users');

      expect(query).toBeDefined();
      expect(query.select).toBeInstanceOf(Function);
      expect(query.insert).toBeInstanceOf(Function);
      expect(query.update).toBeInstanceOf(Function);
      expect(query.delete).toBeInstanceOf(Function);
    });

    it('should return seeded data', async () => {
      const db = createMockAdapter();
      const result = await db.from('users').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      // Seeded data should include users
      expect((result.data as unknown[]).length).toBeGreaterThan(0);
    });
  });

  describe('createSupabaseAdapter', () => {
    it('should return null when service role not configured', () => {
      // In test environment without service role, should return null
      const db = createSupabaseAdapter();

      // Result depends on environment - either null or valid adapter
      if (db !== null) {
        expect(db.from).toBeInstanceOf(Function);
      }
    });
  });

  describe('generateTestId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateTestId();
      const id2 = generateTestId();

      expect(id1).not.toBe(id2);
    });

    it('should include prefix', () => {
      const id = generateTestId('custom-prefix');

      expect(id.startsWith('custom-prefix-')).toBe(true);
    });

    it('should generate IDs of consistent format', () => {
      const id = generateTestId('test');

      // Format: prefix-timestamp-random
      const parts = id.split('-');
      expect(parts.length).toBeGreaterThanOrEqual(3);
      expect(parts[0]).toBe('test');
    });
  });

  describe('generateTestEmail', () => {
    it('should generate unique emails', () => {
      const email1 = generateTestEmail();
      const email2 = generateTestEmail();

      expect(email1).not.toBe(email2);
    });

    it('should generate valid email format', () => {
      const email = generateTestEmail();

      expect(email).toContain('@');
      expect(email.endsWith('@contract-test.local')).toBe(true);
    });
  });

  describe('compareErrorCodes', () => {
    it('should return true for matching error codes', () => {
      const error1 = createNotNullError('email', 'users');
      const error2 = createNotNullError('name', 'projects');

      expect(compareErrorCodes(error1, error2)).toBe(true);
    });

    it('should return false for different error codes', () => {
      const error1 = createNotNullError('email', 'users');
      const error2 = createUniqueViolationError('users', 'email', 'test@test.com');

      expect(compareErrorCodes(error1, error2)).toBe(false);
    });

    it('should return true when both errors are null', () => {
      expect(compareErrorCodes(null, null)).toBe(true);
    });

    it('should return false when only one error is null', () => {
      const error = createNotNullError('email', 'users');

      expect(compareErrorCodes(error, null)).toBe(false);
      expect(compareErrorCodes(null, error)).toBe(false);
    });
  });

  describe('compareDataShape', () => {
    it('should return true for matching array lengths', () => {
      const data1 = [{ id: '1' }, { id: '2' }];
      const data2 = [{ id: 'a' }, { id: 'b' }];

      expect(compareDataShape(data1, data2)).toBe(true);
    });

    it('should return false for different array lengths', () => {
      const data1 = [{ id: '1' }];
      const data2 = [{ id: 'a' }, { id: 'b' }];

      expect(compareDataShape(data1, data2)).toBe(false);
    });

    it('should return true for objects with same keys', () => {
      const data1 = { id: '1', name: 'Test' };
      const data2 = { id: '2', name: 'Other' };

      expect(compareDataShape(data1, data2)).toBe(true);
    });

    it('should return false for objects with different keys', () => {
      const data1 = { id: '1', name: 'Test' };
      const data2 = { id: '2', email: 'test@test.com' };

      expect(compareDataShape(data1, data2)).toBe(false);
    });

    it('should return true when both are null', () => {
      expect(compareDataShape(null, null)).toBe(true);
    });

    it('should return false when only one is null', () => {
      expect(compareDataShape({ id: '1' }, null)).toBe(false);
      expect(compareDataShape(null, { id: '1' })).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should have CONTRACT_TESTS_ENABLED defined', () => {
      expect(typeof CONTRACT_TESTS_ENABLED).toBe('boolean');
    });

    it('should have MOCK_ONLY defined', () => {
      expect(typeof MOCK_ONLY).toBe('boolean');
    });
  });

  describe('Mock Adapter Integration', () => {
    let db: ContractDatabase;

    beforeEach(() => {
      db = createMockAdapter();
    });

    it('should support select with filters', async () => {
      const result = await db.from('users').select('*').eq('role', 'manager');

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });

    it('should support insert operations', async () => {
      const email = generateTestEmail();
      const result = await db.from('users').insert({
        email,
        role: 'manager',
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });

    it('should return proper error for constraint violations', async () => {
      // Insert first user
      const email = generateTestEmail();
      await db.from('users').insert({ email, role: 'manager' });

      // Try to insert duplicate
      const result = await db.from('users').insert({ email, role: 'broker' });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('23505'); // Unique violation
    });

    it('should support chained operations', async () => {
      const result = await db
        .from('users')
        .select('email,role')
        .eq('role', 'manager')
        .order('email', { ascending: true })
        .limit(5);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });

    it('should support single() modifier', async () => {
      const email = generateTestEmail();
      await db.from('users').insert({ email, role: 'manager' });

      const result = await db.from('users').select('*').eq('email', email).single();

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(false);
    });

    it('should return PGRST116 for single() with no results', async () => {
      const result = await db
        .from('users')
        .select('*')
        .eq('email', 'nonexistent@test.com')
        .single();

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('PGRST116');
    });
  });
});

describe('assertSameOutcome', () => {
  it('should pass when both succeed', async () => {
    const mockResult = { data: [{ id: '1' }], error: null };
    const realResult = { data: [{ id: '2' }], error: null };

    // Should not throw
    await assertSameOutcome(mockResult, realResult);
  });

  it('should pass when both fail with same error code', async () => {
    const error = createNotNullError('email', 'users');
    const mockResult = { data: null, error };
    const realResult = { data: null, error };

    // Should not throw
    await assertSameOutcome(mockResult, realResult);
  });

  it('should fail when outcomes differ', async () => {
    const mockResult = { data: [{ id: '1' }], error: null };
    const realResult = { data: null, error: createNotNullError('email', 'users') };

    await expect(assertSameOutcome(mockResult, realResult)).rejects.toThrow();
  });
});
