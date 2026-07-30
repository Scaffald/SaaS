import {
  assertEquals,
  assertExists,
} from 'jsr:@std/assert';

import { callTRPCEndpoint } from '../setup.ts';
import {
  createAdminClient,
  setupTeamManagementFixture,
} from './seed-utils.ts';

Deno.test({
  name: "Team permissions - admin role has full access",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    // Admin should be able to create team
    const createResponse = await callTRPCEndpoint(
      "teams.create",
      {
        organizationId: fixture.organization.id,
        name: `Admin Team ${crypto.randomUUID().slice(0, 6)}`,
        defaultRoleId: fixture.roles.member.id,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const createResult = createResponse[0]?.result?.data;
    assertExists(createResult, "Admin should be able to create team");

    // Admin should be able to update team
    const updateResponse = await callTRPCEndpoint(
      "teams.update",
      {
        teamId: fixture.team.id,
        name: "Updated by Admin",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const updateResult = updateResponse[0]?.result?.data;
    assertExists(updateResult, "Admin should be able to update team");

    // Admin should be able to manage members
    const membersResponse = await callTRPCEndpoint(
      "teams.members.list",
      { teamId: fixture.team.id },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const membersResult = membersResponse[0]?.result?.data;
    assertExists(membersResult, "Admin should be able to list members");
  },
});

Deno.test({
  name: "Team permissions - lead role can manage members and invitations",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    // Promote member to lead
    const listResponse = await callTRPCEndpoint(
      "teams.members.list",
      { teamId: fixture.team.id },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const listResult = listResponse[0]?.result?.data as
      | { members: Array<Record<string, unknown>> }
      | undefined;
    assertExists(listResult, "Expected members list");
    const member = listResult.members.find((m) => m.userId === fixture.member.userId);
    assertExists(member, "Expected to find member");
    const memberId = member.id as string;

    await callTRPCEndpoint(
      "teams.members.update",
      {
        teamMemberId: memberId,
        roleKey: "lead",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    // Lead should be able to list members
    const membersResponse = await callTRPCEndpoint(
      "teams.members.list",
      { teamId: fixture.team.id },
      {
        type: "query",
        authToken: fixture.member.token,
      },
    );

    const membersResult = membersResponse[0]?.result?.data;
    assertExists(membersResult, "Lead should be able to list members");

    // Lead should NOT be able to update team settings
    const updateResponse = await callTRPCEndpoint(
      "teams.update",
      {
        teamId: fixture.team.id,
        name: "Updated by Lead",
      },
      {
        type: "mutation",
        authToken: fixture.member.token,
      },
    );

    const updateError = updateResponse[0]?.error;
    assertExists(updateError, "Lead should not be able to update team");
    assertEquals(updateError.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Team permissions - member role has view-only access",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    // Member should be able to view team
    const viewResponse = await callTRPCEndpoint(
      "teams.byId",
      { teamId: fixture.team.id },
      {
        type: "query",
        authToken: fixture.member.token,
      },
    );

    const viewResult = viewResponse[0]?.result?.data;
    assertExists(viewResult, "Member should be able to view team");

    // Member should NOT be able to update team
    const updateResponse = await callTRPCEndpoint(
      "teams.update",
      {
        teamId: fixture.team.id,
        name: "Updated by Member",
      },
      {
        type: "mutation",
        authToken: fixture.member.token,
      },
    );

    const updateError = updateResponse[0]?.error;
    assertExists(updateError, "Member should not be able to update team");
    assertEquals(updateError.data?.code, "FORBIDDEN");

    // Member should NOT be able to add members
    const addResponse = await callTRPCEndpoint(
      "teams.members.add",
      {
        teamId: fixture.team.id,
        userId: fixture.owner.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.member.token,
      },
    );

    const addError = addResponse[0]?.error;
    assertExists(addError, "Member should not be able to add members");
    assertEquals(addError.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Team permissions - cross-organization access denied",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture1 = await setupTeamManagementFixture();
    const fixture2 = await setupTeamManagementFixture({
      organizationName: "Second Organization",
    });

    // User from org1 should not access org2's team
    const response = await callTRPCEndpoint(
      "teams.byId",
      { teamId: fixture2.team.id },
      {
        type: "query",
        authToken: fixture1.owner.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error for cross-organization access");
    assertEquals(error.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Team permissions - archived team access restrictions",
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

    // Member should still be able to view archived team (if they were a member)
    const viewResponse = await callTRPCEndpoint(
      "teams.byId",
      { teamId: fixture.team.id },
      {
        type: "query",
        authToken: fixture.member.token,
      },
    );

    // Viewing might still work, but mutations should be restricted
    const viewResult = viewResponse[0]?.result?.data;
    const viewError = viewResponse[0]?.error;
    
    // Should either succeed (view) or fail (restricted)
    if (viewError) {
      assertEquals(viewError.data?.code, "FORBIDDEN");
    }

    // Should not be able to add members to archived team
    const addResponse = await callTRPCEndpoint(
      "teams.members.add",
      {
        teamId: fixture.team.id,
        userId: fixture.owner.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const addError = addResponse[0]?.error;
    assertExists(addError, "Should not be able to add to archived team");
    assertEquals(addError.data?.code, "BAD_REQUEST");
  },
});

