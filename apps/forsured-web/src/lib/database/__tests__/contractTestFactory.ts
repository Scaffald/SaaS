/**
 * Contract Test Factory
 * Contract Tests for MockDatabase Parity
 *
 * This module provides utilities for running identical tests against both
 * MockDatabase and real Supabase to verify behavioral parity.
 *
 * Contract tests ensure:
 * 1. Same queries produce same results
 * 2. Same error conditions produce same error codes
 * 3. Same constraints are enforced
 *
 * Usage:
 * ```typescript
 * contractTest('should insert a user', async (db, isReal) => {
 *   const { data, error } = await db.from('users').insert({ email: 'test@test.com', role: 'manager' });
 *   expect(error).toBeNull();
 *   expect(data).toBeDefined();
 * });
 * ```
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { MockDatabase } from '../mockDatabase';
import { supabaseServiceRole, forsured } from '../../supabase';
import type { DatabaseResponse, DatabaseError, TableName, TableRow } from '../../../types/database.types';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Environment variable to enable integration tests
 * Set VITE_RUN_CONTRACT_TESTS=true to run against real Supabase
 */
export const CONTRACT_TESTS_ENABLED = import.meta.env.VITE_RUN_CONTRACT_TESTS === 'true';

/**
 * Environment variable to run ONLY against mock (useful for CI on feature branches)
 */
export const MOCK_ONLY = import.meta.env.VITE_CONTRACT_TESTS_MOCK_ONLY === 'true';

// ============================================================================
// Types
// ============================================================================

/**
 * Unified database interface that both MockDatabase and Supabase implement
 */
export interface ContractDatabase {
  from<T extends TableName>(table: T): ContractQueryBuilder<T>;
}

/**
 * Query builder interface matching both implementations
 */
