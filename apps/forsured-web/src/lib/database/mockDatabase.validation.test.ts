/**
 * REQ-106: Mock Database Validation Tests
 *
 * MANDATORY per CLAUDE.md: These tests verify that the mock database
 * matches the real Supabase API behavior. Must be written BEFORE implementation.
 *
 * Coverage Requirement: 100% of all mock methods
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockDatabase } from './mockDatabase';
import type { DBUser } from '../../types/database.types';

describe('MockDatabase - API Signature Tests', () => {
  let db: MockDatabase;

  beforeEach(() => {
    db = new MockDatabase();
  });

  describe('Core API Methods', () => {
    it('should have from() method that returns query builder', () => {
      const query = db.from('users');
      expect(query).toBeDefined();
      expect(query).toHaveProperty('select');
      expect(query).toHaveProperty('insert');
      expect(query).toHaveProperty('update');
      expect(query).toHaveProperty('delete');
    });

    it('should support method chaining', () => {
      const query = db.from('users').select('*').eq('role', 'manager');
      expect(query).toBeDefined();
    });

    it('should return {data, error} format matching Supabase', async () => {
      const result = await db.from('users').select('*');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      expect(result.error).toBeNull();
    });
  });

  describe('Query Builder Methods', () => {
    it('should have select() method', () => {
      const query = db.from('users').select();
      expect(query).toHaveProperty('eq');
    });

    it('should have insert() method', () => {
      const query = db
        .from('users')
        .insert({ email: 'test@example.com', role: 'manager' });
      expect(query).toBeDefined();
    });

    it('should have update() method', () => {
      const query = db.from('users').update({ role: 'admin' });
      expect(query).toHaveProperty('eq');
    });

    it('should have delete() method', () => {
      const query = db.from('users').delete();
      expect(query).toHaveProperty('eq');
    });
  });

  describe('Filter Methods', () => {
    it('should have eq() filter', () => {
      const query = db.from('users').select('*').eq('role', 'manager');
      expect(query).toBeDefined();
    });

    it('should have neq() filter', () => {
      const query = db.from('users').select('*').neq('role', 'admin');
      expect(query).toBeDefined();
    });

    it('should have in() filter', () => {
      const query = db
        .from('users')
        .select('*')
        .in('role', ['manager', 'broker']);
      expect(query).toBeDefined();
    });

    it('should have order() method', () => {
      const query = db
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      expect(query).toBeDefined();
    });

    it('should have limit() method', () => {
      const query = db.from('users').select('*').limit(10);
      expect(query).toBeDefined();
    });

    it('should have single() method', () => {
      const query = db.from('users').select('*').eq('id', 'test-id').single();
      expect(query).toBeDefined();
    });
  });
});

describe('MockDatabase - Constraint Validation Tests', () => {
  let db: MockDatabase;

  beforeEach(() => {
    db = new MockDatabase();
  });

  describe('Required Fields', () => {
    it('should reject insert with missing required field (email)', async () => {
      const result = await db.from('users').insert({
        role: 'manager',
      } as any);

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('23502'); // NOT NULL violation
      expect(result.error?.message).toContain('email');
    });

    it('should reject insert with missing required field (name)', async () => {
      const result = await db.from('projects').insert({
        manager_id: 'test-manager-id',
      } as any);

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('23502');
      expect(result.error?.message).toContain('name');
    });
  });

  describe('Enum Validation', () => {
    it('should reject invalid user role', async () => {
      const result = await db.from('users').insert({
        email: 'test@example.com',
        role: 'invalid_role',
      } as any);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('role');
      expect(result.error?.message).toContain('invalid');
    });

    it('should reject invalid document status', async () => {
      const result = await db.from('documents').insert({
        subcontractor_id: 'sub-id',
        project_id: 'proj-id',
        file_url: 'http://example.com/file.pdf',
        status: 'invalid_status',
      } as any);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('status');
    });

    it('should accept valid enum values', async () => {
      // First insert a user and project to satisfy foreign keys
      await db.from('users').insert({
        id: 'manager-1',
        email: 'manager@example.com',
        role: 'manager',
      });

      await db.from('projects').insert({
        id: 'project-1',
        name: 'Test Project',
        manager_id: 'manager-1',
      });

      await db.from('subcontractors').insert({
        id: 'sub-1',
        name: 'John Doe',
        company: 'ABC Construction',
        contact_info: { email: 'john@abc.com', phone: '555-0100' },
      });

      const result = await db.from('documents').insert({
        subcontractor_id: 'sub-1',
        project_id: 'project-1',
        file_url: 'http://example.com/file.pdf',
        status: 'pending',
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });
  });

  describe('Numeric Constraints', () => {
    it('should enforce score between 0 and 100', async () => {
      const result = await db.from('compliance_scores').insert({
        project_id: 'proj-id',
        subcontractor_id: 'sub-id',
        score: 150,
        gaps: [],
      } as any);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('score');
      expect(result.error?.message).toMatch(/0.*100/);
    });

    it('should reject negative score', async () => {
      const result = await db.from('compliance_scores').insert({
        project_id: 'proj-id',
        subcontractor_id: 'sub-id',
        score: -10,
        gaps: [],
      } as any);

      expect(result.error).not.toBeNull();
    });

    it('should accept score in valid range', async () => {
      // Setup foreign keys
      await db.from('users').insert({
        id: 'mgr-1',
        email: 'mgr@example.com',
        role: 'manager',
      });
      await db.from('projects').insert({
        id: 'proj-1',
        name: 'Test',
        manager_id: 'mgr-1',
      });
      await db.from('subcontractors').insert({
        id: 'sub-1',
        name: 'Test Sub',
        company: 'Test Co',
        contact_info: { email: 'test@example.com', phone: '555-0100' },
      });

      const result = await db.from('compliance_scores').insert({
        project_id: 'proj-1',
        subcontractor_id: 'sub-1',
        score: 75,
        gaps: [],
      });

      expect(result.error).toBeNull();
    });
  });

  describe('Date Constraints', () => {
    it('should reject policy where end_date <= start_date', async () => {
      // Setup foreign keys first
      await db
        .from('users')
        .insert({ id: 'mgr-date-1', email: 'mgr-date@test.com', role: 'manager' });
      await db
        .from('projects')
        .insert({ id: 'proj-date-1', name: 'P1', manager_id: 'mgr-date-1' });
      await db.from('subcontractors').insert({
        id: 'sub-date-1',
        name: 'Sub',
        company: 'Co',
        contact_info: { email: 'sub-date@test.com', phone: '555-0100' },
      });
      await db.from('documents').insert({
        id: 'doc-date-1',
        subcontractor_id: 'sub-date-1',
        project_id: 'proj-date-1',
        file_url: 'http://example.com/doc.pdf',
        status: 'approved',
      });

      const result = await db.from('policies').insert({
        document_id: 'doc-date-1',
        policy_number: 'POL-12345',
        carrier: 'Test Insurance',
        start_date: '2024-12-31',
        end_date: '2024-01-01', // Before start_date
        coverage_type: 'general_liability',
        coverage_amount: 1000000,
      } as any);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('end_date');
      expect(result.error?.message).toContain('start_date');
    });

    it('should accept policy with valid date range', async () => {
      // Setup foreign keys
      await db
        .from('users')
        .insert({ id: 'mgr-1', email: 'mgr@test.com', role: 'manager' });
      await db
        .from('projects')
        .insert({ id: 'proj-1', name: 'P1', manager_id: 'mgr-1' });
      await db.from('subcontractors').insert({
        id: 'sub-1',
        name: 'Sub',
        company: 'Co',
        contact_info: { email: 'sub@test.com', phone: '555-0100' },
      });
      await db.from('documents').insert({
        id: 'doc-1',
        subcontractor_id: 'sub-1',
        project_id: 'proj-1',
        file_url: 'http://example.com/doc.pdf',
        status: 'approved',
      });

      const result = await db.from('policies').insert({
        document_id: 'doc-1',
        policy_number: 'POL-12345',
        carrier: 'Test Insurance',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        coverage_type: 'general_liability',
        coverage_amount: 1000000,
      });

      expect(result.error).toBeNull();
    });
  });

  describe('Unique Constraints', () => {
    it('should reject duplicate email', async () => {
      await db.from('users').insert({
        email: 'duplicate@example.com',
        role: 'manager',
      });

      const result = await db.from('users').insert({
        email: 'duplicate@example.com',
        role: 'broker',
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('23505'); // Unique constraint violation
      expect(result.error?.message).toContain('email');
    });

    it('should reject duplicate policy_number', async () => {
      // Setup
      await db
        .from('users')
        .insert({ id: 'mgr-1', email: 'mgr@test.com', role: 'manager' });
      await db
        .from('projects')
        .insert({ id: 'proj-1', name: 'P1', manager_id: 'mgr-1' });
      await db.from('subcontractors').insert({
        id: 'sub-1',
        name: 'Sub',
        company: 'Co',
        contact_info: { email: 'sub@test.com', phone: '555-0100' },
      });
      await db.from('documents').insert({
        id: 'doc-1',
        subcontractor_id: 'sub-1',
        project_id: 'proj-1',
        file_url: 'http://example.com/doc.pdf',
        status: 'approved',
      });

      await db.from('policies').insert({
        document_id: 'doc-1',
        policy_number: 'POL-DUPLICATE',
        carrier: 'Test Insurance',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        coverage_type: 'general_liability',
        coverage_amount: 1000000,
      });

      const result = await db.from('policies').insert({
        document_id: 'doc-1',
        policy_number: 'POL-DUPLICATE',
        carrier: 'Other Insurance',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        coverage_type: 'workers_comp',
        coverage_amount: 500000,
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('23505');
      expect(result.error?.message).toContain('policy_number');
    });
  });
});

describe('MockDatabase - Error Handling Tests', () => {
  let db: MockDatabase;

  beforeEach(() => {
    db = new MockDatabase();
  });

  describe('Foreign Key Violations', () => {
    it('should reject insert with invalid foreign key (manager_id)', async () => {
      const result = await db.from('projects').insert({
        name: 'Test Project',
        manager_id: 'non-existent-user-id',
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('23503'); // Foreign key violation
      expect(result.error?.message).toContain('manager_id');
    });

    it('should reject insert with invalid foreign key (document_id)', async () => {
      const result = await db.from('policies').insert({
        document_id: 'non-existent-doc-id',
        policy_number: 'POL-123',
        carrier: 'Test',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        coverage_type: 'general_liability',
        coverage_amount: 1000000,
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('23503');
      expect(result.error?.message).toContain('document_id');
    });
  });

  describe('Invalid Table Names', () => {
    it('should return error for non-existent table', async () => {
      const result = await db.from('non_existent_table' as any).select('*');

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('table');
      expect(result.error?.message).toContain('non_existent_table');
    });
  });

  describe('Invalid Column Names', () => {
    it('should return error for non-existent column in select', async () => {
      const result = await db.from('users').select('non_existent_column');

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('column');
    });

    it('should return error for non-existent column in eq filter', async () => {
      const result = await db
        .from('users')
        .select('*')
        .eq('non_existent_column', 'value');

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('column');
    });
  });

  describe('Error Message Format', () => {
    it('should match Supabase error format structure', async () => {
      const result = await db.from('users').insert({ role: 'manager' } as any);

      expect(result.error).toHaveProperty('message');
      expect(result.error).toHaveProperty('code');
      expect(result.error).toHaveProperty('details');
      expect(result.error).toHaveProperty('hint');
      expect(typeof result.error?.message).toBe('string');
      expect(typeof result.error?.code).toBe('string');
    });
  });
});

describe('MockDatabase - RBAC Tests', () => {
  let db: MockDatabase;

  beforeEach(async () => {
    db = new MockDatabase();

    // Setup test data
    await db.from('users').insert([
      { id: 'manager-1', email: 'manager1@test.com', role: 'manager' },
      { id: 'manager-2', email: 'manager2@test.com', role: 'manager' },
      { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
      { id: 'sub-user-1', email: 'sub1@test.com', role: 'subcontractor' },
    ]);

    await db.from('projects').insert([
      { id: 'project-1', name: 'Manager 1 Project', manager_id: 'manager-1' },
      { id: 'project-2', name: 'Manager 2 Project', manager_id: 'manager-2' },
    ]);

    await db.from('subcontractors').insert([
      {
        id: 'sub-1',
        name: 'Sub 1',
        company: 'Company A',
        contact_info: { email: 'sub1@test.com', phone: '555-0100' },
      },
      {
        id: 'sub-2',
        name: 'Sub 2',
        company: 'Company B',
        contact_info: { email: 'sub2@test.com', phone: '555-0101' },
      },
    ]);

    await db.from('documents').insert([
      {
        id: 'doc-1',
        subcontractor_id: 'sub-1',
        project_id: 'project-1',
        file_url: 'http://example.com/doc1.pdf',
        status: 'approved',
      },
      {
        id: 'doc-2',
        subcontractor_id: 'sub-2',
        project_id: 'project-2',
        file_url: 'http://example.com/doc2.pdf',
        status: 'approved',
      },
    ]);
  });

  describe('Manager Role', () => {
    it('should see only their own projects', async () => {
      db.setCurrentUser({ id: 'manager-1', role: 'manager' });

      const result = await db.from('projects').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].id).toBe('project-1');
    });

    it('should see only documents for their projects', async () => {
      db.setCurrentUser({ id: 'manager-1', role: 'manager' });

      const result = await db.from('documents').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].project_id).toBe('project-1');
    });
  });

  describe('Subcontractor Role', () => {
    it('should see only their own documents', async () => {
      db.setCurrentUser({
        id: 'sub-user-1',
        role: 'subcontractor',
        subcontractor_id: 'sub-1',
      });

      const result = await db.from('documents').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].subcontractor_id).toBe('sub-1');
    });

    it('should not see other subcontractor documents', async () => {
      db.setCurrentUser({
        id: 'sub-user-1',
        role: 'subcontractor',
        subcontractor_id: 'sub-1',
      });

      const result = await db.from('documents').select('*');

      expect(result.error).toBeNull();
      const otherSubDocs = result.data?.filter(
        (doc) => doc.subcontractor_id === 'sub-2'
      );
      expect(otherSubDocs).toHaveLength(0);
    });
  });

  describe('Admin Role', () => {
    it('should see all projects', async () => {
      db.setCurrentUser({ id: 'admin-1', role: 'admin' });

      const result = await db.from('projects').select('*');

      expect(result.error).toBeNull();
      expect(result.data?.length).toBeGreaterThanOrEqual(2);
    });

    it('should see all documents', async () => {
      db.setCurrentUser({ id: 'admin-1', role: 'admin' });

      const result = await db.from('documents').select('*');

      expect(result.error).toBeNull();
      expect(result.data?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('RBAC is Transparent', () => {
    it('should not require manual filtering in queries', async () => {
      db.setCurrentUser({ id: 'manager-1', role: 'manager' });

      // Query without explicit manager_id filter
      const result = await db.from('projects').select('*');

      // Should still only return manager's projects
      expect(result.data?.every((p) => p.manager_id === 'manager-1')).toBe(
        true
      );
    });
  });
});

describe('MockDatabase - Query Operations Tests', () => {
  let db: MockDatabase;

  beforeEach(async () => {
    db = new MockDatabase();
    db.setCurrentUser({ id: 'admin-1', role: 'admin' }); // Admin to bypass RBAC

    // Setup data
    await db.from('users').insert([
      { id: 'user-1', email: 'user1@test.com', role: 'manager' },
      { id: 'user-2', email: 'user2@test.com', role: 'broker' },
      { id: 'user-3', email: 'user3@test.com', role: 'manager' },
    ]);
  });

  describe('Select Operations', () => {
    it('should select all columns with *', async () => {
      const result = await db.from('users').select('*');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(3);
      expect(result.data?.[0]).toHaveProperty('id');
      expect(result.data?.[0]).toHaveProperty('email');
      expect(result.data?.[0]).toHaveProperty('role');
    });

    it('should select specific columns', async () => {
      const result = await db.from('users').select('email,role');

      expect(result.error).toBeNull();
      expect(result.data?.[0]).toHaveProperty('email');
      expect(result.data?.[0]).toHaveProperty('role');
      // Should not have id if not selected
      expect(Object.keys(result.data?.[0] || {})).not.toContain('id');
    });
  });

  describe('Filter Operations', () => {
    it('should filter with eq()', async () => {
      const result = await db.from('users').select('*').eq('role', 'manager');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data?.every((u) => u.role === 'manager')).toBe(true);
    });

    it('should filter with neq()', async () => {
      const result = await db.from('users').select('*').neq('role', 'manager');

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].role).toBe('broker');
    });

    it('should filter with in()', async () => {
      const result = await db
        .from('users')
        .select('*')
        .in('role', ['manager', 'admin']);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });
  });

  describe('Ordering', () => {
    it('should order ascending by default', async () => {
      const result = await db.from('users').select('*').order('email');

      expect(result.error).toBeNull();
      const emails = result.data?.map((u) => u.email) || [];
      const sortedEmails = [...emails].sort();
      expect(emails).toEqual(sortedEmails);
    });

    it('should order descending when specified', async () => {
      const result = await db
        .from('users')
        .select('*')
        .order('email', { ascending: false });

      expect(result.error).toBeNull();
      const emails = result.data?.map((u) => u.email) || [];
      const sortedEmails = [...emails].sort().reverse();
      expect(emails).toEqual(sortedEmails);
    });
  });

  describe('Limit', () => {
    it('should limit results', async () => {
      const result = await db.from('users').select('*').limit(2);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });
  });

  describe('Single', () => {
    it('should return single record', async () => {
      const result = await db
        .from('users')
        .select('*')
        .eq('email', 'user1@test.com')
        .single();

      expect(result.error).toBeNull();
      expect(result.data).not.toBeNull();
      expect(Array.isArray(result.data)).toBe(false);
      expect((result.data as DBUser).email).toBe('user1@test.com');
    });

    it('should error when no rows found', async () => {
      const result = await db
        .from('users')
        .select('*')
        .eq('email', 'nonexistent@test.com')
        .single();

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('PGRST116'); // No rows found
    });

    it('should error when multiple rows found', async () => {
      const result = await db
        .from('users')
        .select('*')
        .eq('role', 'manager')
        .single();

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('multiple');
    });
  });

  describe('Insert Operations', () => {
    it('should insert single record', async () => {
      const result = await db.from('users').insert({
        email: 'new@test.com',
        role: 'subcontractor',
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();

      // Verify inserted
      const verify = await db
        .from('users')
        .select('*')
        .eq('email', 'new@test.com');
      expect(verify.data).toHaveLength(1);
    });

    it('should insert multiple records', async () => {
      const result = await db.from('users').insert([
        { email: 'new1@test.com', role: 'manager' },
        { email: 'new2@test.com', role: 'broker' },
      ]);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it('should auto-generate UUIDs for id field', async () => {
      const result = await db.from('users').insert({
        email: 'auto-id@test.com',
        role: 'manager',
      });

      expect(result.error).toBeNull();
      expect(result.data?.[0]).toHaveProperty('id');
      expect(typeof result.data?.[0].id).toBe('string');
      expect(result.data?.[0].id.length).toBeGreaterThan(0);
    });

    it('should auto-generate timestamps', async () => {
      const result = await db.from('users').insert({
        email: 'timestamp@test.com',
        role: 'manager',
      });

      expect(result.error).toBeNull();
      expect(result.data?.[0]).toHaveProperty('created_at');
      expect(typeof result.data?.[0].created_at).toBe('string');
    });
  });

  describe('Update Operations', () => {
    it('should update matching records', async () => {
      const result = await db
        .from('users')
        .update({ role: 'admin' })
        .eq('email', 'user1@test.com');

      expect(result.error).toBeNull();

      // Verify updated
      const verify = await db
        .from('users')
        .select('*')
        .eq('email', 'user1@test.com');
      expect(verify.data?.[0].role).toBe('admin');
    });

    it('should update multiple matching records', async () => {
      const result = await db
        .from('users')
        .update({ role: 'admin' })
        .eq('role', 'manager');

      expect(result.error).toBeNull();

      // Verify all managers updated
      const verify = await db.from('users').select('*').eq('role', 'manager');
      expect(verify.data).toHaveLength(0);
    });

    it('should auto-update updated_at timestamp', async () => {
      const before = await db
        .from('users')
        .select('*')
        .eq('email', 'user1@test.com')
        .single();
      const beforeTime = before.data?.updated_at;

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      await db
        .from('users')
        .update({ role: 'admin' })
        .eq('email', 'user1@test.com');

      const after = await db
        .from('users')
        .select('*')
        .eq('email', 'user1@test.com')
        .single();
      const afterTime = after.data?.updated_at;

      if (beforeTime && afterTime) {
        expect(new Date(afterTime).getTime()).toBeGreaterThan(
          new Date(beforeTime).getTime()
        );
      }
    });
  });

  describe('Delete Operations', () => {
    it('should delete matching records', async () => {
      const result = await db
        .from('users')
        .delete()
        .eq('email', 'user1@test.com');

      expect(result.error).toBeNull();

      // Verify deleted
      const verify = await db
        .from('users')
        .select('*')
        .eq('email', 'user1@test.com');
      expect(verify.data).toHaveLength(0);
    });

    it('should delete multiple matching records', async () => {
      const result = await db.from('users').delete().eq('role', 'manager');

      expect(result.error).toBeNull();

      // Verify deleted
      const verify = await db.from('users').select('*').eq('role', 'manager');
      expect(verify.data).toHaveLength(0);
    });
  });
});

/**
 * REQ-214: Cross-Schema Foreign Key Constraint Tests
 *
 * These tests validate that MockDatabase correctly enforces foreign key
 * constraints across forsured and core schemas for the dual-schema architecture.
 *
 * Cross-schema FKs tested:
 * - forsured.projects.organization_id → core.organizations.id
 * - forsured.documents.uploaded_by_scaffald_user_id → core.users.id
 */
