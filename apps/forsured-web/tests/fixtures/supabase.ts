/**
 * Supabase Test Fixtures
 * REQ-9: Testing Policy - Use real Supabase instance for tests
 *
 * These fixtures provide helpers for:
 * - Creating test data in Supabase
 * - Cleaning up test data after tests
 * - Test user authentication
 *
 * Usage:
 * ```typescript
 * import { testSupabase, createTestTask, cleanupTestData } from '../fixtures/supabase';
 *
 * describe('Task API', () => {
 *   afterEach(async () => {
 *     await cleanupTestData();
 *   });
 *
 *   it('creates a task', async () => {
 *     const task = await createTestTask({ title: 'Test task' });
 *     expect(task.id).toBeDefined();
 *   });
 * });
 * ```
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Local Supabase instance configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

/**
 * Test Supabase client with anon key (respects RLS)
 */
export const testSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Test Supabase client with service role key (bypasses RLS)
 * Use this for test setup/teardown operations
 */
export const testSupabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Track created test data for cleanup
 */
interface TestDataRecord {
  table: string;
  id: string;
}

const createdTestData: TestDataRecord[] = [];

/**
 * Helper to query forsured schema
 */
export function forsured(table: string, client: SupabaseClient = testSupabaseAdmin) {
  return client.schema('forsured').from(table);
}

/**
 * Helper to query core schema
 */
export function core(table: string, client: SupabaseClient = testSupabaseAdmin) {
  return client.schema('core').from(table);
}

// ============================================================================
// Test User Fixtures
// ============================================================================

/**
 * Test user IDs from seed data
 * These users are created by `pnpm supa:seed`
 */
export const TEST_USER_IDS = {
  admin: '00000000-0000-0000-0000-000000000001',
  manager: '00000000-0000-0000-0000-000000000010',
  contractor: '00000000-0000-0000-0000-000000000020',
} as const;

/**
 * Test organization IDs from seed data
 */
export const TEST_ORG_IDS = {
  primary: '00000000-0000-0000-0000-000000000001',
} as const;

/**
 * Test project IDs from seed data
 */
export const TEST_PROJECT_IDS = {
  project1: '00000000-0000-0000-0000-000000000100',
} as const;

// ============================================================================
// Task Fixtures
// ============================================================================

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  project_id?: string;
  organization_id?: string;
  assigned_to_user_id?: string;
  due_date?: string;
}

/**
 * Create a test task in Supabase
 */
export async function createTestTask(input: CreateTaskInput) {
  const taskData = {
    title: input.title,
    description: input.description ?? 'Test task description',
    status: input.status ?? 'pending',
    priority: input.priority ?? 'medium',
    project_id: input.project_id ?? TEST_PROJECT_IDS.project1,
    organization_id: input.organization_id ?? TEST_ORG_IDS.primary,
    assigned_to_user_id: input.assigned_to_user_id ?? TEST_USER_IDS.manager,
    due_date: input.due_date ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const { data, error } = await forsured('tasks')
    .insert(taskData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test task: ${error.message}`);
  }

  // Track for cleanup
  createdTestData.push({ table: 'forsured.tasks', id: data.id });

  return data;
}

/**
 * Create multiple test tasks
 */
export async function createTestTasks(count: number, overrides?: Partial<CreateTaskInput>) {
  const tasks = [];
  for (let i = 0; i < count; i++) {
    const task = await createTestTask({
      title: `Test Task ${i + 1}`,
      ...overrides,
    });
    tasks.push(task);
  }
  return tasks;
}

// ============================================================================
// Project Fixtures
// ============================================================================

export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
  organization_id?: string;
  manager_id?: string;
}

/**
 * Create a test project in Supabase
 */
export async function createTestProject(input: CreateProjectInput) {
  const projectData = {
    name: input.name,
    description: input.description ?? 'Test project description',
    status: input.status ?? 'active',
    organization_id: input.organization_id ?? TEST_ORG_IDS.primary,
    manager_id: input.manager_id ?? TEST_USER_IDS.manager,
  };

  const { data, error } = await forsured('projects')
    .insert(projectData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test project: ${error.message}`);
  }

  // Track for cleanup
  createdTestData.push({ table: 'forsured.projects', id: data.id });

  return data;
}

