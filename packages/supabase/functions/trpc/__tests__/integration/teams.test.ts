import {
  assertEquals,
  assertExists,
} from "jsr:@std/assert";

import { callTRPCEndpoint } from "../setup.ts";
import { setupTeamManagementFixture } from "./seed-utils.ts";

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

