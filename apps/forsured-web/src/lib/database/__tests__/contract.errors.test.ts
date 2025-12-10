/**
 * Contract Tests: Error Handling
 * REQ-305: Contract Tests for MockDatabase Parity
 *
 * These tests verify that MockDatabase and real Supabase produce identical
 * error codes and behavior for constraint violations and invalid queries.
 *
 * Run with real database:
 *   VITE_RUN_CONTRACT_TESTS=true npm test -- contract.errors
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  contractTest,
  createMockAdapter,
  generateTestId,
  generateTestEmail,
  type ContractDatabase,
} from './contractTestFactory';
import { PG_ERROR_CODES, POSTGREST_ERROR_CODES } from '../mockDatabase.errors';

// ============================================================================
// NOT NULL Constraint Violations
// ============================================================================

describe('Contract Tests: NOT NULL Violations', () => {
  contractTest('should error with 23502 for missing required email', async (db) => {
    const result = await db.from('users').insert({
      role: 'manager',
      // email is missing
    } as Record<string, unknown>);

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(PG_ERROR_CODES.NOT_NULL_VIOLATION);
    expect(result.error!.message).toContain('email');
  });

  contractTest('should error with 23502 for missing required role', async (db) => {
    const result = await db.from('users').insert({
      email: generateTestEmail(),
      // role is missing
    } as Record<string, unknown>);

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(PG_ERROR_CODES.NOT_NULL_VIOLATION);
    expect(result.error!.message).toContain('role');
  });

  contractTest('should error with 23502 for missing project name', async (db) => {
    const email = generateTestEmail();
    const userResult = await db.from('users').insert({ email, role: 'manager' });
    const managerId = userResult.data![0].id;

    const result = await db.from('projects').insert({
      manager_id: managerId,
      // name is missing
    } as Record<string, unknown>);

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(PG_ERROR_CODES.NOT_NULL_VIOLATION);
    expect(result.error!.message).toContain('name');
  });
});

// ============================================================================
// UNIQUE Constraint Violations
// ============================================================================

describe('Contract Tests: UNIQUE Violations', () => {
  contractTest('should error with 23505 for duplicate email', async (db) => {
    const email = generateTestEmail();

    // First insert should succeed
    const firstResult = await db.from('users').insert({ email, role: 'manager' });
    expect(firstResult.error).toBeNull();

    // Second insert with same email should fail
    const secondResult = await db.from('users').insert({ email, role: 'broker' });

    expect(secondResult.error).not.toBeNull();
    expect(secondResult.error!.code).toBe(PG_ERROR_CODES.UNIQUE_VIOLATION);
    expect(secondResult.error!.message).toContain('email');
  });

  contractTest('should error with 23505 for duplicate policy_number', async (db) => {
    // Setup required data
    const email = generateTestEmail();
    const userResult = await db.from('users').insert({ email, role: 'manager' });
    const managerId = userResult.data![0].id;

    const projectResult = await db.from('projects').insert({
      name: `Project ${generateTestId()}`,
      manager_id: managerId,
    });
    const projectId = projectResult.data![0].id;

    await db.from('subcontractors').insert({
      id: 'test-sub-dup-policy',
      name: 'Test Sub',
      company: 'Test Co',
      contact_info: { email: 'sub@test.com', phone: '555-0100' },
    });

    await db.from('documents').insert({
      id: 'test-doc-dup-policy',
      subcontractor_id: 'test-sub-dup-policy',
      project_id: projectId,
      file_url: 'https://example.com/doc.pdf',
      status: 'approved',
    });

    const policyNumber = `POL-${generateTestId()}`;

    // First policy insert
    const firstResult = await db.from('policies').insert({
      document_id: 'test-doc-dup-policy',
      policy_number: policyNumber,
      carrier: 'Test Insurance',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      coverage_type: 'general_liability',
      coverage_amount: 1000000,
    });
    expect(firstResult.error).toBeNull();

    // Second insert with same policy_number should fail
    const secondResult = await db.from('policies').insert({
      document_id: 'test-doc-dup-policy',
      policy_number: policyNumber,
      carrier: 'Other Insurance',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      coverage_type: 'workers_comp',
      coverage_amount: 500000,
    });

    expect(secondResult.error).not.toBeNull();
    expect(secondResult.error!.code).toBe(PG_ERROR_CODES.UNIQUE_VIOLATION);
    expect(secondResult.error!.message).toContain('policy_number');
  });
});

// ============================================================================
// FOREIGN KEY Constraint Violations
// ============================================================================

describe('Contract Tests: FOREIGN KEY Violations', () => {
  contractTest('should error with 23503 for invalid manager_id', async (db) => {
    const result = await db.from('projects').insert({
      name: 'Test Project',
      manager_id: 'non-existent-user-id-12345',
    });

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(PG_ERROR_CODES.FOREIGN_KEY_VIOLATION);
    expect(result.error!.message).toContain('manager_id');
  });

  contractTest('should error with 23503 for invalid document_id on policies', async (db) => {
    const result = await db.from('policies').insert({
      document_id: 'non-existent-doc-id-12345',
      policy_number: `POL-${generateTestId()}`,
      carrier: 'Test Insurance',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      coverage_type: 'general_liability',
      coverage_amount: 1000000,
    });

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(PG_ERROR_CODES.FOREIGN_KEY_VIOLATION);
    expect(result.error!.message).toContain('document_id');
  });

  contractTest('should error with 23503 for invalid policy_id on endorsements', async (db) => {
    const result = await db.from('endorsements').insert({
      policy_id: 'non-existent-policy-id-12345',
      type: 'additional_insured',
      details: { description: 'Test endorsement' },
    });

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(PG_ERROR_CODES.FOREIGN_KEY_VIOLATION);
    expect(result.error!.message).toContain('policy_id');
  });
});

// ============================================================================
// CHECK Constraint Violations
// ============================================================================

describe('Contract Tests: CHECK Violations', () => {
  contractTest('should error with 23514 for score below minimum', async (db) => {
    // Setup foreign keys
    const email = generateTestEmail();
    const userResult = await db.from('users').insert({ email, role: 'manager' });
    const managerId = userResult.data![0].id;

    const projectResult = await db.from('projects').insert({
      name: `Project ${generateTestId()}`,
      manager_id: managerId,
    });
    const projectId = projectResult.data![0].id;

    await db.from('subcontractors').insert({
      id: `sub-check-${generateTestId()}`,
      name: 'Test Sub',
      company: 'Test Co',
      contact_info: { email: 'test@test.com', phone: '555-0100' },
    });

    const result = await db.from('compliance_scores').insert({
      project_id: projectId,
      subcontractor_id: `sub-check-${generateTestId()}`,
      score: -10, // Below minimum of 0
      gaps: [],
    });

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(PG_ERROR_CODES.CHECK_VIOLATION);
    expect(result.error!.message).toContain('score');
  });

  contractTest('should error with 23514 for score above maximum', async (db) => {
    // Use existing seeded data since FK setup is complex
    const result = await db.from('compliance_scores').insert({
      project_id: 'project-1', // Seeded
      subcontractor_id: 'sub-1', // Seeded
      score: 150, // Above maximum of 100
      gaps: [],
    });

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(PG_ERROR_CODES.CHECK_VIOLATION);
  });

  contractTest('should error with 23514 for policy end_date before start_date', async (db) => {
    // Setup required data with consistent IDs
    const testId = generateTestId('date-check');
    const email = generateTestEmail();
    const userResult = await db.from('users').insert({ email, role: 'manager' });
    const managerId = userResult.data![0].id;

    const projectResult = await db.from('projects').insert({
      name: `Project ${testId}`,
      manager_id: managerId,
    });
    const projectId = projectResult.data![0].id;

    const subId = `sub-${testId}`;
    await db.from('subcontractors').insert({
      id: subId,
      name: 'Test Sub',
      company: 'Test Co',
      contact_info: { email: 'sub@test.com', phone: '555-0100' },
    });

    const docId = `doc-${testId}`;
    await db.from('documents').insert({
      id: docId,
      subcontractor_id: subId, // Use same subId
      project_id: projectId,
      file_url: 'https://example.com/doc.pdf',
      status: 'approved',
    });

    const result = await db.from('policies').insert({
      document_id: docId, // Use same docId
      policy_number: `POL-${testId}`,
      carrier: 'Test Insurance',
      start_date: '2024-12-31',
      end_date: '2024-01-01', // Before start_date
      coverage_type: 'general_liability',
      coverage_amount: 1000000,
    });

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(PG_ERROR_CODES.CHECK_VIOLATION);
    expect(result.error!.message).toContain('end_date');
  });
});

// ============================================================================
// ENUM Validation Errors
// ============================================================================

describe('Contract Tests: ENUM Validation', () => {
  contractTest('should error with 22P02 for invalid user role', async (db) => {
    const result = await db.from('users').insert({
      email: generateTestEmail(),
      role: 'invalid_role_xyz',
    } as Record<string, unknown>);

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(PG_ERROR_CODES.INVALID_TEXT_REPRESENTATION);
    expect(result.error!.message).toContain('role');
  });

  contractTest('should error with 22P02 for invalid document status', async (db) => {
    const result = await db.from('documents').insert({
      subcontractor_id: 'sub-1',
      project_id: 'project-1',
      file_url: 'https://example.com/doc.pdf',
      status: 'invalid_status_xyz',
    } as Record<string, unknown>);

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(PG_ERROR_CODES.INVALID_TEXT_REPRESENTATION);
    expect(result.error!.message).toContain('status');
  });

  contractTest('should error with 22P02 for invalid coverage_type', async (db) => {
    const result = await db.from('policies').insert({
      document_id: 'doc-1',
      policy_number: `POL-${generateTestId()}`,
      carrier: 'Test',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      coverage_type: 'invalid_coverage_xyz',
      coverage_amount: 1000000,
    } as Record<string, unknown>);

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(PG_ERROR_CODES.INVALID_TEXT_REPRESENTATION);
  });
});

// ============================================================================
// Column/Table Not Found Errors
// ============================================================================

describe('Contract Tests: Undefined Column/Table Errors', () => {
  contractTest('should error with 42703 for invalid column in select', async (db) => {
    const result = await db.from('users').select('nonexistent_column');

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(PG_ERROR_CODES.UNDEFINED_COLUMN);
    expect(result.error!.message).toContain('nonexistent_column');
  });

  contractTest('should error with 42703 for invalid column in eq()', async (db) => {
    const result = await db.from('users').select('*').eq('nonexistent_column', 'value');

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(PG_ERROR_CODES.UNDEFINED_COLUMN);
  });

  contractTest('should error with 42703 for invalid column in neq()', async (db) => {
    const result = await db.from('users').select('*').neq('nonexistent_column', 'value');

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(PG_ERROR_CODES.UNDEFINED_COLUMN);
  });

  contractTest('should error with 42P01 for invalid table name', async (db) => {
    const result = await db.from('nonexistent_table' as 'users').select('*');

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(PG_ERROR_CODES.UNDEFINED_TABLE);
    expect(result.error!.message).toContain('nonexistent_table');
  });
});

// ============================================================================
// PostgREST Specific Errors
// ============================================================================

describe('Contract Tests: PostgREST Errors', () => {
  contractTest('should error with PGRST116 for single() with no results', async (db) => {
    const result = await db
      .from('users')
      .select('*')
      .eq('email', 'absolutely-nonexistent-email@test.local')
      .single();

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(POSTGREST_ERROR_CODES.PGRST116);
    expect(result.data).toBeNull();
  });

  contractTest('should error with PGRST116 for single() with multiple results', async (db) => {
    // Create two users with same role
    const email1 = generateTestEmail();
    const email2 = generateTestEmail();
    await db.from('users').insert([
      { email: email1, role: 'manager' },
      { email: email2, role: 'manager' },
    ]);

    // Query by role which returns multiple
    const result = await db.from('users').select('*').eq('role', 'manager').single();

    expect(result.error).not.toBeNull();
    expect(result.error!.code).toBe(POSTGREST_ERROR_CODES.PGRST116);
    expect(result.error!.message).toContain('multiple');
  });
});

// ============================================================================
// Error Structure Validation
// ============================================================================

describe('Contract Tests: Error Object Structure', () => {
  contractTest('all errors should have code, message, details, hint', async (db) => {
    // Trigger a known error
    const result = await db.from('users').insert({
      role: 'manager',
      // email missing
    } as Record<string, unknown>);

    expect(result.error).not.toBeNull();
    expect(result.error).toHaveProperty('code');
    expect(result.error).toHaveProperty('message');
    expect(result.error).toHaveProperty('details');
    expect(result.error).toHaveProperty('hint');

    expect(typeof result.error!.code).toBe('string');
    expect(typeof result.error!.message).toBe('string');
  });
});

// ============================================================================
// Standalone Mock Tests
// ============================================================================

describe('Mock Database Error Handling', () => {
  let db: ContractDatabase;

  beforeEach(() => {
    db = createMockAdapter();
  });

  it('should cascade errors correctly through Promise chain', async () => {
    const result = await db.from('users').insert({ role: 'manager' } as Record<string, unknown>);

    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });

  it('should not throw, always return error in result', async () => {
    // None of these should throw
    const results = await Promise.all([
      db.from('users').insert({} as Record<string, unknown>),
      db.from('nonexistent' as 'users').select('*'),
      db.from('users').select('invalid_column'),
    ]);

    results.forEach((result) => {
      expect(result.error).not.toBeNull();
    });
  });

  it('should provide helpful error hints', async () => {
    const result = await db.from('users').insert({ role: 'manager' } as Record<string, unknown>);

    expect(result.error!.hint).toBeDefined();
    expect(result.error!.hint!.length).toBeGreaterThan(0);
  });
});
