import {
  assertEquals,
  assertExists,
} from 'jsr:@std/assert';

import { callTRPCEndpoint } from '../setup.ts';
import { setupTeamManagementFixture } from './seed-utils.ts';

Deno.test({
  name: "Teams router - list requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "teams.list",
      {},
      { type: "query" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error response");
    assertEquals(error.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Teams router - create requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "teams.create",
      {
        organizationId: "00000000-0000-0000-0000-000000000000",
        name: "Field Operations",
        defaultRoleKey: "member",
      },
      { type: "mutation" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error response");
    assertEquals(error.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Teams router - organization owner can create team with custom metadata",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture({
      purpose: "Primary hiring unit",
      metadata: { initial: true },
    });

    const newTeamName = `Quality Assurance ${crypto.randomUUID().slice(0, 5)}`;
    const payload = {
      organizationId: fixture.organization.id,
      name: newTeamName,
      slug: `qa-${crypto.randomUUID().slice(0, 4)}`,
      purpose: "Quality oversight",
      visibility: "organization" as const,
      invitationPolicy: "invite_only" as const,
      description: { type: "doc", content: [] },
      metadata: { region: "west" },
      settings: { notifications: { digest: true } },
      defaultRoleId: fixture.roles.member.id,
      allowSelfJoin: false,
      autoAssignJobs: true,
      invitationExpirationDays: 14,
      workloadStrategy: "manual" as const,
      workloadSettings: { capacity: 5 },
      analyticsMetadata: { enabled: true },
      analyticsRefreshIntervalMinutes: 30,
    };

    const response = await callTRPCEndpoint(
      "teams.create",
      payload,
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { team: Record<string, unknown> }
      | undefined;

    assertExists(result, "Expected team creation response");

    const team = result.team as Record<string, unknown>;
    assertEquals(team.name, newTeamName);
    assertEquals(team.organizationId, fixture.organization.id);
    assertEquals(team.defaultRoleKey, "member");
    assertEquals(team.invitationPolicy, "invite_only");
    assertEquals(team.metadata, { region: "west" });
    assertEquals(team.settings, { notifications: { digest: true } });
    assertEquals(team.analyticsRefreshIntervalMinutes, 30);
  },
});

Deno.test({
  name: "Teams router - regular member cannot create team",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.create",
      {
        organizationId: fixture.organization.id,
        name: `Operations ${crypto.randomUUID().slice(0, 6)}`,
        defaultRoleId: fixture.roles.member.id,
      },
      {
        type: "mutation",
        authToken: fixture.member.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error response for unauthorized create");
    assertEquals(error.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Teams router - owner can update team configuration",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.update",
      {
        teamId: fixture.team.id,
        purpose: "Updated integration purpose",
        metadata: { focus: "HVAC" },
        invitationExpirationDays: 10,
        defaultRoleKey: "lead",
        allowSelfJoin: true,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { team: Record<string, unknown> }
      | undefined;
    assertExists(result, "Expected update result");

    const updatedTeam = result.team as Record<string, unknown>;
    assertEquals(updatedTeam.purpose, "Updated integration purpose");
    assertEquals(updatedTeam.metadata, { focus: "HVAC" });
    assertEquals(updatedTeam.invitationExpirationDays, 10);
    assertEquals(updatedTeam.defaultRoleKey, "lead");
    assertEquals(updatedTeam.allowSelfJoin, true);
  },
});

Deno.test({
  name: "Teams router - member cannot update team",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.update",
      {
        teamId: fixture.team.id,
        purpose: "Attempted update",
      },
      {
        type: "mutation",
        authToken: fixture.member.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error when member updates team");
    assertEquals(error.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Teams router - list returns owner organization teams",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.list",
      { organizationId: fixture.organization.id, includeArchived: false },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { teams: Array<Record<string, unknown>> }
      | undefined;

    assertExists(result, "Expected teams list response");

    const match = result.teams.find((team) => team.id === fixture.team.id);
    assertExists(match, "Expected fixture team in owner list response");
    assertEquals(match.visibility, "organization");
  },
});

Deno.test({
  name: "Teams router - list works without supabaseAdmin in context (verifies fix)",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    // This test verifies that teams.list works correctly even though
    // protectedProcedure doesn't provide supabaseAdmin by default.
    // The endpoint should create the service client internally.
    const response = await callTRPCEndpoint(
      "teams.list",
      { includeArchived: false },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    // Should not have an error about undefined supabaseAdmin
    const error = response[0]?.error;
    if (error) {
      const errorMessage = error.message || JSON.stringify(error);
      if (errorMessage.includes("Cannot read properties of undefined") || 
          errorMessage.includes("reading 'schema'")) {
        throw new Error(
          `teams.list failed with supabaseAdmin error: ${errorMessage}. This indicates the fix didn't work.`
        );
      }
    }

    const result = response[0]?.result?.data as
      | { teams: Array<Record<string, unknown>> }
      | undefined;

    assertExists(result, "Expected teams list response");
    assertEquals(Array.isArray(result.teams), true);
  },
});

Deno.test({
  name: "Teams router - member can view team by id",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.byId",
      { teamId: fixture.team.id },
      {
        type: "query",
        authToken: fixture.member.token,
      },
    );

    const result = response[0]?.result?.data as
      | { team: Record<string, unknown> }
      | undefined;

    assertExists(result, "Expected team details response");
    assertEquals(result.team.id, fixture.team.id);
    assertEquals(result.team.defaultRoleKey, fixture.team.defaultRoleKey);
  },
});

Deno.test({
  name: "Teams router - respondToInvitation returns NOT_FOUND for unknown tokens",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "teams.respondToInvitation",
      {
        token: "ffffffffffffffff",
        action: "accept",
      },
      { type: "mutation" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected NOT_FOUND error response");
    assertEquals(error.data?.code, "NOT_FOUND");
  },
});

Deno.test({
  name: "Teams router - archive team with reason",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.archive",
      {
        teamId: fixture.team.id,
        reason: "Team no longer needed",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { team: Record<string, unknown> }
      | undefined;
    assertExists(result, "Expected archive result");

    const archivedTeam = result.team as Record<string, unknown>;
    assertEquals(archivedTeam.isArchived, true);
    assertExists(archivedTeam.archivedAt);
    assertEquals(archivedTeam.archivedBy, fixture.owner.userId);
  },
});

Deno.test({
  name: "Teams router - archive requires permission",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.archive",
      {
        teamId: fixture.team.id,
        reason: "Attempted archive",
      },
      {
        type: "mutation",
        authToken: fixture.member.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error when member archives team");
    assertEquals(error.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Teams router - list includes archived teams when flag is true",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    // Archive the team
    await callTRPCEndpoint(
      "teams.archive",
      {
        teamId: fixture.team.id,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    // List without archived
    const responseExcluded = await callTRPCEndpoint(
      "teams.list",
      { organizationId: fixture.organization.id, includeArchived: false },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const resultExcluded = responseExcluded[0]?.result?.data as
      | { teams: Array<Record<string, unknown>> }
      | undefined;
    assertExists(resultExcluded, "Expected teams list response");
    const foundExcluded = resultExcluded.teams.find((team) => team.id === fixture.team.id);
    assertEquals(foundExcluded, undefined, "Archived team should not appear when includeArchived is false");

    // List with archived
    const responseIncluded = await callTRPCEndpoint(
      "teams.list",
      { organizationId: fixture.organization.id, includeArchived: true },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const resultIncluded = responseIncluded[0]?.result?.data as
      | { teams: Array<Record<string, unknown>> }
      | undefined;
    assertExists(resultIncluded, "Expected teams list response");
    const foundIncluded = resultIncluded.teams.find((team) => team.id === fixture.team.id);
    assertExists(foundIncluded, "Archived team should appear when includeArchived is true");
    assertEquals(foundIncluded.isArchived, true);
  },
});

Deno.test({
  name: "Teams router - byId returns NOT_FOUND for non-existent team",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const fakeTeamId = '00000000-0000-0000-0000-000000000000';

    const response = await callTRPCEndpoint(
      "teams.byId",
      { teamId: fakeTeamId },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected NOT_FOUND error response");
    assertEquals(error.data?.code, "NOT_FOUND");
  },
});

Deno.test({
  name: "Teams router - byId permission denied for private teams",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    // Create a private team
    const createResponse = await callTRPCEndpoint(
      "teams.create",
      {
        organizationId: fixture.organization.id,
        name: `Private Team ${crypto.randomUUID().slice(0, 6)}`,
        visibility: "private" as const,
        defaultRoleId: fixture.roles.member.id,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const createResult = createResponse[0]?.result?.data as
      | { team: Record<string, unknown> }
      | undefined;
    assertExists(createResult, "Expected team creation response");
    const privateTeamId = createResult.team.id as string;

    // Try to access as member (who is not a member of this private team)
    const response = await callTRPCEndpoint(
      "teams.byId",
      { teamId: privateTeamId },
      {
        type: "query",
        authToken: fixture.member.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected FORBIDDEN error for private team access");
    assertEquals(error.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Teams router - update all field types",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.update",
      {
        teamId: fixture.team.id,
        name: "Updated Team Name",
        slug: "updated-slug",
        purpose: "Updated purpose",
        visibility: "private" as const,
        invitationPolicy: "request_to_join" as const,
        description: { type: "doc", content: [{ type: "paragraph", content: [] }] },
        metadata: { updated: true },
        settings: { notifications: { email: true } },
        allowSelfJoin: true,
        autoAssignJobs: true,
        invitationExpirationDays: 14,
        workloadStrategy: "balanced" as const,
        workloadSettings: { capacity: 10 },
        analyticsMetadata: { enabled: true },
        analyticsRefreshIntervalMinutes: 30,
        defaultRoleKey: "lead",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { team: Record<string, unknown> }
      | undefined;
    assertExists(result, "Expected update result");

    const updatedTeam = result.team as Record<string, unknown>;
    assertEquals(updatedTeam.name, "Updated Team Name");
    assertEquals(updatedTeam.slug, "updated-slug");
    assertEquals(updatedTeam.purpose, "Updated purpose");
    assertEquals(updatedTeam.visibility, "private");
    assertEquals(updatedTeam.invitationPolicy, "request_to_join");
    assertEquals(updatedTeam.allowSelfJoin, true);
    assertEquals(updatedTeam.autoAssignJobs, true);
    assertEquals(updatedTeam.invitationExpirationDays, 14);
    assertEquals(updatedTeam.workloadStrategy, "balanced");
    assertEquals(updatedTeam.analyticsRefreshIntervalMinutes, 30);
    assertEquals(updatedTeam.defaultRoleKey, "lead");
  },
});

Deno.test({
  name: "Teams router - update requires at least one field",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.update",
      {
        teamId: fixture.team.id,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error when no fields provided");
    assertEquals(error.data?.code, "BAD_REQUEST");
  },
});

Deno.test({
  name: "Teams router - create rejects duplicate slug",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const slug = `test-slug-${crypto.randomUUID().slice(0, 8)}`;

    // Create first team
    await callTRPCEndpoint(
      "teams.create",
      {
        organizationId: fixture.organization.id,
        name: "First Team",
        slug,
        defaultRoleId: fixture.roles.member.id,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    // Try to create second team with same slug
    const response = await callTRPCEndpoint(
      "teams.create",
      {
        organizationId: fixture.organization.id,
        name: "Second Team",
        slug,
        defaultRoleId: fixture.roles.member.id,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const error = response[0]?.error;
    // Note: This may be a database constraint error, not necessarily BAD_REQUEST
    assertExists(error, "Expected error for duplicate slug");
  },
});

Deno.test({
  name: "Teams router - create rejects invalid organizationId",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const invalidOrgId = '00000000-0000-0000-0000-000000000000';

    const response = await callTRPCEndpoint(
      "teams.create",
      {
        organizationId: invalidOrgId,
        name: "Test Team",
        defaultRoleId: fixture.roles.member.id,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error for invalid organization");
    // Could be NOT_FOUND or FORBIDDEN depending on implementation
  },
});

