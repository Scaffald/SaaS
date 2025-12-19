/**
 * Contract Tests: Basic CRUD Operations
 * REQ-305: Contract Tests for MockDatabase Parity
 *
 * These tests verify that MockDatabase and real Supabase behave identically
 * for Create, Read, Update, and Delete operations.
 *
 * Run with real database:
 *   VITE_RUN_CONTRACT_TESTS=true npm test -- contract.crud
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  contractTest,
  contractTestSuite,
  createMockAdapter,
  generateTestId,
  generateTestEmail,
  type ContractDatabase,
  type ContractTestHelpers,
} from './contractTestFactory';

// ============================================================================
// CRUD Contract Tests using contractTest helper
// ============================================================================

describe('Contract Tests: CRUD Operations', () => {
  // --------------------------------------------------------------------------
  // CREATE Operations
  // --------------------------------------------------------------------------

  contractTest('should insert a single user', async (db) => {
    const email = generateTestEmail();
    const result = await db.from('users').insert({
      email,
      role: 'manager',
    });

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data).toHaveLength(1);
    expect(result.data![0].email).toBe(email);
    expect(result.data![0].role).toBe('manager');
    expect(result.data![0].id).toBeDefined();
  });

  contractTest('should insert multiple users', async (db) => {
    const email1 = generateTestEmail();
    const email2 = generateTestEmail();

    const result = await db.from('users').insert([
      { email: email1, role: 'manager' },
      { email: email2, role: 'broker' },
    ]);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data![0].email).toBe(email1);
    expect(result.data![1].email).toBe(email2);
  });

  contractTest('should auto-generate id for inserted records', async (db) => {
    const email = generateTestEmail();
    const result = await db.from('users').insert({
      email,
      role: 'manager',
    });

    expect(result.error).toBeNull();
    expect(result.data![0].id).toBeDefined();
    expect(typeof result.data![0].id).toBe('string');
    expect(result.data![0].id.length).toBeGreaterThan(0);
  });

  contractTest('should auto-generate created_at timestamp', async (db) => {
    const email = generateTestEmail();
    const result = await db.from('users').insert({
      email,
      role: 'manager',
    });

    expect(result.error).toBeNull();
    expect(result.data![0].created_at).toBeDefined();
  });

  // --------------------------------------------------------------------------
  // READ Operations
  // --------------------------------------------------------------------------

  contractTest('should select all records from a table', async (db) => {
    const result = await db.from('users').select('*');

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  contractTest('should select specific columns', async (db) => {
    const email = generateTestEmail();
    await db.from('users').insert({ email, role: 'manager' });

    const result = await db.from('users').select('email,role').eq('email', email);

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data![0]).toHaveProperty('email');
    expect(result.data![0]).toHaveProperty('role');
    // Should not have 'id' since we didn't select it
    expect(Object.keys(result.data![0])).not.toContain('id');
  });

  contractTest('should return empty array for no matches', async (db) => {
    const result = await db
      .from('users')
      .select('*')
      .eq('email', 'definitely-not-existing-email-12345@test.com');

    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // UPDATE Operations
  // --------------------------------------------------------------------------

  contractTest('should update matching records', async (db) => {
    const email = generateTestEmail();
    await db.from('users').insert({ email, role: 'manager' });

    const updateResult = await db.from('users').update({ role: 'admin' }).eq('email', email);

    expect(updateResult.error).toBeNull();

    // Verify the update
    const verifyResult = await db.from('users').select('*').eq('email', email);
    expect(verifyResult.data![0].role).toBe('admin');
  });

  contractTest('should update multiple matching records', async (db) => {
    const prefix = generateTestId('batch');
    const email1 = `${prefix}-1@test.local`;
    const email2 = `${prefix}-2@test.local`;

    await db.from('users').insert([
      { email: email1, role: 'manager' },
      { email: email2, role: 'manager' },
    ]);

    // Update all managers with prefix in email
    const updateResult = await db.from('users').update({ role: 'broker' }).eq('role', 'manager');

    expect(updateResult.error).toBeNull();
  });

  contractTest('should not update non-matching records', async (db) => {
    const email = generateTestEmail();
    await db.from('users').insert({ email, role: 'manager' });

    // Update with non-matching filter
    await db.from('users').update({ role: 'admin' }).eq('email', 'nonexistent@test.com');

    // Original should be unchanged
    const verifyResult = await db.from('users').select('*').eq('email', email);
    expect(verifyResult.data![0].role).toBe('manager');
  });

  // --------------------------------------------------------------------------
  // DELETE Operations
  // --------------------------------------------------------------------------

  contractTest('should delete matching records', async (db) => {
    const email = generateTestEmail();
    await db.from('users').insert({ email, role: 'manager' });

    // Verify it exists
    const beforeDelete = await db.from('users').select('*').eq('email', email);
    expect(beforeDelete.data).toHaveLength(1);

    // Delete it
    const deleteResult = await db.from('users').delete().eq('email', email);
    expect(deleteResult.error).toBeNull();

    // Verify it's gone
    const afterDelete = await db.from('users').select('*').eq('email', email);
    expect(afterDelete.data).toHaveLength(0);
  });

  contractTest('should not delete non-matching records', async (db) => {
    const email = generateTestEmail();
    await db.from('users').insert({ email, role: 'manager' });

    // Delete with non-matching filter
    await db.from('users').delete().eq('email', 'nonexistent@test.com');

    // Original should still exist
    const verifyResult = await db.from('users').select('*').eq('email', email);
    expect(verifyResult.data).toHaveLength(1);
  });
});

// ============================================================================
// CRUD Contract Tests for Projects (with foreign keys)
// ============================================================================

describe('Contract Tests: CRUD with Foreign Keys', () => {
  contractTest('should insert project with valid foreign key', async (db) => {
    // First insert a user to reference
    const email = generateTestEmail();
    const userResult = await db.from('users').insert({ email, role: 'manager' });
    const managerId = userResult.data![0].id;

    // Insert project referencing the user
    const projectResult = await db.from('projects').insert({
      name: `Test Project ${generateTestId()}`,
      manager_id: managerId,
    });

    expect(projectResult.error).toBeNull();
    expect(projectResult.data![0].name).toContain('Test Project');
    expect(projectResult.data![0].manager_id).toBe(managerId);
  });

  contractTest('should cascade read with related data', async (db) => {
    // Setup data
    const email = generateTestEmail();
    const userResult = await db.from('users').insert({ email, role: 'manager' });
    const managerId = userResult.data![0].id;

    const projectName = `Test Project ${generateTestId()}`;
    await db.from('projects').insert({ name: projectName, manager_id: managerId });

    // Read projects and verify relationship
    const projectsResult = await db.from('projects').select('*').eq('manager_id', managerId);

    expect(projectsResult.error).toBeNull();
    expect(projectsResult.data).toHaveLength(1);
    expect(projectsResult.data![0].name).toBe(projectName);
  });
});

// ============================================================================
// Standalone Mock Tests (always run, don't need real database)
// ============================================================================

describe('Mock Database CRUD Operations', () => {
  let db: ContractDatabase;

  beforeEach(() => {
    db = createMockAdapter();
  });

  it('should handle full CRUD lifecycle', async () => {
    const email = generateTestEmail();

    // Create
    const createResult = await db.from('users').insert({ email, role: 'manager' });
    expect(createResult.error).toBeNull();
    const userId = createResult.data![0].id;

    // Read
    const readResult = await db.from('users').select('*').eq('id', userId).single();
    expect(readResult.error).toBeNull();
    expect((readResult.data as { email: string }).email).toBe(email);

    // Update
    const updateResult = await db.from('users').update({ role: 'admin' }).eq('id', userId);
    expect(updateResult.error).toBeNull();

    // Verify update
    const verifyResult = await db.from('users').select('*').eq('id', userId).single();
    expect((verifyResult.data as { role: string }).role).toBe('admin');

    // Delete
    const deleteResult = await db.from('users').delete().eq('id', userId);
    expect(deleteResult.error).toBeNull();

    // Verify delete
    const finalResult = await db.from('users').select('*').eq('id', userId);
    expect(finalResult.data).toHaveLength(0);
  });

  it('should preserve data integrity across operations', async () => {
    const email1 = generateTestEmail();
    const email2 = generateTestEmail();

    // Insert two users
    await db.from('users').insert([
      { email: email1, role: 'manager' },
      { email: email2, role: 'broker' },
    ]);

    // Update one
    await db.from('users').update({ role: 'admin' }).eq('email', email1);

    // Verify the other wasn't affected
    const user2 = await db.from('users').select('*').eq('email', email2);
    expect(user2.data![0].role).toBe('broker');
  });

  it('should handle concurrent insert operations', async () => {
    const emails = Array.from({ length: 5 }, () => generateTestEmail());

    // Insert all concurrently
    const results = await Promise.all(
      emails.map((email) => db.from('users').insert({ email, role: 'manager' }))
    );

    // All should succeed
    results.forEach((result) => {
      expect(result.error).toBeNull();
    });

    // All should have unique IDs
    const ids = results.map((r) => r.data![0].id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(5);
  });
});
