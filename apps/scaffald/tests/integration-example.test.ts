/**
 * Example Integration Test
 *
 * Demonstrates how to use test infrastructure:
 * - Test factories for creating data
 * - Test database utilities for cleanup
 * - Real Supabase connection (no mocking)
 */

import { afterEach, describe, expect, test } from "vitest";
import { cleanupTestData, createTestDataTracker } from "./testDb";
import { createTestUser } from "./factories/userFactory";
import { createTestOrganization } from "./factories/organizationFactory";
import { createTestTeam } from "./factories/teamFactory";
import { createTestProject } from "./factories/projectFactory";

describe("Integration Test Example", () => {
  const tracker = createTestDataTracker();

  afterEach(async () => {
    // Auto-cleanup all test data after each test
    await cleanupTestData(tracker);
  });

  test("creates user, organization, team, and project", async () => {
    // Create a test user
    const user = await createTestUser({ tracker });
    expect(user.id).toBeDefined();
    expect(user.email).toContain("@example.com");

    // Create an organization owned by the user
    const org = await createTestOrganization({
      ownerId: user.id,
      name: "Test Company",
      tracker,
    });
    expect(org.id).toBeDefined();
    expect(org.owner_user_id).toBe(user.id);

    // Create a team in the organization
    const team = await createTestTeam({
      organizationId: org.id,
      name: "Engineering Team",
      tracker,
    });
    expect(team.id).toBeDefined();
    expect(team.organization_id).toBe(org.id);

    // Create a project in the organization
    const project = await createTestProject({
      organizationId: org.id,
      name: "New Product Launch",
      tracker,
    });
    expect(project.id).toBeDefined();
    expect(project.organization_id).toBe(org.id);

    // All test data will be automatically cleaned up after this test
  });

  test("demonstrates factory batch creation", async () => {
    // Create a user and organization
    const user = await createTestUser({ tracker });
    const org = await createTestOrganization({
      ownerId: user.id,
      tracker,
    });

    // Create multiple teams at once
    const { createTestTeams } = await import("./factories/teamFactory");
    const teams = await createTestTeams(3, {
      organizationId: org.id,
      tracker,
    });

    expect(teams).toHaveLength(3);
    expect(teams[0].organization_id).toBe(org.id);
    expect(teams[1].organization_id).toBe(org.id);
    expect(teams[2].organization_id).toBe(org.id);

    // All teams will be automatically cleaned up
  });
});
