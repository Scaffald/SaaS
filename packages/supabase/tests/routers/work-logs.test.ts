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

Deno.test({
  name: "Work logs router - getProjectOptions returns organizations and projects",
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

    assertExists(authToken, "Authentication token required");

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
          name: `Test Org ${suffix}`,
          slug: `test-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Test Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      const response = await callTRPCEndpoint(
        "workLogs.getProjectOptions",
        {},
        { authToken },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected project options payload");
      assert(Array.isArray(payload.organizations), "Organizations should be array");
      assert(Array.isArray(payload.projects), "Projects should be array");
      assert(
        payload.organizations.length >= 1,
        "Should have at least one organization",
      );
      assert(payload.projects.length >= 1, "Should have at least one project");

      const org = payload.organizations.find(
        (o: { id: string }) => o.id === organizationId,
      );
      assertExists(org, "Test organization should be in response");
      assertEquals(org.name, `Test Org ${suffix}`);

      const project = payload.projects.find(
        (p: { id: string }) => p.id === projectId,
      );
      assertExists(project, "Test project should be in response");
      assertEquals(project.name, `Test Project ${suffix}`);
    } finally {
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
    }
  },
});

Deno.test({
  name: "Work logs router - getProjectOptions filters by organizationId",
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

    assertExists(authToken, "Authentication token required");

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
          name: `Filter Org ${suffix}`,
          slug: `filter-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Filter Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      const response = await callTRPCEndpoint(
        "workLogs.getProjectOptions",
        { organizationId },
        { authToken },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected project options payload");
      const org = payload.organizations.find(
        (o: { id: string }) => o.id === organizationId,
      );
      assertExists(org, "Filtered organization should be in response");
      const project = payload.projects.find(
        (p: { id: string }) => p.id === projectId,
      );
      assertExists(project, "Filtered project should be in response");
    } finally {
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
    }
  },
});

Deno.test({
  name: "Work logs router - getProjectOptions rejects access to unauthorized organization",
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

    assertExists(authToken, "Authentication token required");

    const unauthorizedOrgId = crypto.randomUUID();

    const response = await callTRPCEndpoint(
      "workLogs.getProjectOptions",
      { organizationId: unauthorizedOrgId },
      { authToken },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error for unauthorized organization");
    const code = error?.data?.code ?? "";
    assertEquals(
      code,
      "FORBIDDEN",
      "Should return FORBIDDEN for unauthorized organization",
    );
  },
});

