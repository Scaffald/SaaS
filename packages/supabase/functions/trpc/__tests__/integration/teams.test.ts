import {
  assertEquals,
  assertExists,
  assertMatch,
} from "jsr:@std/assert";

import {
  callTRPCEndpoint,
  createAdminClient,
  loadCachedTokens,
} from "../setup.ts";

const createTestOrganization = async (
  adminUserId: string,
) => {
  const admin = createAdminClient();
  const organizationId = crypto.randomUUID();
  const slug = `team-test-${crypto.randomUUID().slice(0, 8)}`.toLowerCase();

  const { data, error } = await admin
    .schema("core")
    .from("organizations")
    .insert({
      id: organizationId,
      owner_user_id: adminUserId,
      name: `Team Integration Org ${slug}`,
      slug,
      visibility: "public",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to seed organization: ${error?.message ?? "unknown error"}`);
  }

  return {
    id: data.id as string,
    slug,
  };
};

Deno.test({
  name: "Teams router - create, manage members, invitations, and archive",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Missing cached auth tokens");

    const adminToken = tokens.admin.token;
    const adminUserId = tokens.admin.userId;

    const organization = await createTestOrganization(adminUserId);
    const adminClient = createAdminClient();

    let teamId: string | null = null;
    try {
      const createdTeamResponse = await callTRPCEndpoint(
        "teams.create",
        {
          organizationId: organization.id,
          name: "Integration QA Team",
          defaultRoleKey: "member",
          invitationExpirationDays: 10,
        },
        { type: "mutation", authToken: adminToken },
      );

      const createdTeam = createdTeamResponse[0]?.result?.data?.team;
      assertExists(createdTeam, "Expected team to be created");
      teamId = createdTeam.id as string;
      assertEquals(createdTeam.invitationExpirationDays, 10);
      assertEquals(createdTeam.allowSelfJoin, false);
      assertEquals(createdTeam.autoAssignJobs, false);

      const listResponse = await callTRPCEndpoint(
        "teams.list",
        {
          organizationId: organization.id,
        },
        { authToken: adminToken },
      );

      const teams = listResponse[0]?.result?.data?.teams;
      assertExists(teams, "Expected teams list");
      assertEquals(Array.isArray(teams), true);

      const updateResponse = await callTRPCEndpoint(
        "teams.update",
        {
          teamId,
          name: "Integration QA Team v2",
          visibility: "private",
          allowSelfJoin: true,
          invitationExpirationDays: 14,
          autoAssignJobs: true,
        },
        { type: "mutation", authToken: adminToken },
      );

      const updatedTeam = updateResponse[0]?.result?.data?.team;
      assertExists(updatedTeam, "Expected updated team");
      assertEquals(updatedTeam.visibility, "private");
      assertEquals(updatedTeam.allowSelfJoin, true);
      assertEquals(updatedTeam.invitationExpirationDays, 14);
      assertEquals(updatedTeam.autoAssignJobs, true);

      const memberAddResponse = await callTRPCEndpoint(
        "teams.members.add",
        {
          teamId,
          userId: adminUserId,
          roleKey: "team_admin",
        },
        { type: "mutation", authToken: adminToken },
      );

      const addedMember = memberAddResponse[0]?.result?.data?.member;
      assertExists(addedMember, "Expected member to be added");
      assertEquals(addedMember.role?.key, "team_admin");

      const membersResponse = await callTRPCEndpoint(
        "teams.members.list",
        { teamId },
        { authToken: adminToken },
      );

      const members = membersResponse[0]?.result?.data?.members;
      assertExists(members, "Expected members list");
      assertEquals(Array.isArray(members), true);
      assertEquals(members.length > 0, true);

      const invitationResponse = await callTRPCEndpoint(
        "teams.invitations.create",
        {
          teamId,
          email: "invited.member@example.com",
          roleKey: "member",
          organizationId: organization.id,
        },
        { type: "mutation", authToken: adminToken },
      );

      const invitation = invitationResponse[0]?.result?.data?.invitation;
      const invitationToken = invitationResponse[0]?.result?.data?.token;
      assertExists(invitation, "Expected invitation to be created");
      assertExists(invitationToken, "Expected invitation token");
      assertMatch(invitationToken, /^[a-f0-9]{32}$/);
      assertEquals(invitation.organizationId, organization.id);
      const expiresAt = new Date(invitation.expiresAt as string);
      const diffDays = Math.round(
        (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      assertEquals(Math.abs(diffDays - 14) <= 1, true);

      const cancelResponse = await callTRPCEndpoint(
        "teams.invitations.cancel",
        {
          invitationId: invitation.id,
          teamId,
          reason: "No longer needed",
        },
        { type: "mutation", authToken: adminToken },
      );

      const cancelledInvitation = cancelResponse[0]?.result?.data?.invitation;
      assertExists(cancelledInvitation, "Expected cancelled invitation response");
      assertEquals(cancelledInvitation.status, "cancelled");
      assertEquals(cancelledInvitation.responseMessage, "No longer needed");
      assertExists(cancelledInvitation.respondedAt, "Expected cancellation timestamp");

      const archiveResponse = await callTRPCEndpoint(
        "teams.archive",
        {
          teamId,
          reason: "End of test",
        },
        { type: "mutation", authToken: adminToken },
      );

      const archivedTeam = archiveResponse[0]?.result?.data?.team;
      assertExists(archivedTeam, "Expected archived team response");
      assertEquals(archivedTeam.isArchived, true);
    } finally {
      try {
        if (teamId) {
          await adminClient.schema("core").from("team_invitations")
            .delete()
            .eq("team_id", teamId);
          await adminClient.schema("core").from("team_members")
            .delete()
            .eq("team_id", teamId);
          await adminClient.schema("core").from("teams").delete().eq(
            "id",
            teamId,
          );
        }

        await adminClient.schema("core").from("organizations").delete().eq(
          "id",
          organization.id,
        );
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }
  },
});