// ============================================================================
// Subcontractor Fixtures
// ============================================================================

export interface CreateSubcontractorInput {
  name: string;
  email?: string;
  phone?: string;
  organization_id?: string;
}

/**
 * Create a test subcontractor in Supabase
 */
export async function createTestSubcontractor(input: CreateSubcontractorInput) {
  const subData = {
    name: input.name,
    email: input.email ?? `${input.name.toLowerCase().replace(/\s+/g, '')}@test.com`,
    phone: input.phone ?? '555-0100',
    organization_id: input.organization_id ?? TEST_ORG_IDS.primary,
  };

  const { data, error } = await forsured('subcontractors')
    .insert(subData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test subcontractor: ${error.message}`);
  }

  // Track for cleanup
  createdTestData.push({ table: 'forsured.subcontractors', id: data.id });

  return data;
}

// ============================================================================
// Policy Fixtures
// ============================================================================

export interface CreatePolicyInput {
  policy_number: string;
  carrier?: string;
  coverage_type?: string;
  coverage_amount?: number;
  start_date?: string;
  end_date?: string;
  subcontractor_id: string;
  project_id?: string;
}

/**
 * Create a test insurance policy in Supabase
 */
export async function createTestPolicy(input: CreatePolicyInput) {
  const policyData = {
    policy_number: input.policy_number,
    carrier: input.carrier ?? 'Test Insurance Co',
    coverage_type: input.coverage_type ?? 'general_liability',
    coverage_amount: input.coverage_amount ?? 1000000,
    start_date: input.start_date ?? new Date().toISOString().split('T')[0],
    end_date: input.end_date ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subcontractor_id: input.subcontractor_id,
    project_id: input.project_id ?? TEST_PROJECT_IDS.project1,
  };

  const { data, error } = await forsured('insurance_policies')
    .insert(policyData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test policy: ${error.message}`);
  }

  // Track for cleanup
  createdTestData.push({ table: 'forsured.insurance_policies', id: data.id });

  return data;
}

// ============================================================================
// Cleanup Helpers
// ============================================================================

/**
 * Clean up all test data created during tests
 * Call this in afterEach() or afterAll()
 */
export async function cleanupTestData() {
  // Delete in reverse order to respect foreign key constraints
  const dataToDelete = [...createdTestData].reverse();

  for (const record of dataToDelete) {
    const [schema, table] = record.table.split('.');
    try {
      await testSupabaseAdmin
        .schema(schema)
        .from(table)
        .delete()
        .eq('id', record.id);
    } catch (error) {
      // Log but don't fail - cleanup errors shouldn't break tests
      console.warn(`Failed to cleanup ${record.table}:${record.id}`, error);
    }
  }

  // Clear the tracking array
  createdTestData.length = 0;
}

/**
 * Clean up specific table by test prefix
 * Useful for cleaning up data by a naming convention
 */
export async function cleanupByPrefix(schema: string, table: string, column: string, prefix: string) {
  try {
    await testSupabaseAdmin
      .schema(schema)
      .from(table)
      .delete()
      .like(column, `${prefix}%`);
  } catch (error) {
    console.warn(`Failed to cleanup ${schema}.${table} with prefix ${prefix}`, error);
  }
}

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Get a task by ID
 */
export async function getTestTask(id: string) {
  const { data, error } = await forsured('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to get task: ${error.message}`);
  }

  return data;
}

/**
 * Get all tasks for a project
 */
export async function getTestProjectTasks(projectId: string) {
  const { data, error } = await forsured('tasks')
    .select('*')
    .eq('project_id', projectId);

  if (error) {
    throw new Error(`Failed to get project tasks: ${error.message}`);
  }

  return data;
}

/**
 * Wait for Supabase to be ready
 * Use this in beforeAll() to ensure the database is available
 */
export async function waitForSupabase(maxRetries = 5, retryDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { error } = await testSupabaseAdmin
        .schema('forsured')
        .from('tasks')
        .select('id', { count: 'exact', head: true });

      if (!error) {
        return true;
      }
    } catch {
      // Retry
    }

    await new Promise((resolve) => setTimeout(resolve, retryDelay));
  }

  throw new Error('Supabase not available after retries. Is local Supabase running? (pnpm supa start)');
}
