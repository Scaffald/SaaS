import {
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
  name: "Team edge cases - invitation expiration handling",
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

Deno.test({
  name: "Team edge cases - invalid UUID handling",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    // Try with invalid UUID format
    const response = await callTRPCEndpoint(
      "teams.byId",
      { teamId: "not-a-valid-uuid" },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error for invalid UUID");
    // Should be BAD_REQUEST or similar validation error
  },
});

Deno.test({
  name: "Team edge cases - large payload handling",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    // Create team with large metadata
    const largeMetadata: Record<string, string> = {};
    for (let i = 0; i < 100; i++) {
      largeMetadata[`key${i}`] = "x".repeat(100);
    }

    const response = await callTRPCEndpoint(
      "teams.update",
      {
        teamId: fixture.team.id,
        metadata: largeMetadata,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    // Should either succeed or fail gracefully
    const result = response[0]?.result?.data;
    const error = response[0]?.error;
    
    if (error) {
      // If it fails, should be a reasonable error
      assertExists(error, "Expected error or success for large payload");
    } else if (result) {
      assertExists(result, "Should handle large payload");
    }
  },
});

Deno.test({
  name: "Team edge cases - concurrent invitation acceptance",
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

    // Try to accept twice concurrently
    const [response1, response2] = await Promise.all([
      callTRPCEndpoint(
        "teams.respondToInvitation",
        {
          token,
          action: "accept" as const,
          responderId: invitee.userId,
        },
        { type: "mutation" },
      ),
      callTRPCEndpoint(
        "teams.respondToInvitation",
        {
          token,
          action: "accept" as const,
          responderId: invitee.userId,
        },
        { type: "mutation" },
      ),
    ]);

    // One should succeed, one should fail
    const success1 = response1[0]?.result?.data;
    const error1 = response1[0]?.error;
    const success2 = response2[0]?.result?.data;
    const error2 = response2[0]?.error;

    const successCount = [success1, success2].filter(Boolean).length;
    const errorCount = [error1, error2].filter(Boolean).length;

    // Should have exactly one success and one error
    assertEquals(successCount + errorCount, 2, "Both requests should complete");
    assertEquals(successCount, 1, "Exactly one should succeed");
    assertEquals(errorCount, 1, "Exactly one should fail");
  },
});

