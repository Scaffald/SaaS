import {
  assert,
  assertEquals,
  assertExists,
} from "jsr:@std/assert";

import {
  callTRPCEndpoint,
  createAdminClient,
} from "../setup.ts";
import {
  ensureTeamUserRecords,
  setupTeamManagementFixture,
} from "./seed-utils.ts";

async function createInviteeUser() {
  const adminClient = createAdminClient();
  const email = `invitee+${crypto.randomUUID().slice(0, 8)}@example.com`;
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      first_name: "Invitee",
      last_name: "User",
    },
  });

  if (error || !data?.user?.id) {
    throw new Error(
      `Failed to create invitee test user: ${error?.message ?? "unknown error"}`,
    );
  }

  const userId = data.user.id;
  await ensureTeamUserRecords(adminClient, userId, {
    displayName: "Integration Invitee",
    firstName: "Integration",
    lastName: "Invitee",
  });

  return { userId, email };
}

Deno.test({
  name: "Team invitations - owner can invite user and responder accepts via token",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const invitee = await createInviteeUser();

    const createResponse = await callTRPCEndpoint(
      "teams.invitations.create",
      {
        teamId: fixture.team.id,
        userId: invitee.userId,
        roleKey: "member",
        metadata: { source: "integration-test" },
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const creationResult = createResponse[0]?.result?.data as
      | { invitation: Record<string, unknown>; token: string }
      | undefined;

    assertExists(
      creationResult,
      "Expected invitation creation to return invitation and token",
    );

    const token = creationResult.token;
    assert(token.length > 16, "Expected invitation token to be generated");

    const acceptResponse = await callTRPCEndpoint(
      "teams.respondToInvitation",
      {
        token,
        action: "accept" as const,
        responderId: invitee.userId,
      },
      { type: "mutation" },
    );

    const acceptResult = acceptResponse[0]?.result?.data as
      | { status: string; teamId: string }
      | undefined;

    assertExists(acceptResult, "Expected invitation acceptance result");
    assertEquals(acceptResult.status, "accepted");
    assertEquals(acceptResult.teamId, fixture.team.id);

    const membersResponse = await callTRPCEndpoint(
      "teams.members.list",
      { teamId: fixture.team.id },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const membersResult = membersResponse[0]?.result?.data as
      | { members: Array<Record<string, unknown>> }
      | undefined;

    assertExists(membersResult, "Expected members list result");

    const invitedMember = membersResult.members.find((member) =>
      member.userId === invitee.userId
    );

    assertExists(invitedMember, "Invited user should appear as active team member");
    assertEquals(invitedMember.status, "active");
    assertEquals(invitedMember.role?.key, "member");
  },
});

Deno.test({
  name: "Team invitations - member cannot create invitations",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.invitations.create",
      {
        teamId: fixture.team.id,
        email: `unauthorized+${crypto.randomUUID().slice(0, 6)}@example.com`,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.member.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error response for unauthorized invitation");
    assertEquals(error.data?.code, "FORBIDDEN");
  },
});

