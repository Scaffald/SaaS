import {
  assertEquals,
  assertExists,
} from 'jsr:@std/assert';

import {
  callTRPCEndpoint,
  createAdminClient,
} from '../setup.ts';
import {
  ensureTeamUserRecords,
  setupTeamManagementFixture,
} from './seed-utils.ts';

async function createTestUser() {
  const adminClient = createAdminClient();
  const email = `testuser+${crypto.randomUUID().slice(0, 8)}@example.com`;
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      first_name: "Test",
      last_name: "User",
    },
  });

  if (error || !data?.user?.id) {
    throw new Error(
      `Failed to create test user: ${error?.message ?? "unknown error"}`,
    );
  }

  const userId = data.user.id;
  await ensureTeamUserRecords(adminClient, userId, {
    displayName: "Test User",
    firstName: "Test",
    lastName: "User",
  });

  return { userId, email };
}

Deno.test({
  name: "Team members - roles returns organization-scoped roles",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.members.roles",
      {
        organizationId: fixture.organization.id,
      },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { roles: Array<Record<string, unknown>> }
      | undefined;
    assertExists(result, "Expected roles response");
    assertExists(result.roles, "Expected roles array");
    assertEquals(result.roles.length > 0, true, "Should have at least one role");
    
    const memberRole = result.roles.find((r) => r.key === "member");
    assertExists(memberRole, "Should have member role");
  },
});

Deno.test({
  name: "Team members - roles returns team-scoped roles",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.members.roles",
      {
        teamId: fixture.team.id,
      },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { roles: Array<Record<string, unknown>> }
      | undefined;
    assertExists(result, "Expected roles response");
    assertExists(result.roles, "Expected roles array");
  },
});