Deno.test({
  name: "Work logs router - getProjectRollup with date filtering",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId1 = crypto.randomUUID();
    const workLogId2 = crypto.randomUUID();

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
          name: `Rollup Org ${suffix}`,
          slug: `rollup-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Rollup Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert([
          {
            id: workLogId1,
            user_id: userId,
            project_id: projectId,
            entry_type: "daily",
            log_date: "2025-01-10",
            time_entries: [{ start: "08:00", end: "12:00" }],
            work_description: "Work on day 1",
            status: "verified",
          },
          {
            id: workLogId2,
            user_id: userId,
            project_id: projectId,
            entry_type: "daily",
            log_date: "2025-01-15",
            time_entries: [{ start: "09:00", end: "13:00" }],
            work_description: "Work on day 2",
            status: "verified",
          },
        ]);

      const response = await callTRPCEndpoint(
        "workLogs.getProjectRollup",
        { projectId, dateFrom: "2025-01-10", dateTo: "2025-01-12" },
        { authToken },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected rollup payload");
      assertEquals(payload.projectId, projectId);
      assertEquals(payload.totals.totalLogs, 1, "Should filter to one log");
      assertEquals(payload.totals.totalHours, 4, "Should have 4 hours");
    } finally {
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .in("id", [workLogId1, workLogId2]);
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
    }
  },
});

Deno.test({
  name: "Work logs router - getSuggestedSkills returns suggestions",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();
    const skillId = crypto.randomUUID();

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
          name: `Skills Org ${suffix}`,
          slug: `skills-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Skills Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Electrical work",
          skills_used: [skillId],
          status: "draft",
        });

      const response = await callTRPCEndpoint(
        "workLogs.getSuggestedSkills",
        { workLogId },
        { authToken },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected suggested skills payload");
      assert(Array.isArray(payload.suggestions), "Suggestions should be array");
    } finally {
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - getCollaborators returns collaborator list",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();
    const collaboratorId = crypto.randomUUID();
    const collaboratorUserId = crypto.randomUUID();

    try {
      await admin
        .schema("core")
        .from("users")
        .upsert([
          {
            id: userId,
            username: `test-user-${suffix}`,
            slug: `test-user-${suffix}`,
            display_name: "Test User",
          },
          {
            id: collaboratorUserId,
            username: `collab-user-${suffix}`,
            slug: `collab-user-${suffix}`,
            display_name: "Collaborator User",
          },
        ]);

      await admin
        .schema("core")
        .from("organizations")
        .insert({
          id: organizationId,
          owner_user_id: userId,
          name: `Collab Org ${suffix}`,
          slug: `collab-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Collab Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Collaborative work",
          status: "draft",
        });

      await admin
        .schema("core")
        .from("work_log_collaborators")
        .insert({
          id: collaboratorId,
          work_log_id: workLogId,
          collaborator_user_id: collaboratorUserId,
          permission_level: "view",
        });

      const response = await callTRPCEndpoint(
        "workLogs.getCollaborators",
        { workLogId },
        { authToken },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected collaborators payload");
      assert(Array.isArray(payload), "Collaborators should be array");
      assert(payload.length >= 1, "Should have at least one collaborator");
      const collab = payload.find(
        (c: { id: string }) => c.id === collaboratorId,
      );
      assertExists(collab, "Test collaborator should be in response");
    } finally {
      await admin
        .schema("core")
        .from("work_log_collaborators")
        .delete()
        .eq("id", collaboratorId);
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - getConversation returns message thread",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();
    const conversationId = crypto.randomUUID();

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
          name: `Conversation Org ${suffix}`,
          slug: `conversation-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Conversation Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Work with conversation",
          status: "draft",
        });

      await admin
        .schema("core")
        .from("work_log_conversations")
        .insert({
          id: conversationId,
          work_log_id: workLogId,
          user_id: userId,
          message: "Test conversation message",
        });

      const response = await callTRPCEndpoint(
        "workLogs.getConversation",
        { workLogId },
        { authToken },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected conversation payload");
      assert(Array.isArray(payload), "Conversation should be array");
      assert(payload.length >= 1, "Should have at least one message");
      const message = payload.find(
        (m: { id: string }) => m.id === conversationId,
      );
      assertExists(message, "Test message should be in response");
      assertEquals(message.message, "Test conversation message");
    } finally {
      await admin
        .schema("core")
        .from("work_log_conversations")
        .delete()
        .eq("id", conversationId);
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - getById returns work log with relations",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();

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
          name: `GetById Org ${suffix}`,
          slug: `getbyid-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `GetById Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Test work log",
          status: "draft",
        });

      const response = await callTRPCEndpoint(
        "workLogs.getById",
        { workLogId },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected work log payload");
      assertEquals(payload.id, workLogId);
      assertEquals(payload.work_description, "Test work log");
      assert(Array.isArray(payload.photos), "Photos should be array");
      assert(Array.isArray(payload.collaborators), "Collaborators should be array");
      assert(Array.isArray(payload.conversations), "Conversations should be array");
    } finally {
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - create creates work log with draft status",
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

    assertExists(authToken, "Authentication token required");

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
    let workLogId: string | null = null;

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
          name: `Create Org ${suffix}`,
          slug: `create-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Create Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      const response = await callTRPCEndpoint(
        "workLogs.create",
        {
          projectId,
          entryType: "daily",
          logDate: "2025-01-10",
          timeEntries: [
            { start: "08:00", end: "12:00" },
            { start: "13:00", end: "16:00" },
          ],
          workDescription: "Test work log creation",
          tasksCompleted: ["Task 1", "Task 2"],
          skillsUsed: [],
        },
        { authToken, type: "mutation" },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected work log payload");
      assertEquals(payload.status, "draft", "Should create with draft status");
      assertEquals(payload.work_description, "Test work log creation");
      assertEquals(payload.user_id, userId);
      assertEquals(payload.project_id, projectId);
      workLogId = payload.id;
    } finally {
      if (workLogId) {
        await admin
          .schema("core")
          .from("work_logs")
          .delete()
          .eq("id", workLogId);
      }
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
    }
  },
});

Deno.test({
  name: "Work logs router - create rejects invalid project",
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

    assertExists(authToken, "Authentication token required");

    const invalidProjectId = crypto.randomUUID();

    const response = await callTRPCEndpoint(
      "workLogs.create",
      {
        projectId: invalidProjectId,
        entryType: "daily",
        logDate: "2025-01-10",
        timeEntries: [{ start: "08:00", end: "12:00" }],
        workDescription: "Test work log",
      },
      { authToken, type: "mutation" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error for invalid project");
    const code = error?.data?.code ?? "";
    assertEquals(code, "BAD_REQUEST", "Should return BAD_REQUEST");
  },
});

Deno.test({
  name: "Work logs router - update modifies draft work log",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();

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
          name: `Update Org ${suffix}`,
          slug: `update-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Update Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Original description",
          status: "draft",
        });

      const response = await callTRPCEndpoint(
        "workLogs.update",
        {
          workLogId,
          payload: {
            workDescription: "Updated description",
            timeEntries: [{ start: "08:00", end: "13:00" }],
          },
        },
        { authToken, type: "mutation" },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected update payload");
      assertEquals(
        payload.workLog.work_description,
        "Updated description",
        "Description should be updated",
      );
    } finally {
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - update requires reason for submitted work log",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();

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
          name: `Update Reason Org ${suffix}`,
          slug: `update-reason-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Update Reason Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Original description",
          status: "pending_verification",
          submitted_at: new Date().toISOString(),
        });

      const response = await callTRPCEndpoint(
        "workLogs.update",
        {
          workLogId,
          payload: {
            workDescription: "Updated description",
          },
        },
        { authToken, type: "mutation" },
      );

      const error = response[0]?.error;
      assertExists(error, "Expected error for missing reason");
      const code = error?.data?.code ?? "";
      assertEquals(code, "BAD_REQUEST", "Should return BAD_REQUEST");
    } finally {
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - checkTimeOverlap detects conflicts",
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

    assertExists(authToken, "Authentication token required");

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
    const existingWorkLogId = crypto.randomUUID();

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
          name: `Overlap Org ${suffix}`,
          slug: `overlap-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Overlap Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: existingWorkLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "09:00", end: "11:00" }],
          work_description: "Existing work log",
          status: "draft",
        });

      const response = await callTRPCEndpoint(
        "workLogs.checkTimeOverlap",
        {
          logDate: "2025-01-10",
          timeEntries: [{ start: "10:00", end: "12:00" }],
        },
        { authToken },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected overlap check payload");
      assertEquals(payload.hasConflicts, true, "Should detect conflicts");
      assert(payload.conflicts.length >= 1, "Should have at least one conflict");
    } finally {
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", existingWorkLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - submit transitions draft to pending_verification",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();

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
          name: `Submit Org ${suffix}`,
          slug: `submit-org-${suffix}`,
          visibility: "public",
          work_log_require_verification: true,
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Submit Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Work to submit",
          status: "draft",
        });

      const response = await callTRPCEndpoint(
        "workLogs.submit",
        { workLogId },
        { authToken, type: "mutation" },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected submit payload");
      assertEquals(
        payload.workLog.status,
        "pending_verification",
        "Should transition to pending_verification",
      );
      assertExists(payload.workLog.submitted_at, "Should have submitted_at");
    } finally {
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - verify transitions pending_verification to verified",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();
    const roleAssignmentId = crypto.randomUUID();

    try {
      const { data: officeRole, error: officeRoleError } = await admin
        .schema("core")
        .from("roles")
        .select("id")
        .eq("name", "office")
        .eq("scope", "platform")
        .maybeSingle();

      assertExists(officeRole, "Office role not found");
      if (officeRoleError) {
        throw officeRoleError;
      }

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
          name: `Verify Org ${suffix}`,
          slug: `verify-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Verify Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Work to verify",
          status: "pending_verification",
          submitted_at: new Date().toISOString(),
        });

      await admin
        .schema("core")
        .from("role_assignments")
        .upsert({
          id: roleAssignmentId,
          role_id: officeRole.id,
          user_id: userId,
        }, { onConflict: "role_id,user_id,scope_org_id,scope_team_id" });

      const response = await callTRPCEndpoint(
        "workLogs.verify",
        { workLogId },
        { authToken, type: "mutation" },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected verify payload");
      assertEquals(payload.status, "verified", "Should transition to verified");
      assertExists(payload.verified_at, "Should have verified_at");
      assertEquals(payload.verified_by_user_id, userId);
    } finally {
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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

Deno.test({
  name: "Work logs router - dispute creates dispute with conversation",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();
    const roleAssignmentId = crypto.randomUUID();

    try {
      const { data: officeRole, error: officeRoleError } = await admin
        .schema("core")
        .from("roles")
        .select("id")
        .eq("name", "office")
        .eq("scope", "platform")
        .maybeSingle();

      assertExists(officeRole, "Office role not found");
      if (officeRoleError) {
        throw officeRoleError;
      }

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
          name: `Dispute Org ${suffix}`,
          slug: `dispute-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Dispute Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Work to dispute",
          status: "pending_verification",
          submitted_at: new Date().toISOString(),
        });

      await admin
        .schema("core")
        .from("role_assignments")
        .upsert({
          id: roleAssignmentId,
          role_id: officeRole.id,
          user_id: userId,
        }, { onConflict: "role_id,user_id,scope_org_id,scope_team_id" });

      const response = await callTRPCEndpoint(
        "workLogs.dispute",
        {
          workLogId,
          reason: "Hours seem incorrect",
          message: "Please review the time entries",
        },
        { authToken, type: "mutation" },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected dispute payload");
      assertEquals(payload.status, "disputed", "Should transition to disputed");
      assertExists(payload.disputed_at, "Should have disputed_at");
      assertEquals(payload.dispute_reason, "Hours seem incorrect");
    } finally {
      await admin
        .schema("core")
        .from("work_log_conversations")
        .delete()
        .eq("work_log_id", workLogId);
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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

Deno.test({
  name: "Work logs router - addCollaborator adds collaborator with view permission",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();
    const collaboratorUserId = crypto.randomUUID();
    let collaboratorId: string | null = null;

    try {
      await admin
        .schema("core")
        .from("users")
        .upsert([
          {
            id: userId,
            username: `test-user-${suffix}`,
            slug: `test-user-${suffix}`,
            display_name: "Test User",
          },
          {
            id: collaboratorUserId,
            username: `collab-user-${suffix}`,
            slug: `collab-user-${suffix}`,
            display_name: "Collaborator",
          },
        ]);

      await admin
        .schema("core")
        .from("organizations")
        .insert({
          id: organizationId,
          owner_user_id: userId,
          name: `Collab Org ${suffix}`,
          slug: `collab-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Collab Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Collaborative work",
          status: "draft",
        });

      const response = await callTRPCEndpoint(
        "workLogs.addCollaborator",
        {
          workLogId,
          collaboratorUserId,
          permissionLevel: "view",
        },
        { authToken, type: "mutation" },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected collaborator payload");
      assertEquals(payload.work_log_id, workLogId);
      assertEquals(payload.collaborator_user_id, collaboratorUserId);
      assertEquals(payload.permission_level, "view");
      collaboratorId = payload.id;
    } finally {
      if (collaboratorId) {
        await admin
          .schema("core")
          .from("work_log_collaborators")
          .delete()
          .eq("id", collaboratorId);
      }
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - updateCollaborator changes permission level",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();
    const collaboratorUserId = crypto.randomUUID();
    const collaboratorId = crypto.randomUUID();

    try {
      await admin
        .schema("core")
        .from("users")
        .upsert([
          {
            id: userId,
            username: `test-user-${suffix}`,
            slug: `test-user-${suffix}`,
            display_name: "Test User",
          },
          {
            id: collaboratorUserId,
            username: `collab-user-${suffix}`,
            slug: `collab-user-${suffix}`,
            display_name: "Collaborator",
          },
        ]);

      await admin
        .schema("core")
        .from("organizations")
        .insert({
          id: organizationId,
          owner_user_id: userId,
          name: `Update Collab Org ${suffix}`,
          slug: `update-collab-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Update Collab Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Collaborative work",
          status: "draft",
        });

      await admin
        .schema("core")
        .from("work_log_collaborators")
        .insert({
          id: collaboratorId,
          work_log_id: workLogId,
          collaborator_user_id: collaboratorUserId,
          permission_level: "view",
        });

      const response = await callTRPCEndpoint(
        "workLogs.updateCollaborator",
        {
          workLogId,
          collaboratorUserId,
          permissionLevel: "edit",
        },
        { authToken, type: "mutation" },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected update collaborator payload");
      assertEquals(payload.permission_level, "edit", "Permission should be updated");
    } finally {
      await admin
        .schema("core")
        .from("work_log_collaborators")
        .delete()
        .eq("id", collaboratorId);
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - removeCollaborator removes collaborator access",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();
    const collaboratorUserId = crypto.randomUUID();
    const collaboratorId = crypto.randomUUID();

    try {
      await admin
        .schema("core")
        .from("users")
        .upsert([
          {
            id: userId,
            username: `test-user-${suffix}`,
            slug: `test-user-${suffix}`,
            display_name: "Test User",
          },
          {
            id: collaboratorUserId,
            username: `collab-user-${suffix}`,
            slug: `collab-user-${suffix}`,
            display_name: "Collaborator",
          },
        ]);

      await admin
        .schema("core")
        .from("organizations")
        .insert({
          id: organizationId,
          owner_user_id: userId,
          name: `Remove Collab Org ${suffix}`,
          slug: `remove-collab-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Remove Collab Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Collaborative work",
          status: "draft",
        });

      await admin
        .schema("core")
        .from("work_log_collaborators")
        .insert({
          id: collaboratorId,
          work_log_id: workLogId,
          collaborator_user_id: collaboratorUserId,
          permission_level: "view",
        });

      const response = await callTRPCEndpoint(
        "workLogs.removeCollaborator",
        {
          workLogId,
          collaboratorUserId,
        },
        { authToken, type: "mutation" },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected remove collaborator payload");

      const { data: remaining } = await admin
        .schema("core")
        .from("work_log_collaborators")
        .select("*")
        .eq("work_log_id", workLogId)
        .eq("collaborator_user_id", collaboratorUserId);

      assertEquals(remaining?.length, 0, "Collaborator should be removed");
    } finally {
      await admin
        .schema("core")
        .from("work_log_collaborators")
        .delete()
        .eq("id", collaboratorId);
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - addComment adds message to conversation",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();
    let conversationId: string | null = null;

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
          name: `Comment Org ${suffix}`,
          slug: `comment-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Comment Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Work with comments",
          status: "pending_verification",
          submitted_at: new Date().toISOString(),
        });

      const response = await callTRPCEndpoint(
        "workLogs.addComment",
        {
          workLogId,
          message: "This looks good!",
        },
        { authToken, type: "mutation" },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected comment payload");
      assertEquals(payload.message, "This looks good!");
      assertEquals(payload.work_log_id, workLogId);
      assertEquals(payload.user_id, userId);
      conversationId = payload.id;
    } finally {
      if (conversationId) {
        await admin
          .schema("core")
          .from("work_log_conversations")
          .delete()
          .eq("id", conversationId);
      }
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - addComment rejects comment on draft work log",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();

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
          name: `Comment Draft Org ${suffix}`,
          slug: `comment-draft-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Comment Draft Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Draft work",
          status: "draft",
        });

      const response = await callTRPCEndpoint(
        "workLogs.addComment",
        {
          workLogId,
          message: "Comment on draft",
        },
        { authToken, type: "mutation" },
      );

      const error = response[0]?.error;
      assertExists(error, "Expected error for draft work log");
      const code = error?.data?.code ?? "";
      assertEquals(code, "BAD_REQUEST", "Should return BAD_REQUEST");
    } finally {
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - exportWorkLog generates CSV export",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();
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
          name: `Export Org ${suffix}`,
          slug: `export-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Export Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Work to export",
          status: "verified",
          submitted_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
        });

      const response = await callTRPCEndpoint(
        "workLogs.exportWorkLog",
        { workLogId, format: "csv" },
        { authToken, type: "mutation" },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected export payload");
      assertEquals(payload.mimeType, "text/csv");
      assert(payload.byteLength > 0, "Export should include byte length");
      assert(payload.downloadUrl.length > 0, "Signed URL expected");
      assert(payload.storagePath.includes(workLogId));
      exportPath = payload.storagePath;
    } finally {
      if (exportPath) {
        await admin.storage
          .from("work-log-exports")
          .remove([exportPath]);
      }
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - updatePhotoMetadata updates caption and display order",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();
    const photoId = crypto.randomUUID();

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
          name: `Photo Metadata Org ${suffix}`,
          slug: `photo-metadata-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Photo Metadata Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Work with photo",
          status: "draft",
        });

      await admin
        .schema("core")
        .from("work_log_photos")
        .insert({
          id: photoId,
          work_log_id: workLogId,
          file_path: `${userId}/${workLogId}/photo.jpg`,
          file_size_bytes: 1_024,
          caption: "Original caption",
          display_order: 0,
        });

      const response = await callTRPCEndpoint(
        "workLogs.updatePhotoMetadata",
        {
          workLogId,
          photoId,
          caption: "Updated caption",
          displayOrder: 1,
        },
        { authToken, type: "mutation" },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected photo metadata payload");
      assertEquals(payload.caption, "Updated caption");
      assertEquals(payload.display_order, 1);
    } finally {
      await admin
        .schema("core")
        .from("work_log_photos")
        .delete()
        .eq("id", photoId);
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - updatePhotoVisibility toggles profile visibility",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();
    const photoId = crypto.randomUUID();

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
          name: `Photo Visibility Org ${suffix}`,
          slug: `photo-visibility-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Photo Visibility Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Work with photo",
          status: "draft",
        });

      await admin
        .schema("core")
        .from("work_log_photos")
        .insert({
          id: photoId,
          work_log_id: workLogId,
          file_path: `${userId}/${workLogId}/photo.jpg`,
          file_size_bytes: 1_024,
          show_on_profile: false,
        });

      const response = await callTRPCEndpoint(
        "workLogs.updatePhotoVisibility",
        {
          workLogId,
          photoId,
          showOnProfile: true,
        },
        { authToken, type: "mutation" },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected photo visibility payload");
      assertEquals(payload.show_on_profile, true);
    } finally {
      await admin
        .schema("core")
        .from("work_log_photos")
        .delete()
        .eq("id", photoId);
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - deletePhoto removes photo and updates storage",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();
    const photoId = crypto.randomUUID();
    const filePath = `${userId}/${workLogId}/photo.jpg`;

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
          name: `Delete Photo Org ${suffix}`,
          slug: `delete-photo-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Delete Photo Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Work with photo",
          status: "draft",
        });

      await admin
        .schema("core")
        .from("work_log_photos")
        .insert({
          id: photoId,
          work_log_id: workLogId,
          file_path: filePath,
          file_size_bytes: 1_024,
        });

      await admin
        .schema("core")
        .from("user_storage_usage")
        .upsert({
          user_id: userId,
          work_log_photos_bytes: 1_024,
          portfolio_photos_bytes: 0,
          certification_files_bytes: 0,
        });

      const response = await callTRPCEndpoint(
        "workLogs.deletePhoto",
        {
          workLogId,
          photoId,
        },
        { authToken, type: "mutation" },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected delete photo payload");
      assertEquals(payload.success, true);

      const { data: remaining } = await admin
        .schema("core")
        .from("work_log_photos")
        .select("*")
        .eq("id", photoId);

      assertEquals(remaining?.length, 0, "Photo should be deleted");
    } finally {
      await admin
        .schema("core")
        .from("work_log_photos")
        .delete()
        .eq("id", photoId);
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});

Deno.test({
  name: "Work logs router - updateProfileVisibility updates visibility settings",
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

    assertExists(authToken, "Authentication token required");

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
    const workLogId = crypto.randomUUID();

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
          name: `Profile Visibility Org ${suffix}`,
          slug: `profile-visibility-org-${suffix}`,
          visibility: "public",
        });

      await admin
        .schema("core")
        .from("construction_projects")
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `Profile Visibility Project ${suffix}`,
          project_number: `PRJ-${suffix}`,
          status: "active",
        });

      await admin
        .schema("core")
        .from("work_logs")
        .insert({
          id: workLogId,
          user_id: userId,
          project_id: projectId,
          entry_type: "daily",
          log_date: "2025-01-10",
          time_entries: [{ start: "08:00", end: "12:00" }],
          work_description: "Work to show on profile",
          status: "verified",
          submitted_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
          visibility: "private",
          show_on_profile: false,
        });

      const response = await callTRPCEndpoint(
        "workLogs.updateProfileVisibility",
        {
          workLogId,
          visibility: "public",
          showOnProfile: true,
          showDateRangeOnProfile: true,
        },
        { authToken, type: "mutation" },
      );

      const payload = response[0]?.result?.data;
      assertExists(payload, "Expected profile visibility payload");
      assertEquals(payload.visibility, "public");
      assertEquals(payload.show_on_profile, true);
      assertEquals(payload.show_date_range_on_profile, true);
    } finally {
      await admin
        .schema("core")
        .from("work_logs")
        .delete()
        .eq("id", workLogId);
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
    }
  },
});
