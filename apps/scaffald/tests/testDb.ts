/**
 * Test Database Utilities for Scaffald
 *
 * Provides real Supabase connection for integration tests.
 * Testing policy: no mocking of owned code
 *
 * Use a dedicated test database or isolated schema for tests.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Use local Supabase instance for testing
const TEST_SUPABASE_URL = process.env.TEST_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const TEST_SUPABASE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Create a test Supabase client with service role key for full access
 */
export const testSupabase: SupabaseClient = createClient(
  TEST_SUPABASE_URL,
  TEST_SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

/**
 * Test data tracking for cleanup
 */
export interface CreatedTestData {
  users: string[];
  organizations: string[];
  projects: string[];
  teams: string[];
  teamMembers: string[];
  roleAssignments: string[];
  invitations: string[];
  jobPostings: string[];
  applications: string[];
}

/**
 * Create a fresh tracking object for test data
 */
export function createTestDataTracker(): CreatedTestData {
  return {
    users: [],
    organizations: [],
    projects: [],
    teams: [],
    teamMembers: [],
    roleAssignments: [],
    invitations: [],
    jobPostings: [],
    applications: [],
  };
}

/**
 * Clean up test data created during tests
 * Call this in afterEach or afterAll
 * Deletes in proper dependency order (children first)
 */
export async function cleanupTestData(
  createdIds: CreatedTestData,
): Promise<void> {
  const {
    users = [],
    organizations = [],
    projects = [],
    teams = [],
    teamMembers = [],
    roleAssignments = [],
    invitations = [],
    jobPostings = [],
    applications = [],
  } = createdIds;

  // Delete in dependency order (most dependent first)

  if (applications.length) {
    await testSupabase
      .schema("core" as never)
      .from("applications")
      .delete()
      .in("id", applications);
  }

  if (jobPostings.length) {
    await testSupabase
      .schema("core" as never)
      .from("job_postings")
      .delete()
      .in("id", jobPostings);
  }

  if (invitations.length) {
    await testSupabase
      .schema("core" as never)
      .from("team_invitations")
      .delete()
      .in("id", invitations);
  }

  if (teamMembers.length) {
    await testSupabase
      .schema("core" as never)
      .from("team_members")
      .delete()
      .in("id", teamMembers);
  }

  if (roleAssignments.length) {
    await testSupabase
      .schema("core" as never)
      .from("role_assignments")
      .delete()
      .in("id", roleAssignments);
  }

  if (teams.length) {
    await testSupabase
      .schema("core" as never)
      .from("teams")
      .delete()
      .in("id", teams);
  }

  if (projects.length) {
    await testSupabase
      .schema("core" as never)
      .from("projects")
      .delete()
      .in("id", projects);
  }

  if (organizations.length) {
    await testSupabase
      .schema("core" as never)
      .from("organizations")
      .delete()
      .in("id", organizations);
  }

  if (users.length) {
    // Delete from auth.users using admin API
    for (const userId of users) {
      await testSupabase.auth.admin.deleteUser(userId);
    }
  }
}

/**
 * Reset a test data tracker after cleanup
 */
export function resetTestDataTracker(tracker: CreatedTestData): void {
  tracker.users = [];
  tracker.organizations = [];
  tracker.projects = [];
  tracker.teams = [];
  tracker.teamMembers = [];
  tracker.roleAssignments = [];
  tracker.invitations = [];
  tracker.jobPostings = [];
  tracker.applications = [];
}

/**
 * Verify database connection is working
 * Call in beforeAll to ensure tests can connect
 */
export async function verifyDatabaseConnection(): Promise<boolean> {
  try {
    // Try to query a known table
    const { error } = await testSupabase
      .schema("core" as never)
      .from("organizations")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Database connection test failed:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Database connection error:", err);
    return false;
  }
}

/**
 * Get a test organization ID for creating test data
 * Returns the first available organization
 */
export async function getTestOrganizationId(): Promise<string | null> {
  const { data: orgs } = await testSupabase
    .schema("core" as never)
    .from("organizations")
    .select("id")
    .limit(1);

  if (!orgs || orgs.length === 0) {
    console.warn("No test organization available");
    return null;
  }

  return orgs[0].id;
}

/**
 * Get a test project ID for creating test data
 * Returns the first available project in the specified organization
 */
export async function getTestProjectId(
  organizationId?: string,
): Promise<string | null> {
  let query = testSupabase
    .schema("core" as never)
    .from("projects")
    .select("id");

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data: projects } = await query.limit(1);

  if (!projects || projects.length === 0) {
    return null;
  }

  return projects[0].id;
}

/**
 * Get a test team ID for creating test data
 * Returns the first available team in the specified organization
 */
export async function getTestTeamId(
  organizationId?: string,
): Promise<string | null> {
  let query = testSupabase
    .schema("core" as never)
    .from("teams")
    .select("id");

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data: teams } = await query.limit(1);

  if (!teams || teams.length === 0) {
    return null;
  }

  return teams[0].id;
}
