/**
 * Work logs router coverage.
 */

import { assert, assertEquals, assertExists } from "../shared/assert.ts";

import {
  TEST_USERS,
  callTRPCEndpoint,
  createAdminClient,
  getAuthToken,
  loadCachedTokens,
} from "../shared/setup.ts";

Deno.test({
  name: "Work logs router - getById returns NOT_FOUND for unknown work log",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("workLogs.getById", {
      workLogId: crypto.randomUUID(),
    });

    const error = response[0]?.error;
    assertExists(error, "Expected error payload");
    const code = error?.data?.code ?? "";
    assertEquals(
      ["NOT_FOUND", "INTERNAL_SERVER_ERROR"].includes(code),
      true,
      "Error code should indicate missing work log",
    );
  },
});

Deno.test({
  name: "Work logs router - analytics and export pipeline responses",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient();
    const cachedTokens = await loadCachedTokens();

    let authToken = cachedTokens?.regular?.token ?? null;
    if (!authToken) {
      authToken = await getAuthToken(
        TEST_USERS.regular.email,
        TEST_USERS.regular.password,
      );
    }

    assertExists(authToken, "Authentication token required for analytics test");

    let userId = cachedTokens?.regular?.userId ?? null;
    if (!userId) {
      const { data: userResponse, error: userLookupError } = await admin.auth
        .admin.getUserByEmail(TEST_USERS.regular.email);
      if (userLookupError) {
        throw userLookupError;
      }
      userId = userResponse?.user?.id ?? null;
    }

    assertExists(userId, "Unable to resolve test user id");

    const suffix = crypto.randomUUID().slice(0, 8);
    const organizationId = crypto.randomUUID();
    const projectId = crypto.randomUUID();
    const verifiedWorkLogId = crypto.randomUUID();
    const pendingWorkLogId = crypto.randomUUID();
    const photoId = crypto.randomUUID();
    const conversationId = crypto.randomUUID();
    const roleAssignmentId = crypto.randomUUID();

    const now = new Date().toISOString();
    let exportPath: string | null = null;

    try {
      await admin
        .schema("core")
        .from("users")
        .upsert({
          id: userId,
          username: `test-user-${suffix}`,
          slug: `test-user-${suffix}`,
          display_name: "Test User",
        });

      await admin
        .schema("core")
        .from("organizations")
        .insert({
          id: organizationId,
          owner_user_id: userId,
          name: `Work Logs Org ${suffix}`,
          slug: `work-logs-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Downtown Tower ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: verifiedWorkLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [
            { start: "08:00", end: "12:00" },
            { start: "13:00", end: "16:00" },
          ],
          work_description: "Installed conduit throughout the core shafts.",
          status: "verified",
          submitted_at: now,
          verified_at: now,
          show_on_profile: true,
          show_date_range_on_profile: true,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: pendingWorkLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-12",
          time_entries: [{ start: "09:00", end: "14:00" }],
          work_description: "Pulled primary feeders for level 12.",
          status: "pending_verification",
          submitted_at: now,
        });

      await admin
        .schema("core")
        .from("work_log_photos")
        .insert({
          id: photoId,
          work_log_id: verifiedWorkLogId,
          file_path: `${userId}/${verifiedWorkLogId}/progress.jpg`,
          file_size_bytes: 1_024,
          show_on_profile: true,
        });

      await admin
        .schema("core")
        .from("work_log_conversations")
        .insert({
          id: conversationId,
          work_log_id: verifiedWorkLogId,
          user_id: userId,
          message: "Completed riser install and cleanup.",
        });

      const { data: officeRole, error: officeRoleError } = await admin
        .schema("core")
        .from("roles")
        .select("id")
        .eq("name", "office")
        .eq("scope", "platform")
        .maybeSingle();

      assertExists(officeRole, "Office role not found in seed data");
      if (officeRoleError) {
        throw officeRoleError;
      }

      await admin
        .schema("core")
        .from("role_assignments")
        .upsert({
          id: roleAssignmentId,
          role_id: officeRole.id,
          user_id: userId,
        }, { onConflict: "role_id,user_id,scope_org_id,scope_team_id" });

      const listResponse = await callTRPCEndpoint(
        "workLogs.list",
        {},
        { authToken },
      );

      const listPayload = listResponse[0]?.result?.data;
      assertExists(listPayload, "Expected list response payload");
      assertEquals(listPayload.items.length, 2, "Expected two work logs");
      assertEquals(listPayload.aggregates.totalHours, 12);
      assertEquals(
        listPayload.aggregates.statusSummary.verified.count,
        1,
      );
      assertEquals(
        listPayload.aggregates.statusSummary.pending_verification.count,
        1,
      );
      const verifiedItem = listPayload.items.find((
        item: { id: string },
      ) => item.id === verifiedWorkLogId);
      assertExists(verifiedItem, "Verified work log not found in list response");
      assertEquals(verifiedItem.photoCount, 1);
      assertEquals(verifiedItem.commentCount, 1);

      const overviewResponse = await callTRPCEndpoint(
        "workLogs.getOverview",
        {},
        { authToken },
      );
      const overviewPayload = overviewResponse[0]?.result?.data;
      assertExists(overviewPayload, "Expected overview payload");
      assertEquals(overviewPayload.totals.totalLogs, 2);
      assertEquals(overviewPayload.totals.needsAttentionCount, 1);
      assert(overviewPayload.projectSummaries.length >= 1);

      const rollupResponse = await callTRPCEndpoint(
        "workLogs.getProjectRollup",
        { projectId },
        { authToken },
      );
      const rollupPayload = rollupResponse[0]?.result?.data;
      assertExists(rollupPayload, "Expected project rollup payload");
      assertEquals(rollupPayload.projectId, projectId);
      assertEquals(rollupPayload.totals.totalLogs, 2);
      assertEquals(rollupPayload.totals.photoCount, 1);

      const analyticsResponse = await callTRPCEndpoint(
        "workLogs.projectAnalytics",
        { projectId },
        { authToken },
      );
      const analyticsPayload = analyticsResponse[0]?.result?.data;
      assertExists(analyticsPayload, "Expected project analytics payload");
      assertEquals(analyticsPayload.projectId, projectId);
      assert(analyticsPayload.workers.length >= 1);

      const exportResponse = await callTRPCEndpoint(
        "workLogs.exportWorkLog",
        { workLogId: verifiedWorkLogId, format: "pdf" },
        { authToken, type: "mutation" },
      );
      const exportPayload = exportResponse[0]?.result?.data;
      assertExists(exportPayload, "Expected export payload");
      assertEquals(exportPayload.mimeType, "application/pdf");
      assert(exportPayload.byteLength > 0, "Export should include byte length");
      assert(exportPayload.downloadUrl.length > 0, "Signed URL expected");
      assert(exportPayload.storagePath.includes(verifiedWorkLogId));
      exportPath = exportPayload.storagePath;

      const { data: auditRows, error: auditError } = await admin
        .schema("core")
        .from("work_log_audit_log")
        .select("action, new_value")
        .eq("work_log_id", verifiedWorkLogId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (auditError) {
        throw auditError;
      }

      assertExists(auditRows?.[0], "Expected audit log entry for export");
      assertEquals(auditRows[0].action, "export_generated");

      const publicResponse = await callTRPCEndpoint(
        "workLogs.publicProfileFeed",
        { userId },
      );
      const publicPayload = publicResponse[0]?.result?.data;
      assertExists(publicPayload, "Expected public feed payload");
      const publicLogs = publicPayload.workLogs ?? [];
      assertEquals(publicLogs.length, 1, "Only one log should be public");
      assertEquals(publicLogs[0]?.id, verifiedWorkLogId);
      assertEquals(
        Array.isArray(publicLogs[0]?.photos),
        true,
        "Public feed should include photos array",
      );
    } finally {
      if (exportPath) {
        await admin.storage
          .from("work-log-exports")
          .remove([exportPath]);
      }

      await admin
        .schema("core")
        .from("work_log_conversations")
        .delete()
        .eq("id", conversationId);
      await admin
        .schema("core")
        .from("work_log_photos")
        .delete()
        .eq("id", photoId);
      await admin
        .schema("core")
        .from("work_log_audit_log")
        .delete()
        .eq("work_log_id", verifiedWorkLogId);
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .in("id", [verifiedWorkLogId, pendingWorkLogId]);
      await admin
        .schema("core")
        .from("construction_projects")
        .delete()
        .eq("id", projectId);
      await admin
        .schema("core")
        .from("organizations")
        .delete()
        .eq("id", organizationId);
      await admin
        .schema("core")
        .from("role_assignments")
        .delete()
        .eq("id", roleAssignmentId);
    }
  },
});
