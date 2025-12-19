/**
 * Contract Tests: Query Modifiers
 * REQ-305: Contract Tests for MockDatabase Parity
 *
 * These tests verify that MockDatabase and real Supabase behave identically
 * for query modifiers: eq, neq, in, order, limit, single.
 *
 * Run with real database:
 *   VITE_RUN_CONTRACT_TESTS=true npm test -- contract.modifiers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  contractTest,
  createMockAdapter,
  generateTestId,
  generateTestEmail,
  type ContractDatabase,
} from './contractTestFactory';

// ============================================================================
// Filter Modifier Tests
// ============================================================================

describe('Contract Tests: Filter Modifiers', () => {
  // --------------------------------------------------------------------------
  // eq() Modifier
  // --------------------------------------------------------------------------

  contractTest('eq() should filter by exact string match', async (db) => {
    const email = generateTestEmail();
    await db.from('users').insert({ email, role: 'manager' });

    const result = await db.from('users').select('*').eq('email', email);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].email).toBe(email);
  });

  contractTest('eq() should filter by exact role match', async (db) => {
    // Get managers
    const result = await db.from('users').select('*').eq('role', 'manager');

    expect(result.error).toBeNull();
    result.data!.forEach((user) => {
      expect(user.role).toBe('manager');
    });
  });

  contractTest('eq() should return empty array for no matches', async (db) => {
    const result = await db.from('users').select('*').eq('email', 'nonexistent-xyz123@test.com');

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // neq() Modifier
  // --------------------------------------------------------------------------

  contractTest('neq() should exclude matching records', async (db) => {
    // Get all non-manager users
    const result = await db.from('users').select('*').neq('role', 'manager');

    expect(result.error).toBeNull();
    result.data!.forEach((user) => {
      expect(user.role).not.toBe('manager');
    });
  });

  contractTest('neq() should return all when no matches', async (db) => {
    // Get all users that are not 'nonexistent_role'
    const allResult = await db.from('users').select('*');
    const neqResult = await db.from('users').select('*').neq('role', 'nonexistent_role');

    expect(neqResult.error).toBeNull();
    expect(neqResult.data!.length).toBe(allResult.data!.length);
  });

  // --------------------------------------------------------------------------
  // in() Modifier
  // --------------------------------------------------------------------------

  contractTest('in() should filter by multiple values', async (db) => {
    const result = await db.from('users').select('*').in('role', ['manager', 'broker']);

    expect(result.error).toBeNull();
    result.data!.forEach((user) => {
      expect(['manager', 'broker']).toContain(user.role);
    });
  });

  contractTest('in() should return empty for no matching values', async (db) => {
    const result = await db.from('users').select('*').in('role', ['fake_role_1', 'fake_role_2']);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(0);
  });

  contractTest('in() should work with single value array', async (db) => {
    const result = await db.from('users').select('*').in('role', ['admin']);

    expect(result.error).toBeNull();
    result.data!.forEach((user) => {
      expect(user.role).toBe('admin');
    });
  });

  // --------------------------------------------------------------------------
  // Combined Filters
  // --------------------------------------------------------------------------

  contractTest('should combine multiple eq() filters', async (db) => {
    const email = generateTestEmail();
    await db.from('users').insert({ email, role: 'manager' });

    const result = await db.from('users').select('*').eq('email', email).eq('role', 'manager');

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].email).toBe(email);
    expect(result.data![0].role).toBe('manager');
  });

  contractTest('combined filters with no overlap should return empty', async (db) => {
    const email = generateTestEmail();
    await db.from('users').insert({ email, role: 'manager' });

    // Filter for this email but wrong role
    const result = await db.from('users').select('*').eq('email', email).eq('role', 'admin');

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(0);
  });
});

// ============================================================================
// Ordering Tests
// ============================================================================

describe('Contract Tests: Order Modifier', () => {
  contractTest('order() should sort ascending by default', async (db) => {
    const result = await db.from('users').select('email').order('email');

    expect(result.error).toBeNull();
    const emails = result.data!.map((u) => u.email);
    const sortedEmails = [...emails].sort();
    expect(emails).toEqual(sortedEmails);
  });

  contractTest('order() should sort ascending when specified', async (db) => {
    const result = await db.from('users').select('email').order('email', { ascending: true });

    expect(result.error).toBeNull();
    const emails = result.data!.map((u) => u.email);
    const sortedEmails = [...emails].sort();
    expect(emails).toEqual(sortedEmails);
  });

  contractTest('order() should sort descending when specified', async (db) => {
    const result = await db.from('users').select('email').order('email', { ascending: false });

    expect(result.error).toBeNull();
    const emails = result.data!.map((u) => u.email);
    const sortedEmails = [...emails].sort().reverse();
    expect(emails).toEqual(sortedEmails);
  });
});

// ============================================================================
// Limit Tests
// ============================================================================

describe('Contract Tests: Limit Modifier', () => {
  contractTest('limit() should restrict result count', async (db) => {
    const result = await db.from('users').select('*').limit(2);

    expect(result.error).toBeNull();
    expect(result.data!.length).toBeLessThanOrEqual(2);
  });

  contractTest('limit(1) should return at most one record', async (db) => {
    const result = await db.from('users').select('*').limit(1);

    expect(result.error).toBeNull();
    expect(result.data!.length).toBeLessThanOrEqual(1);
  });

  contractTest('limit() combined with order() should return first N sorted', async (db) => {
    const result = await db.from('users').select('email').order('email').limit(3);

    expect(result.error).toBeNull();
    expect(result.data!.length).toBeLessThanOrEqual(3);

    // Should be sorted
    const emails = result.data!.map((u) => u.email);
    const sortedEmails = [...emails].sort();
    expect(emails).toEqual(sortedEmails);
  });
});

// ============================================================================
// Single() Modifier Tests
// ============================================================================

describe('Contract Tests: Single Modifier', () => {
  contractTest('single() should return single object instead of array', async (db) => {
    const email = generateTestEmail();
    await db.from('users').insert({ email, role: 'manager' });

    const result = await db.from('users').select('*').eq('email', email).single();

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(Array.isArray(result.data)).toBe(false);
    expect((result.data as { email: string }).email).toBe(email);
  });

  contractTest('single() should error when no rows found', async (db) => {
    const result = await db
      .from('users')
      .select('*')
      .eq('email', 'absolutely-nonexistent@test.com')
      .single();

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe('PGRST116');
    expect(result.data).toBeNull();
  });

  contractTest('single() should error when multiple rows found', async (db) => {
    // Create two users with same role
    const email1 = generateTestEmail();
    const email2 = generateTestEmail();
    await db.from('users').insert([
      { email: email1, role: 'manager' },
      { email: email2, role: 'manager' },
    ]);

    // Query by role (returns multiple) with single()
    const result = await db.from('users').select('*').eq('role', 'manager').single();

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe('PGRST116');
    expect(result.error!.message).toContain('multiple');
  });
});

// ============================================================================
// Select Column Tests
// ============================================================================

describe('Contract Tests: Select Columns', () => {
  contractTest('select() with no args should return all columns', async (db) => {
    const email = generateTestEmail();
    await db.from('users').insert({ email, role: 'manager' });

    const result = await db.from('users').select().eq('email', email);

    expect(result.error).toBeNull();
    expect(result.data![0]).toHaveProperty('id');
    expect(result.data![0]).toHaveProperty('email');
    expect(result.data![0]).toHaveProperty('role');
  });

  contractTest('select("*") should return all columns', async (db) => {
    const email = generateTestEmail();
    await db.from('users').insert({ email, role: 'manager' });

    const result = await db.from('users').select('*').eq('email', email);

    expect(result.error).toBeNull();
    expect(result.data![0]).toHaveProperty('id');
    expect(result.data![0]).toHaveProperty('email');
    expect(result.data![0]).toHaveProperty('role');
  });

  contractTest('select() with specific columns should only return those', async (db) => {
    const email = generateTestEmail();
    await db.from('users').insert({ email, role: 'manager' });

    const result = await db.from('users').select('email,role').eq('email', email);

    expect(result.error).toBeNull();
    expect(result.data![0]).toHaveProperty('email');
    expect(result.data![0]).toHaveProperty('role');
    expect(Object.keys(result.data![0])).not.toContain('id');
    expect(Object.keys(result.data![0])).not.toContain('created_at');
  });
});

// ============================================================================
// Complex Query Chains
// ============================================================================

describe('Contract Tests: Complex Query Chains', () => {
  contractTest('should handle full chain: select, eq, order, limit', async (db) => {
    const result = await db
      .from('users')
      .select('email,role')
      .eq('role', 'manager')
      .order('email', { ascending: true })
      .limit(5);

    expect(result.error).toBeNull();
    expect(result.data!.length).toBeLessThanOrEqual(5);

    // All should be managers
    result.data!.forEach((user) => {
      expect(user.role).toBe('manager');
    });

    // Should be sorted
    const emails = result.data!.map((u) => u.email);
    const sortedEmails = [...emails].sort();
    expect(emails).toEqual(sortedEmails);
  });

  contractTest('should handle filter, order, then single', async (db) => {
    const email = generateTestEmail();
    await db.from('users').insert({ email, role: 'manager' });

    const result = await db.from('users').select('*').eq('email', email).order('email').single();

    expect(result.error).toBeNull();
    expect((result.data as { email: string }).email).toBe(email);
  });
});

// ============================================================================
// Standalone Mock Tests
// ============================================================================

describe('Mock Database Query Modifiers', () => {
  let db: ContractDatabase;

  beforeEach(() => {
    db = createMockAdapter();
  });

  it('should chain all modifiers fluently', async () => {
    const result = await db
      .from('users')
      .select('id,email,role')
      .eq('role', 'manager')
      .neq('email', 'excluded@test.com')
      .order('email')
      .limit(10);

    expect(result.error).toBeNull();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should maintain filter state across chains', async () => {
    const email = generateTestEmail();
    await db.from('users').insert({ email, role: 'manager' });

    // Build query in steps
    let query = db.from('users').select('*');
    query = query.eq('role', 'manager');
    query = query.eq('email', email);

    const result = await query;

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
  });

  it('should handle empty in() array', async () => {
    const result = await db.from('users').select('*').in('role', []);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(0);
  });

  it('should preserve order when limit is larger than result set', async () => {
    const result = await db.from('users').select('email').order('email').limit(1000);

    expect(result.error).toBeNull();

    // Should still be sorted
    const emails = result.data!.map((u) => u.email);
    const sortedEmails = [...emails].sort();
    expect(emails).toEqual(sortedEmails);
  });
});