export interface ContractQueryBuilder<T extends TableName> {
  select(columns?: string): ContractQueryBuilder<T>;
  insert(data: Partial<TableRow<T>> | Partial<TableRow<T>>[]): Promise<DatabaseResponse<TableRow<T>[]>>;
  update(data: Partial<TableRow<T>>): ContractQueryBuilder<T>;
  delete(): ContractQueryBuilder<T>;
  eq(column: string, value: unknown): ContractQueryBuilder<T>;
  neq(column: string, value: unknown): ContractQueryBuilder<T>;
  in(column: string, values: unknown[]): ContractQueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): ContractQueryBuilder<T>;
  limit(count: number): ContractQueryBuilder<T>;
  single(): ContractQueryBuilder<T>;
  then<TResult1 = DatabaseResponse<TableRow<T>[] | TableRow<T> | null>, TResult2 = never>(
    onfulfilled?: ((value: DatabaseResponse<TableRow<T>[] | TableRow<T> | null>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2>;
}

/**
 * Test function signature for contract tests
 */
export type ContractTestFn = (db: ContractDatabase, isRealDatabase: boolean) => Promise<void>;

/**
 * Options for contract test execution
 */
export interface ContractTestOptions {
  /** Skip mock database test */
  skipMock?: boolean;
  /** Skip real database test */
  skipReal?: boolean;
  /** Test-specific timeout in milliseconds */
  timeout?: number;
  /** Clean up data after test (default: true) */
  cleanup?: boolean;
}

// ============================================================================
// Database Adapters
// ============================================================================

/**
 * Wraps MockDatabase to match ContractDatabase interface
 */
export function createMockAdapter(): ContractDatabase {
  const mockDb = new MockDatabase();
  mockDb.seed();
  mockDb.setCurrentUser({ id: 'admin-1', role: 'admin' }); // Admin for full access

  return {
    from: <T extends TableName>(table: T) => mockDb.from(table) as unknown as ContractQueryBuilder<T>,
  };
}

/**
 * Wraps Supabase client to match ContractDatabase interface
 * Uses service role for RLS bypass during testing
 */
export function createSupabaseAdapter(): ContractDatabase | null {
  if (!supabaseServiceRole) {
    return null;
  }

  return {
    from: <T extends TableName>(table: T) => {
      // All tables are in the forsured schema
      return forsured(table, supabaseServiceRole) as unknown as ContractQueryBuilder<T>;
    },
  };
}

// ============================================================================
// Test ID Tracking for Cleanup
// ============================================================================

/**
 * Tracks IDs of records created during tests for cleanup
 */
class TestDataTracker {
  private createdRecords: Map<TableName, Set<string>> = new Map();

  track(table: TableName, id: string): void {
    if (!this.createdRecords.has(table)) {
      this.createdRecords.set(table, new Set());
    }
    this.createdRecords.get(table)!.add(id);
  }

  getTracked(table: TableName): string[] {
    return Array.from(this.createdRecords.get(table) || []);
  }

  clear(): void {
    this.createdRecords.clear();
  }

  getAllTables(): TableName[] {
    return Array.from(this.createdRecords.keys());
  }
}

// ============================================================================
// Contract Test Helpers
// ============================================================================

/**
 * Generates a unique test ID to avoid conflicts between parallel tests
 */
export function generateTestId(prefix = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generates a unique email for testing
 */
export function generateTestEmail(): string {
  return `test-${generateTestId()}@contract-test.local`;
}

/**
 * Compares error codes from mock and real database
 */
export function compareErrorCodes(mockError: DatabaseError | null, realError: DatabaseError | null): boolean {
  if (mockError === null && realError === null) return true;
  if (mockError === null || realError === null) return false;
  return mockError.code === realError.code;
}

/**
 * Compares data shapes (ignores specific values like IDs and timestamps)
 */
export function compareDataShape(mockData: unknown, realData: unknown): boolean {
  if (mockData === null && realData === null) return true;
  if (mockData === null || realData === null) return false;

  if (Array.isArray(mockData) && Array.isArray(realData)) {
    return mockData.length === realData.length;
  }

  if (typeof mockData === 'object' && typeof realData === 'object') {
    const mockKeys = Object.keys(mockData as object).sort();
    const realKeys = Object.keys(realData as object).sort();
    return JSON.stringify(mockKeys) === JSON.stringify(realKeys);
  }

  return typeof mockData === typeof realData;
}

// ============================================================================
// Contract Test Factory
// ============================================================================

/**
 * Creates a contract test that runs against both mock and real databases
 *
 * @param name - Test name
 * @param testFn - Test function that receives database adapter
 * @param options - Test options
 */
export function contractTest(
  name: string,
  testFn: ContractTestFn,
  options: ContractTestOptions = {}
): void {
  const { skipMock = false, skipReal = false, timeout = 10000 } = options;

  describe(`Contract: ${name}`, () => {
    // Always run against MockDatabase
    if (!skipMock) {
      it(`[Mock] ${name}`, async () => {
        const mockDb = createMockAdapter();
        await testFn(mockDb, false);
      }, timeout);
    }

    // Run against real database only when enabled
    if (!skipReal && CONTRACT_TESTS_ENABLED && !MOCK_ONLY) {
      it(`[Real] ${name}`, async () => {
        const realDb = createSupabaseAdapter();
        if (!realDb) {
          console.warn('Skipping real database test: Supabase service role not configured');
          return;
        }
        await testFn(realDb, true);
      }, timeout);
    }
  });
}

/**
 * Creates a contract test suite for a specific table
 */
export function contractTestSuite(
  tableName: TableName,
  suiteFn: (helpers: ContractTestHelpers) => void
): void {
  describe(`Contract Tests: ${tableName}`, () => {
    const tracker = new TestDataTracker();
    let mockDb: ContractDatabase;
    let realDb: ContractDatabase | null;

    beforeAll(() => {
      mockDb = createMockAdapter();
      realDb = CONTRACT_TESTS_ENABLED && !MOCK_ONLY ? createSupabaseAdapter() : null;
    });

    afterEach(async () => {
      // Cleanup tracked test data from real database
      if (realDb && CONTRACT_TESTS_ENABLED) {
        for (const table of tracker.getAllTables()) {
          const ids = tracker.getTracked(table);
          if (ids.length > 0) {
            try {
              await realDb.from(table).delete().in('id', ids);
            } catch {
              // Ignore cleanup errors
            }
          }
        }
      }
      tracker.clear();
    });

    const helpers: ContractTestHelpers = {
      getMockDb: () => mockDb,
      getRealDb: () => realDb,
      trackForCleanup: (table: TableName, id: string) => tracker.track(table, id),
      generateId: generateTestId,
      generateEmail: generateTestEmail,
      isRealEnabled: () => CONTRACT_TESTS_ENABLED && !MOCK_ONLY && realDb !== null,
    };

    suiteFn(helpers);
  });
}

/**
 * Helpers available within a contract test suite
 */
export interface ContractTestHelpers {
  getMockDb: () => ContractDatabase;
  getRealDb: () => ContractDatabase | null;
  trackForCleanup: (table: TableName, id: string) => void;
  generateId: (prefix?: string) => string;
  generateEmail: () => string;
  isRealEnabled: () => boolean;
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Asserts that mock and real databases return the same error code
 */
export async function assertSameErrorCode(
  mockResult: { error: DatabaseError | null },
  realResult: { error: DatabaseError | null },
  message?: string
): Promise<void> {
  const context = message ? `: ${message}` : '';

  if (mockResult.error === null && realResult.error === null) {
    return; // Both succeeded, no error to compare
  }

  expect(mockResult.error, `Mock should have error${context}`).not.toBeNull();
  expect(realResult.error, `Real should have error${context}`).not.toBeNull();
  expect(mockResult.error!.code, `Error codes should match${context}`).toBe(realResult.error!.code);
}

/**
 * Asserts that mock and real databases return the same success/failure state
 */
export async function assertSameOutcome(
  mockResult: { data: unknown; error: DatabaseError | null },
  realResult: { data: unknown; error: DatabaseError | null },
  message?: string
): Promise<void> {
  const context = message ? `: ${message}` : '';

  const mockSuccess = mockResult.error === null;
  const realSuccess = realResult.error === null;

  expect(mockSuccess, `Outcome should match${context}`).toBe(realSuccess);

  if (!mockSuccess && !realSuccess) {
    expect(mockResult.error!.code, `Error codes should match${context}`).toBe(realResult.error!.code);
  }
}

/**
 * Asserts that mock and real databases return arrays of the same length
 */
export async function assertSameCount(
  mockResult: { data: unknown[] | null; error: DatabaseError | null },
  realResult: { data: unknown[] | null; error: DatabaseError | null },
  message?: string
): Promise<void> {
  const context = message ? `: ${message}` : '';

  expect(mockResult.error, `Mock should not error${context}`).toBeNull();
  expect(realResult.error, `Real should not error${context}`).toBeNull();

  const mockCount = mockResult.data?.length ?? 0;
  const realCount = realResult.data?.length ?? 0;

  expect(mockCount, `Counts should match${context}`).toBe(realCount);
}

// ============================================================================
// Exports
// ============================================================================

export {
  MockDatabase,
  type DatabaseError,
  type TableName,
  type TableRow,
};
