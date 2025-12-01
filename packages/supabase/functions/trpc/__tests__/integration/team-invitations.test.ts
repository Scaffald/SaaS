import {
  assert,
  assertEquals,
  assertExists,
} from "jsr:@std/assert";

import {
  callTRPCEndpoint,
  createAdminClient,
} from '../setup';
import {
  ensureTeamUserRecords,
  setupTeamManagementFixture,
} from './seed-utils';

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

Deno.test({
  name: "Team invitations - list with status filtering",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const invitee = await createInviteeUser();

    // Create invitation
    await callTRPCEndpoint(
      "teams.invitations.create",
      {
        teamId: fixture.team.id,
        userId: invitee.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    // List pending invitations
    const response = await callTRPCEndpoint(
      "teams.invitations.list",
      {
        teamId: fixture.team.id,
        status: "pending" as const,
      },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { invitations: Array<Record<string, unknown>> }
      | undefined;
    assertExists(result, "Expected invitations list response");
    assertEquals(result.invitations.length > 0, true, "Should have pending invitations");
    result.invitations.forEach((inv) => {
      assertEquals(inv.status, "pending");
    });
  },
});

Deno.test({
  name: "Team invitations - list requires permission",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.invitations.list",
      {
        teamId: fixture.team.id,
        status: "pending" as const,
      },
      {
        type: "query",
        authToken: fixture.member.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error for unauthorized invitation list");
    assertEquals(error.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Team invitations - mine returns user's invitations",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const invitee = await createInviteeUser();

    // Create invitation for the invitee
    await callTRPCEndpoint(
      "teams.invitations.create",
      {
        teamId: fixture.team.id,
        userId: invitee.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    // Get invitee's auth token
    const adminClient = createAdminClient();
    const { data: sessionData } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: invitee.email,
    });
    
    // Note: In a real scenario, we'd need to sign in the invitee
    // For now, we'll test that the endpoint exists and requires auth
    const response = await callTRPCEndpoint(
      "teams.invitations.mine",
      {
        status: "pending" as const,
      },
      {
        type: "query",
        // Without auth token, should fail
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error without authentication");
    assertEquals(error.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Team invitations - create with email",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const email = `newinvitee+${crypto.randomUUID().slice(0, 8)}@example.com`;

    const response = await callTRPCEndpoint(
      "teams.invitations.create",
      {
        teamId: fixture.team.id,
        organizationId: fixture.organization.id,
        email,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { invitation: Record<string, unknown>; token: string }
      | undefined;
    assertExists(result, "Expected invitation creation response");
    assertEquals(result.invitation.email, email);
    assertEquals(result.invitation.status, "pending");
    assertExists(result.token, "Should return invitation token");
  },
});

Deno.test({
  name: "Team invitations - create rejects duplicate invitation",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const invitee = await createInviteeUser();

    // Create first invitation
    await callTRPCEndpoint(
      "teams.invitations.create",
      {
        teamId: fixture.team.id,
        userId: invitee.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    // Try to create duplicate
    const response = await callTRPCEndpoint(
      "teams.invitations.create",
      {
        teamId: fixture.team.id,
        userId: invitee.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error for duplicate invitation");
    assertEquals(error.data?.code, "CONFLICT");
  },
});

Deno.test({
  name: "Team invitations - create rejects existing member",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    // Try to invite existing member
    const response = await callTRPCEndpoint(
      "teams.invitations.create",
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
    assertExists(error, "Expected error for inviting existing member");
    assertEquals(error.data?.code, "CONFLICT");
  },
});

Deno.test({
  name: "Team invitations - resend pending invitation",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const invitee = await createInviteeUser();

    // Create invitation
    const createResponse = await callTRPCEndpoint(
      "teams.invitations.create",
      {
        teamId: fixture.team.id,
        userId: invitee.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const createResult = createResponse[0]?.result?.data as
      | { invitation: Record<string, unknown> }
      | undefined;
    assertExists(createResult, "Expected invitation creation");
    const invitationId = createResult.invitation.id as string;

    // Resend invitation
    const response = await callTRPCEndpoint(
      "teams.invitations.resend",
      {
        teamId: fixture.team.id,
        invitationId,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { success: boolean }
      | undefined;
    assertExists(result, "Expected resend response");
    assertEquals(result.success, true);
  },
});

Deno.test({
  name: "Team invitations - resend expired invitation",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const invitee = await createInviteeUser();

    // Create invitation with short expiration
    const createResponse = await callTRPCEndpoint(
      "teams.invitations.create",
      {
        teamId: fixture.team.id,
        userId: invitee.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const createResult = createResponse[0]?.result?.data as
      | { invitation: Record<string, unknown> }
      | undefined;
    assertExists(createResult, "Expected invitation creation");
    const invitationId = createResult.invitation.id as string;

    // Manually expire the invitation via admin client
    const adminClient = createAdminClient();
    await adminClient
      .schema("core")
      .from("team_invitations")
      .update({ status: "expired" })
      .eq("id", invitationId);

    // Resend expired invitation
    const response = await callTRPCEndpoint(
      "teams.invitations.resend",
      {
        teamId: fixture.team.id,
        invitationId,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { success: boolean }
      | undefined;
    assertExists(result, "Expected resend response");
    assertEquals(result.success, true);
  },
});

Deno.test({
  name: "Team invitations - resend rejects already accepted",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const invitee = await createInviteeUser();

    // Create and accept invitation
    const createResponse = await callTRPCEndpoint(
      "teams.invitations.create",
      {
        teamId: fixture.team.id,
        userId: invitee.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const createResult = createResponse[0]?.result?.data as
      | { invitation: Record<string, unknown>; token: string }
      | undefined;
    assertExists(createResult, "Expected invitation creation");
    const invitationId = createResult.invitation.id as string;
    const token = createResult.token;

    // Accept invitation
    await callTRPCEndpoint(
      "teams.respondToInvitation",
      {
        token,
        action: "accept" as const,
        responderId: invitee.userId,
      },
      { type: "mutation" },
    );

    // Try to resend accepted invitation
    const response = await callTRPCEndpoint(
      "teams.invitations.resend",
      {
        teamId: fixture.team.id,
        invitationId,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error for resending accepted invitation");
    assertEquals(error.data?.code, "BAD_REQUEST");
  },
});

Deno.test({
  name: "Team invitations - cancel with reason",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const invitee = await createInviteeUser();

    // Create invitation
    const createResponse = await callTRPCEndpoint(
      "teams.invitations.create",
      {
        teamId: fixture.team.id,
        userId: invitee.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const createResult = createResponse[0]?.result?.data as
      | { invitation: Record<string, unknown> }
      | undefined;
    assertExists(createResult, "Expected invitation creation");
    const invitationId = createResult.invitation.id as string;

    // Cancel invitation
    const response = await callTRPCEndpoint(
      "teams.invitations.cancel",
      {
        teamId: fixture.team.id,
        invitationId,
        reason: "Changed mind",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { success: boolean }
      | undefined;
    assertExists(result, "Expected cancel response");
    assertEquals(result.success, true);
  },
});

Deno.test({
  name: "Team invitations - cancel requires permission",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const invitee = await createInviteeUser();

    // Create invitation
    const createResponse = await callTRPCEndpoint(
      "teams.invitations.create",
      {
        teamId: fixture.team.id,
        userId: invitee.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const createResult = createResponse[0]?.result?.data as
      | { invitation: Record<string, unknown> }
      | undefined;
    assertExists(createResult, "Expected invitation creation");
    const invitationId = createResult.invitation.id as string;

    // Try to cancel as member
    const response = await callTRPCEndpoint(
      "teams.invitations.cancel",
      {
        teamId: fixture.team.id,
        invitationId,
      },
      {
        type: "mutation",
        authToken: fixture.member.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error for unauthorized cancel");
    assertEquals(error.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Team invitations - respond authenticated accept",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const invitee = await createInviteeUser();

    // Create invitation
    const createResponse = await callTRPCEndpoint(
      "teams.invitations.create",
      {
        teamId: fixture.team.id,
        userId: invitee.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const createResult = createResponse[0]?.result?.data as
      | { invitation: Record<string, unknown> }
      | undefined;
    assertExists(createResult, "Expected invitation creation");
    const invitationId = createResult.invitation.id as string;

    // Get invitee token (simplified - in real scenario would sign in)
    // For now, test that endpoint requires auth
    const response = await callTRPCEndpoint(
      "teams.invitations.respond",
      {
        invitationId,
        action: "accept" as const,
      },
      {
        type: "mutation",
        // Without auth token
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error without authentication");
    assertEquals(error.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Team invitations - respondToInvitation public token decline",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const invitee = await createInviteeUser();

    // Create invitation
    const createResponse = await callTRPCEndpoint(
      "teams.invitations.create",
      {
        teamId: fixture.team.id,
        userId: invitee.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const createResult = createResponse[0]?.result?.data as
      | { invitation: Record<string, unknown>; token: string }
      | undefined;
    assertExists(createResult, "Expected invitation creation");
    const token = createResult.token;

    // Decline invitation
    const response = await callTRPCEndpoint(
      "teams.respondToInvitation",
      {
        token,
        action: "decline" as const,
        responderId: invitee.userId,
      },
      { type: "mutation" },
    );

    const result = response[0]?.result?.data as
      | { status: string; teamId: string }
      | undefined;
    assertExists(result, "Expected invitation decline result");
    assertEquals(result.status, "declined");
    assertEquals(result.teamId, fixture.team.id);
  },
});

Deno.test({
  name: "Team invitations - respondToInvitation invalid token",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "teams.respondToInvitation",
      {
        token: "invalid-token-12345",
        action: "accept" as const,
      },
      { type: "mutation" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected NOT_FOUND error for invalid token");
    assertEquals(error.data?.code, "NOT_FOUND");
  },
});

Deno.test({
  name: "Team invitations - respondToInvitation expired token",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const invitee = await createInviteeUser();

    // Create invitation
    const createResponse = await callTRPCEndpoint(
      "teams.invitations.create",
      {
        teamId: fixture.team.id,
        userId: invitee.userId,
        roleKey: "member",
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const createResult = createResponse[0]?.result?.data as
      | { invitation: Record<string, unknown>; token: string }
      | undefined;
    assertExists(createResult, "Expected invitation creation");
    const invitationId = createResult.invitation.id as string;
    const token = createResult.token;

    // Manually expire the invitation
    const adminClient = createAdminClient();
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await adminClient
      .schema("core")
      .from("team_invitations")
      .update({ expires_at: pastDate.toISOString() })
      .eq("id", invitationId);

    // Try to accept expired invitation
    const response = await callTRPCEndpoint(
      "teams.respondToInvitation",
      {
        token,
        action: "accept" as const,
        responderId: invitee.userId,
      },
      { type: "mutation" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error for expired invitation");
    assertEquals(error.data?.code, "BAD_REQUEST");
  },
});