describe('MockDatabase - Cross-Schema Foreign Key Constraints', () => {
  let db: MockDatabase;

  beforeEach(() => {
    db = new MockDatabase();
  });

  describe('forsured.projects → core.organizations FK', () => {
    it('should enforce FK constraint on organization_id - reject invalid organization', async () => {
      // First, create a valid user for manager_id
      await db.from('users').insert({
        id: 'user-1',
        email: 'manager@example.com',
        role: 'manager',
      });

      // Try to insert project with invalid organization_id
      const result = await db.from('projects').insert({
        name: 'Test Project',
        manager_id: 'user-1',
        organization_id: 'non-existent-org-id',
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('23503'); // PostgreSQL FK violation
      expect(result.error?.message).toContain('organization_id');
    });

    it('should allow insert with valid organization_id', async () => {
      // Create organization first (simulates core.organizations)
      await db.from('organizations').insert({
        id: 'org-1',
        name: 'Test Organization',
        slug: 'test-org',
        type: 'general_contractor',
      });

      // Create user for manager_id
      await db.from('users').insert({
        id: 'user-1',
        email: 'manager@example.com',
        role: 'manager',
      });

      // Insert project with valid organization_id
      const result = await db.from('projects').insert({
        name: 'Test Project',
        manager_id: 'user-1',
        organization_id: 'org-1',
      });

      expect(result.error).toBeNull();
      expect(result.data?.[0]?.organization_id).toBe('org-1');
    });

    it('should allow NULL for optional organization_id FK', async () => {
      // Create user for manager_id
      await db.from('users').insert({
        id: 'user-1',
        email: 'manager@example.com',
        role: 'manager',
      });

      // Insert project without organization_id (null/undefined)
      const result = await db.from('projects').insert({
        name: 'Test Project',
        manager_id: 'user-1',
        // organization_id is intentionally omitted (NULL is valid for optional FK)
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });
  });

  describe('forsured.documents → core.users FK (uploaded_by)', () => {
    beforeEach(async () => {
      // Setup base data: user, organization, project, subcontractor
      await db.from('users').insert({
        id: 'user-1',
        email: 'manager@example.com',
        role: 'manager',
      });
      await db.from('projects').insert({
        id: 'project-1',
        name: 'Test Project',
        manager_id: 'user-1',
      });
      await db.from('subcontractors').insert({
        id: 'sub-1',
        name: 'Test Sub',
        company: 'Test Co',
        contact_info: { email: 'test@example.com', phone: '555-0100' },
      });
    });

    it('should enforce FK constraint on uploaded_by_scaffald_user_id - reject invalid user', async () => {
      const result = await db.from('documents').insert({
        subcontractor_id: 'sub-1',
        project_id: 'project-1',
        file_url: 'http://example.com/file.pdf',
        status: 'pending',
        uploaded_by_scaffald_user_id: 'non-existent-user-id',
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('23503'); // PostgreSQL FK violation
      expect(result.error?.message).toContain('uploaded_by_scaffald_user_id');
    });

    it('should allow insert with valid uploaded_by_scaffald_user_id', async () => {
      const result = await db.from('documents').insert({
        subcontractor_id: 'sub-1',
        project_id: 'project-1',
        file_url: 'http://example.com/file.pdf',
        status: 'pending',
        uploaded_by_scaffald_user_id: 'user-1', // Valid user from scaffald.users
      });

      expect(result.error).toBeNull();
      expect(result.data?.[0]?.uploaded_by_scaffald_user_id).toBe('user-1');
    });

    it('should allow NULL for optional uploaded_by_scaffald_user_id FK', async () => {
      const result = await db.from('documents').insert({
        subcontractor_id: 'sub-1',
        project_id: 'project-1',
        file_url: 'http://example.com/file.pdf',
        status: 'pending',
        // uploaded_by_scaffald_user_id intentionally omitted (NULL is valid)
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });
  });

  describe('Cross-Schema Organization Constraints', () => {
    it('should enforce unique slug constraint on organizations', async () => {
      await db.from('organizations').insert({
        id: 'org-1',
        name: 'Test Organization',
        slug: 'test-org',
        type: 'general_contractor',
      });

      const result = await db.from('organizations').insert({
        id: 'org-2',
        name: 'Another Organization',
        slug: 'test-org', // Duplicate slug
        type: 'broker',
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('23505'); // Unique constraint violation
      expect(result.error?.message).toContain('slug');
    });

    it('should validate organization type enum', async () => {
      const result = await db.from('organizations').insert({
        name: 'Test Organization',
        slug: 'test-org',
        type: 'invalid_type' as any, // Invalid enum value
      });

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('type');
      expect(result.error?.message).toContain('invalid');
    });

    it('should accept all valid organization types', async () => {
      const validTypes = ['broker', 'general_contractor', 'subcontractor'] as const;

      for (const type of validTypes) {
        const result = await db.from('organizations').insert({
          name: `Org ${type}`,
          slug: `org-${type}`,
          type,
        });

        expect(result.error).toBeNull();
        expect(result.data?.[0]?.type).toBe(type);
      }
    });
  });

  describe('Cross-Schema Data Integrity', () => {
    it('should maintain referential integrity when organization exists', async () => {
      // Create org
      await db.from('organizations').insert({
        id: 'org-1',
        name: 'Test Org',
        slug: 'test-org',
        type: 'general_contractor',
      });

      // Create user
      await db.from('users').insert({
        id: 'user-1',
        email: 'manager@example.com',
        role: 'manager',
      });

      // Create project with org reference
      await db.from('projects').insert({
        id: 'project-1',
        name: 'Test Project',
        manager_id: 'user-1',
        organization_id: 'org-1',
      });

      // Verify project has correct organization reference
      const result = await db.from('projects').select('*').eq('id', 'project-1').single();

      expect(result.error).toBeNull();
      expect(result.data?.organization_id).toBe('org-1');
    });

    it('should handle multiple cross-schema FKs on same record', async () => {
      // Create organization
      await db.from('organizations').insert({
        id: 'org-1',
        name: 'Test Org',
        slug: 'test-org',
        type: 'general_contractor',
      });

      // Create users
      await db.from('users').insert([
        { id: 'manager-1', email: 'manager@example.com', role: 'manager' },
        { id: 'uploader-1', email: 'uploader@example.com', role: 'manager' },
      ]);

      // Create project with organization reference
      await db.from('projects').insert({
        id: 'project-1',
        name: 'Test Project',
        manager_id: 'manager-1',
        organization_id: 'org-1',
      });

      // Create subcontractor
      await db.from('subcontractors').insert({
        id: 'sub-1',
        name: 'Test Sub',
        company: 'Test Co',
        contact_info: { email: 'test@example.com', phone: '555-0100' },
      });

      // Create document with uploaded_by reference
      const result = await db.from('documents').insert({
        subcontractor_id: 'sub-1',
        project_id: 'project-1',
        file_url: 'http://example.com/file.pdf',
        status: 'pending',
        uploaded_by_scaffald_user_id: 'uploader-1',
      });

      expect(result.error).toBeNull();
      expect(result.data?.[0]?.uploaded_by_scaffald_user_id).toBe('uploader-1');
    });
  });
});

describe('MockDatabase - Seed Data Tests', () => {
  let db: MockDatabase;

  beforeEach(() => {
    db = new MockDatabase();
    db.seed();
  });

  it('should create exactly 5 projects', async () => {
    db.setCurrentUser({ id: 'admin', role: 'admin' });
    const result = await db.from('projects').select('*');
    expect(result.data).toHaveLength(5);
  });

  // REQ-214: Test seeded organizations for cross-schema FK support
  it('should create exactly 3 organizations', async () => {
    db.setCurrentUser({ id: 'admin', role: 'admin' });
    const result = await db.from('organizations').select('*');
    expect(result.data).toHaveLength(3);
  });

  it('should have organizations with valid types', async () => {
    db.setCurrentUser({ id: 'admin', role: 'admin' });
    const result = await db.from('organizations').select('*');
    const validTypes = ['broker', 'general_contractor', 'subcontractor'];
    expect(result.data?.every((org) => validTypes.includes(org.type))).toBe(true);
  });

  it('should create exactly 20 subcontractors', async () => {
    db.setCurrentUser({ id: 'admin', role: 'admin' });
    const result = await db.from('subcontractors').select('*');
    expect(result.data).toHaveLength(20);
  });

  it('should create exactly 50 policies', async () => {
    db.setCurrentUser({ id: 'admin', role: 'admin' });
    const result = await db.from('policies').select('*');
    expect(result.data).toHaveLength(50);
  });

  it('should create exactly 30 tasks', async () => {
    db.setCurrentUser({ id: 'admin', role: 'admin' });
    const result = await db.from('tasks').select('*');
    expect(result.data).toHaveLength(30);
  });

  it('should have realistic carriers', async () => {
    db.setCurrentUser({ id: 'admin', role: 'admin' });
    const result = await db.from('policies').select('carrier');

    const carriers = result.data?.map((p) => p.carrier) || [];
    const validCarriers = [
      'Travelers',
      'Liberty Mutual',
      'Hartford',
      'Zurich',
      'AIG',
    ];

    expect(carriers.some((c) => validCarriers.includes(c))).toBe(true);
  });

  it('should have coverage amounts matching industry standards', async () => {
    db.setCurrentUser({ id: 'admin', role: 'admin' });
    const result = await db.from('policies').select('coverage_amount');

    const amounts = result.data?.map((p) => p.coverage_amount) || [];

    // Should have values in millions (1M-5M range)
    expect(amounts.some((a) => a >= 1000000 && a <= 5000000)).toBe(true);
  });

  it('should have mix of compliant and non-compliant scenarios', async () => {
    db.setCurrentUser({ id: 'admin', role: 'admin' });
    const result = await db.from('compliance_scores').select('score');

    const scores = result.data?.map((s) => s.score) || [];

    // Should have some low scores (< 70) and some high scores (>= 70)
    const lowScores = scores.filter((s) => s < 70);
    const highScores = scores.filter((s) => s >= 70);

    expect(lowScores.length).toBeGreaterThan(0);
    expect(highScores.length).toBeGreaterThan(0);
  });

  it('should have tasks in various states', async () => {
    db.setCurrentUser({ id: 'admin', role: 'admin' });
    const result = await db.from('tasks').select('status');

    const statuses = result.data?.map((t) => t.status) || [];
    const uniqueStatuses = [...new Set(statuses)];

    // Should have at least 2 different statuses
    expect(uniqueStatuses.length).toBeGreaterThanOrEqual(2);
  });

  it('should be deterministic (same data every time)', () => {
    const db1 = new MockDatabase();
    db1.seed();
    db1.setCurrentUser({ id: 'admin', role: 'admin' });

    const db2 = new MockDatabase();
    db2.seed();
    db2.setCurrentUser({ id: 'admin', role: 'admin' });

    // Both should have same project count
    expect(db1.from('projects').select('*')).toEqual(
      db2.from('projects').select('*')
    );
  });
});
