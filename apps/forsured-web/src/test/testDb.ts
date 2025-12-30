/**
 * Test Database Utilities
 *
 * Provides real Supabase connection for integration tests.
 * REQ-9: Testing Policy - No mocking of owned code
 *
 * Use a dedicated test database or isolated schema for tests.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use local Supabase instance for testing
const TEST_SUPABASE_URL = process.env.TEST_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const TEST_SUPABASE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Create a test Supabase client with service role key for full access
 */
export const testSupabase: SupabaseClient = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Test data tracking for cleanup
 */
export interface CreatedTestData {
  projects: string[];
  subcontractors: string[];
  tasks: string[];
  documents: string[];
  policies: string[];
  invitations: string[];
  complianceScores: string[];
  complianceIssues: string[];
}

/**
 * Create a fresh tracking object for test data
 */
export function createTestDataTracker(): CreatedTestData {
  return {
    projects: [],
    subcontractors: [],
    tasks: [],
    documents: [],
    policies: [],
    invitations: [],
    complianceScores: [],
    complianceIssues: [],
  };
}

/**
 * Clean up test data created during tests
 * Call this in afterEach or afterAll
 * Deletes in proper dependency order (children first)
 */
export async function cleanupTestData(createdIds: CreatedTestData): Promise<void> {
  const {
    projects = [],
    subcontractors = [],
    tasks = [],
    documents = [],
    policies = [],
    invitations = [],
    complianceScores = [],
    complianceIssues = [],
  } = createdIds;

  // Delete in dependency order (most dependent first)

  if (complianceIssues.length) {
    await testSupabase
      .schema('forsured' as never)
      .from('compliance_issues')
      .delete()
      .in('id', complianceIssues);
  }

  if (complianceScores.length) {
    await testSupabase
      .schema('forsured' as never)
      .from('compliance_scores')
      .delete()
      .in('id', complianceScores);
  }

  if (tasks.length) {
    await testSupabase
      .schema('forsured' as never)
      .from('tasks')
      .delete()
      .in('id', tasks);
  }

  if (documents.length) {
    await testSupabase
      .schema('forsured' as never)
      .from('documents')
      .delete()
      .in('id', documents);
  }

  if (policies.length) {
    await testSupabase
      .schema('forsured' as never)
      .from('policies')
      .delete()
      .in('id', policies);
  }

  if (invitations.length) {
    await testSupabase
      .schema('forsured' as never)
      .from('project_subcontractors')
      .delete()
      .in('id', invitations);
  }

  if (subcontractors.length) {
    await testSupabase
      .schema('forsured' as never)
      .from('subcontractors')
      .delete()
      .in('id', subcontractors);
  }

  if (projects.length) {
    await testSupabase
      .schema('forsured' as never)
      .from('projects')
      .delete()
      .in('id', projects);
  }
}

/**
 * Reset a test data tracker after cleanup
 */
export function resetTestDataTracker(tracker: CreatedTestData): void {
  tracker.projects = [];
  tracker.subcontractors = [];
  tracker.tasks = [];
  tracker.documents = [];
  tracker.policies = [];
  tracker.invitations = [];
  tracker.complianceScores = [];
  tracker.complianceIssues = [];
}

/**
 * Verify database connection is working
 * Call in beforeAll to ensure tests can connect
 */
export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    // Try to query a known table
    const { error } = await testSupabase
      .schema('core' as never)
      .from('organizations')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Database connection test failed:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Database connection error:', err);
    return false;
  }
}

/**
 * Get a test organization ID for creating test data
 * Returns the first available organization
 */
export async function getTestOrganizationId(): Promise<string | null> {
  const { data: orgs } = await testSupabase
    .schema('core' as never)
    .from('organizations')
    .select('id')
    .limit(1);

  if (!orgs || orgs.length === 0) {
    console.warn('No test organization available');
    return null;
  }

  return orgs[0].id;
}

/**
 * Get a test project ID for creating test data
 * Returns the first available project in the specified organization
 */
export async function getTestProjectId(organizationId?: string): Promise<string | null> {
  let query = testSupabase
    .schema('forsured' as never)
    .from('projects')
    .select('id');

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data: projects } = await query.limit(1);

  if (!projects || projects.length === 0) {
    return null;
  }

  return projects[0].id;
}

/**
 * Get a test subcontractor ID for creating test data
 * Returns the first available subcontractor in the specified organization
 */
export async function getTestSubcontractorId(organizationId?: string): Promise<string | null> {
  let query = testSupabase
    .schema('forsured' as never)
    .from('subcontractors')
    .select('id');

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data: subs } = await query.limit(1);

  if (!subs || subs.length === 0) {
    return null;
  }

  return subs[0].id;
}
