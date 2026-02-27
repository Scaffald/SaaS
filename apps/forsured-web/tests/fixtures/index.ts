/**
 * Test Fixtures
 * Testing policy - use real Supabase instance for tests
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
  cleanupByPrefix,
  // Cleanup helpers
  cleanupTestData,
  core,
  // Policy fixtures
  createTestPolicy,
  // Project fixtures
  createTestProject,
  // Subcontractor fixtures
  createTestSubcontractor,
  // Task fixtures
  createTestTask,
  createTestTasks,
  forsured,
  getTestProjectTasks,
  getTestTask,
  TEST_ORG_IDS,
  TEST_PROJECT_IDS,
  // Test IDs
  TEST_USER_IDS,
  // Clients
  testSupabase,
  testSupabaseAdmin,
  // Utility
  waitForSupabase,
} from "./supabase";

export type {
  CreatePolicyInput,
  CreateProjectInput,
  CreateSubcontractorInput,
  CreateTaskInput,
} from "./supabase";

// Manual user fixtures
export {
  cleanupManualUsersByPrefix,
  cleanupManualUserTestData,
  createMergeScenario,
  createTestManualUser,
  createTestManualUserWithInvitation,
  getManualUsersByCreator,
  getMergeAuditLogs,
  getTestManualUser,
} from "./manual-users";

export type { CreateManualUserInput, MergeScenarioInput } from "./manual-users";