Deno.test({
  name: "Team members - roles requires permission",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.members.roles",
      {
        teamId: fixture.team.id,
      },
      {
        type: "query",
        authToken: fixture.member.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error for unauthorized role access");
    assertEquals(error.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Team members - list filters removed members",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.members.list",
      { teamId: fixture.team.id },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { members: Array<Record<string, unknown>> }
      | undefined;
    assertExists(result, "Expected members list response");
    
    // All members should have status !== "removed"
    const removedMembers = result.members.filter((m) => m.status === "removed");
    assertEquals(removedMembers.length, 0, "Should not include removed members");
  },
});

Deno.test({
  name: "Team members - list requires VIEW permission",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    // Create a private team the member doesn't have access to
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

    const response = await callTRPCEndpoint(
      "teams.members.list",
      { teamId: privateTeamId },
      {
        type: "query",
        authToken: fixture.member.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error for unauthorized member list access");
    assertEquals(error.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Team members - add with role key",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const newUser = await createTestUser();

    const response = await callTRPCEndpoint(
      "teams.members.add",
      {
        teamId: fixture.team.id,
        userId: newUser.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { member: Record<string, unknown> }
      | undefined;
    assertExists(result, "Expected member add response");
    assertEquals(result.member.userId, newUser.userId);
    assertEquals(result.member.role?.key, "member");
    assertEquals(result.member.status, "active");
  },
});

Deno.test({
  name: "Team members - add with role ID",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const newUser = await createTestUser();

    const response = await callTRPCEndpoint(
      "teams.members.add",
      {
        teamId: fixture.team.id,
        userId: newUser.userId,
        roleId: fixture.roles.member.id,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { member: Record<string, unknown> }
      | undefined;
    assertExists(result, "Expected member add response");
    assertEquals(result.member.userId, newUser.userId);
    assertEquals(result.member.role?.id, fixture.roles.member.id);
  },
});

Deno.test({
  name: "Team members - add rejects duplicate member",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    // Try to add existing member
    const response = await callTRPCEndpoint(
      "teams.members.add",
      {
        teamId: fixture.team.id,
        userId: fixture.member.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error for duplicate member");
    assertEquals(error.data?.code, "CONFLICT");
  },
});

Deno.test({
  name: "Team members - add rejects archived team",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const newUser = await createTestUser();

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

    const response = await callTRPCEndpoint(
      "teams.members.add",
      {
        teamId: fixture.team.id,
        userId: newUser.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error for adding to archived team");
    assertEquals(error.data?.code, "BAD_REQUEST");
  },
});

Deno.test({
  name: "Team members - update role change",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    // Get member ID
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

    const response = await callTRPCEndpoint(
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

    const result = response[0]?.result?.data as
      | { member: Record<string, unknown> }
      | undefined;
    assertExists(result, "Expected member update response");
    assertEquals(result.member.role?.key, "lead");
  },
});

Deno.test({
  name: "Team members - update status transitions",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const newUser = await createTestUser();

    // Add member with pending status
    const addResponse = await callTRPCEndpoint(
      "teams.members.add",
      {
        teamId: fixture.team.id,
        userId: newUser.userId,
        roleKey: "member",
        status: "pending" as const,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const addResult = addResponse[0]?.result?.data as
      | { member: Record<string, unknown> }
      | undefined;
    assertExists(addResult, "Expected member add response");
    const memberId = addResult.member.id as string;

    // Update to active
    const updateResponse = await callTRPCEndpoint(
      "teams.members.update",
      {
        teamMemberId: memberId,
        status: "active" as const,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const updateResult = updateResponse[0]?.result?.data as
      | { member: Record<string, unknown> }
      | undefined;
    assertExists(updateResult, "Expected member update response");
    assertEquals(updateResult.member.status, "active");
  },
});

Deno.test({
  name: "Team members - update metadata",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

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

    const response = await callTRPCEndpoint(
      "teams.members.update",
      {
        teamMemberId: memberId,
        metadata: { note: "Updated metadata" },
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { member: Record<string, unknown> }
      | undefined;
    assertExists(result, "Expected member update response");
    assertEquals(result.member.metadata?.note, "Updated metadata");
  },
});

Deno.test({
  name: "Team members - remove with reason",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const newUser = await createTestUser();

    // Add member
    const addResponse = await callTRPCEndpoint(
      "teams.members.add",
      {
        teamId: fixture.team.id,
        userId: newUser.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const addResult = addResponse[0]?.result?.data as
      | { member: Record<string, unknown> }
      | undefined;
    assertExists(addResult, "Expected member add response");
    const memberId = addResult.member.id as string;

    // Remove member
    const response = await callTRPCEndpoint(
      "teams.members.remove",
      {
        teamId: fixture.team.id,
        teamMemberId: memberId,
        reason: "No longer needed",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { member: Record<string, unknown> }
      | undefined;
    assertExists(result, "Expected member remove response");
    assertEquals(result.member.status, "removed");
    assertExists(result.member.removedAt);
  },
});

Deno.test({
  name: "Team members - remove requires permission",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

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
    const member = listResult.members.find((m) => m.userId === fixture.owner.userId);
    assertExists(member, "Expected to find owner member");
    const memberId = member.id as string;

    const response = await callTRPCEndpoint(
      "teams.members.remove",
      {
        teamId: fixture.team.id,
        teamMemberId: memberId,
      },
      {
        type: "mutation",
        authToken: fixture.member.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error when member tries to remove");
    assertEquals(error.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Team members - statusChange transitions",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const newUser = await createTestUser();

    // Add member
    const addResponse = await callTRPCEndpoint(
      "teams.members.add",
      {
        teamId: fixture.team.id,
        userId: newUser.userId,
        roleKey: "member",
        status: "pending" as const,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const addResult = addResponse[0]?.result?.data as
      | { member: Record<string, unknown> }
      | undefined;
    assertExists(addResult, "Expected member add response");
    const memberId = addResult.member.id as string;

    // Change status to active
    const response = await callTRPCEndpoint(
      "teams.members.statusChange",
      {
        teamMemberId: memberId,
        status: "active" as const,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { member: Record<string, unknown> }
      | undefined;
    assertExists(result, "Expected status change response");
    assertEquals(result.member.status, "active");
  },
});

Deno.test({
  name: "Team members - transferOwnership promotes to admin",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

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

    const response = await callTRPCEndpoint(
      "teams.members.transferOwnership",
      {
        teamId: fixture.team.id,
        memberId,
        roleKey: "admin",
        notify: false,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { success: boolean }
      | undefined;
    assertExists(result, "Expected transfer ownership response");
    assertEquals(result.success, true);
  },
});

Deno.test({
  name: "Team members - selfRemove user removes themselves",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.members.selfRemove",
      {
        teamId: fixture.team.id,
        reason: "No longer participating",
      },
      {
        type: "mutation",
        authToken: fixture.member.token,
      },
    );

    const result = response[0]?.result?.data as
      | { success: boolean }
      | undefined;
    assertExists(result, "Expected self remove response");
    assertEquals(result.success, true);

    // Verify member is removed
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
    const removedMember = listResult.members.find((m) => m.userId === fixture.member.userId);
    assertEquals(removedMember, undefined, "Member should be removed from list");
  },
});

Deno.test({
  name: "Team members - selfRemove handles already removed",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    // Remove member first
    await callTRPCEndpoint(
      "teams.members.selfRemove",
      {
        teamId: fixture.team.id,
      },
      {
        type: "mutation",
        authToken: fixture.member.token,
      },
    );

    // Try to remove again
    const response = await callTRPCEndpoint(
      "teams.members.selfRemove",
      {
        teamId: fixture.team.id,
      },
      {
        type: "mutation",
        authToken: fixture.member.token,
      },
    );

    // Should succeed (idempotent)
    const result = response[0]?.result?.data as
      | { success: boolean }
      | undefined;
    assertExists(result, "Expected self remove response");
    assertEquals(result.success, true);
  },
});

