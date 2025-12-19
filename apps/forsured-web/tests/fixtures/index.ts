/**
 * Test Fixtures
 * REQ-9: Testing Policy - Use real Supabase instance for tests
 *
 * Export all fixtures for easy importing in tests:
 * ```typescript
 * import {
 *   testSupabase,
 *   createTestTask,
 *   cleanupTestData,
 *   TEST_USER_IDS,
 * } from '../fixtures';
 * ```
 */

// Supabase fixtures
export {
  // Clients
  testSupabase,
  testSupabaseAdmin,
  forsured,
  core,

  // Test IDs
  TEST_USER_IDS,
  TEST_ORG_IDS,
  TEST_PROJECT_IDS,

  // Task fixtures
  createTestTask,
  createTestTasks,
  getTestTask,
  getTestProjectTasks,

  // Project fixtures
  createTestProject,

  // Subcontractor fixtures
  createTestSubcontractor,

  // Policy fixtures
  createTestPolicy,

  // Cleanup helpers
  cleanupTestData,
  cleanupByPrefix,

  // Utility
  waitForSupabase,
} from './supabase';

export type {
  CreateTaskInput,
  CreateProjectInput,
  CreateSubcontractorInput,
  CreatePolicyInput,
} from './supabase';
