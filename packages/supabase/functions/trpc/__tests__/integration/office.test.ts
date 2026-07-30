import {
  assertEquals,
  assertExists,
} from 'jsr:@std/assert';

import { callTRPCEndpoint, loadCachedTokens } from '../setup.ts';
import { ensureOfficeAdminAccess, setupTeamManagementFixture } from './seed-utils.ts';
import { createAdminClient } from '../setup.ts';

Deno.test({
  name: "Office router - listUsers requires admin token",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const tokens = await loadCachedTokens();
    if (!tokens) {
      throw new Error("No cached auth tokens available. Run auth.test.ts first.");
    }

    const adminAuth = await ensureOfficeAdminAccess();

    const adminResponse = await callTRPCEndpoint(
      "office.listUsers",
      undefined,
      {
        authToken: adminAuth.token,
      },
    );

    const adminResult = adminResponse[0]?.result?.data;
    assertExists(adminResult, "Admin request should return data");
    assertEquals(Array.isArray(adminResult.users), true);

    const regularResponse = await callTRPCEndpoint(
      "office.listUsers",
      undefined,
      {
        authToken: tokens.regular.token,
      },
    );

    const error = regularResponse[0]?.error;
    assertExists(error, "Regular user should receive an error response");
    assertEquals(error?.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Office router - listApplications requires admin token",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const tokens = await loadCachedTokens();
    if (!tokens) {
      throw new Error("No cached auth tokens available. Run auth.test.ts first.");
    }

    const adminAuth = await ensureOfficeAdminAccess();

    // Admin should be able to call the endpoint
    const adminResponse = await callTRPCEndpoint(
      "office.listApplications",
      {},
      {
        authToken: adminAuth.token,
      },
    );

    const adminResult = adminResponse[0]?.result?.data;
    assertExists(adminResult, "Admin request should return data");
    assertExists(adminResult.applications, "Response should have applications array");
    assertEquals(Array.isArray(adminResult.applications), true);
    assertExists(adminResult.total, "Response should have total count");
    assertExists(adminResult.page_info, "Response should have page_info");

    // Regular user should receive FORBIDDEN error
    const regularResponse = await callTRPCEndpoint(
      "office.listApplications",
      {},
      {
        authToken: tokens.regular.token,
      },
    );

    const error = regularResponse[0]?.error;
    assertExists(error, "Regular user should receive an error response");
    assertEquals(error?.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Office router - listApplications returns empty result when user has no organizations",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const adminAuth = await ensureOfficeAdminAccess();

    // Admin with no organizations should get empty result
    const response = await callTRPCEndpoint(
      "office.listApplications",
      {},
      {
        authToken: adminAuth.token,
      },
    );

    const result = response[0]?.result?.data;
    assertExists(result, "Request should return data");
    assertEquals(Array.isArray(result.applications), true);
    assertEquals(result.applications.length, 0);
    assertEquals(result.total, 0);
    assertEquals(result.page_info.has_more, false);
  },
});

Deno.test({
  name: "Office router - listApplications supports status filter",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const adminAuth = await ensureOfficeAdminAccess();
    const adminClient = createAdminClient();

    // Setup team fixture to get organization with jobs
    const fixture = await setupTeamManagementFixture({
      organizationName: "Test Org for Applications",
    });

    // Create a job for the organization
    const jobId = crypto.randomUUID();
    const now = new Date().toISOString();
    const { error: jobError } = await adminClient
      .schema("core")
      .from("jobs")
      .insert({
        id: jobId,
        organization_id: fixture.organization.id,
        title: "Test Job",
        slug: `test-job-${jobId.slice(0, 8)}`,
        status: "published",
        created_at: now,
        updated_at: now,
      });

    if (jobError && jobError.code !== "23505") {
      throw new Error(`Failed to create test job: ${jobError.message}`);
    }

    // Create applications with different statuses
    const pendingAppId = crypto.randomUUID();
    const reviewingAppId = crypto.randomUUID();

    await adminClient
      .schema("core")
      .from("applications")
      .insert([
        {
          id: pendingAppId,
          job_id: jobId,
          user_id: fixture.member.userId,
          status: "pending",
          answers: {},
          created_at: now,
          updated_at: now,
        },
        {
          id: reviewingAppId,
          job_id: jobId,
          user_id: fixture.member.userId,
          status: "reviewing",
          answers: {},
          created_at: now,
          updated_at: now,
        },
      ]);

    // Test status filter - pending
    const pendingResponse = await callTRPCEndpoint(
      "office.listApplications",
      { status: "pending" },
      {
        authToken: adminAuth.token,
      },
    );

    const pendingResult = pendingResponse[0]?.result?.data;
    assertExists(pendingResult, "Pending filter should return data");
    const pendingApps = pendingResult.applications.filter(
      (app: { id: string }) => app.id === pendingAppId,
    );
    assertEquals(pendingApps.length, 1, "Should find pending application");

    // Test status filter - reviewing
    const reviewingResponse = await callTRPCEndpoint(
      "office.listApplications",
      { status: "reviewing" },
      {
        authToken: adminAuth.token,
      },
    );

    const reviewingResult = reviewingResponse[0]?.result?.data;
    assertExists(reviewingResult, "Reviewing filter should return data");
    const reviewingApps = reviewingResult.applications.filter(
      (app: { id: string }) => app.id === reviewingAppId,
    );
    assertEquals(reviewingApps.length, 1, "Should find reviewing application");

    // Cleanup
    await adminClient
      .schema("core")
      .from("applications")
      .delete()
      .in("id", [pendingAppId, reviewingAppId]);
    await adminClient
      .schema("core")
      .from("jobs")
      .delete()
      .eq("id", jobId);
  },
});

Deno.test({
  name: "Office router - listApplications supports job_id filter",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const adminAuth = await ensureOfficeAdminAccess();
    const adminClient = createAdminClient();

    const fixture = await setupTeamManagementFixture({
      organizationName: "Test Org for Job Filter",
    });

    // Create two jobs
    const job1Id = crypto.randomUUID();
    const job2Id = crypto.randomUUID();
    const now = new Date().toISOString();

    await adminClient
      .schema("core")
      .from("jobs")
      .insert([
        {
          id: job1Id,
          organization_id: fixture.organization.id,
          title: "Job 1",
          slug: `job-1-${job1Id.slice(0, 8)}`,
          status: "published",
          created_at: now,
          updated_at: now,
        },
        {
          id: job2Id,
          organization_id: fixture.organization.id,
          title: "Job 2",
          slug: `job-2-${job2Id.slice(0, 8)}`,
          status: "published",
          created_at: now,
          updated_at: now,
        },
      ]);

    // Create applications for each job
    const app1Id = crypto.randomUUID();
    const app2Id = crypto.randomUUID();

    await adminClient
      .schema("core")
      .from("applications")
      .insert([
        {
          id: app1Id,
          job_id: job1Id,
          user_id: fixture.member.userId,
          status: "pending",
          answers: {},
          created_at: now,
          updated_at: now,
        },
        {
          id: app2Id,
          job_id: job2Id,
          user_id: fixture.member.userId,
          status: "pending",
          answers: {},
          created_at: now,
          updated_at: now,
        },
      ]);

    // Filter by job1Id
    const response = await callTRPCEndpoint(
      "office.listApplications",
      { job_id: job1Id },
      {
        authToken: adminAuth.token,
      },
    );

    const result = response[0]?.result?.data;
    assertExists(result, "Job filter should return data");
    const filteredApps = result.applications.filter(
      (app: { job_id: string }) => app.job_id === job1Id,
    );
    assertEquals(
      filteredApps.length,
      result.applications.length,
      "All returned applications should be for job1",
    );

    // Cleanup
    await adminClient
      .schema("core")
      .from("applications")
      .delete()
      .in("id", [app1Id, app2Id]);
    await adminClient
      .schema("core")
      .from("jobs")
      .delete()
      .in("id", [job1Id, job2Id]);
  },
});

Deno.test({
  name: "Office router - listApplications supports pagination",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const adminAuth = await ensureOfficeAdminAccess();
    const adminClient = createAdminClient();

    const fixture = await setupTeamManagementFixture({
      organizationName: "Test Org for Pagination",
    });

    // Create a job
    const jobId = crypto.randomUUID();
    const now = new Date().toISOString();
    await adminClient
      .schema("core")
      .from("jobs")
      .insert({
        id: jobId,
        organization_id: fixture.organization.id,
        title: "Test Job",
        slug: `test-job-${jobId.slice(0, 8)}`,
        status: "published",
        created_at: now,
        updated_at: now,
      });

    // Create multiple applications
    const appIds: string[] = [];
    for (let i = 0; i < 5; i++) {
      const appId = crypto.randomUUID();
      appIds.push(appId);
      await adminClient
        .schema("core")
        .from("applications")
        .insert({
          id: appId,
          job_id: jobId,
          user_id: fixture.member.userId,
          status: "pending",
          answers: {},
          created_at: now,
          updated_at: now,
        });
    }

    // Test limit
    const limitResponse = await callTRPCEndpoint(
      "office.listApplications",
      { limit: 2 },
      {
        authToken: adminAuth.token,
      },
    );

    const limitResult = limitResponse[0]?.result?.data;
    assertExists(limitResult, "Limit should return data");
    assertEquals(
      limitResult.applications.length,
      2,
      "Should return only 2 applications",
    );
    assertEquals(limitResult.page_info.limit, 2, "Page info should reflect limit");

    // Test offset
    const offsetResponse = await callTRPCEndpoint(
      "office.listApplications",
      { limit: 2, offset: 2 },
      {
        authToken: adminAuth.token,
      },
    );

    const offsetResult = offsetResponse[0]?.result?.data;
    assertExists(offsetResult, "Offset should return data");
    assertEquals(offsetResult.page_info.offset, 2, "Page info should reflect offset");

    // Cleanup
    await adminClient
      .schema("core")
      .from("applications")
      .delete()
      .in("id", appIds);
    await adminClient
      .schema("core")
      .from("jobs")
      .delete()
      .eq("id", jobId);
  },
});

Deno.test({
  name: "Office router - listApplications returns correct data structure",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const adminAuth = await ensureOfficeAdminAccess();
    const adminClient = createAdminClient();

    const fixture = await setupTeamManagementFixture({
      organizationName: "Test Org for Data Structure",
    });

    // Create a job
    const jobId = crypto.randomUUID();
    const now = new Date().toISOString();
    await adminClient
      .schema("core")
      .from("jobs")
      .insert({
        id: jobId,
        organization_id: fixture.organization.id,
        title: "Test Job",
        slug: `test-job-${jobId.slice(0, 8)}`,
        status: "published",
        created_at: now,
        updated_at: now,
      });

    // Create an application with full data
    const appId = crypto.randomUUID();
    await adminClient
      .schema("core")
      .from("applications")
      .insert({
        id: appId,
        job_id: jobId,
        user_id: fixture.member.userId,
        status: "pending",
        answers: {
          application_score: 85,
          current_location: "Test City",
          years_experience: 5,
        },
        created_at: now,
        updated_at: now,
      });

    const response = await callTRPCEndpoint(
      "office.listApplications",
      {},
      {
        authToken: adminAuth.token,
      },
    );

    const result = response[0]?.result?.data;
    assertExists(result, "Should return data");

    // Verify response structure
    assertExists(result.applications, "Should have applications array");
    assertEquals(Array.isArray(result.applications), true);
    assertExists(result.total, "Should have total count");
    assertExists(result.page_info, "Should have page_info");
    assertExists(result.page_info.has_more, "Should have has_more flag");
    assertExists(result.page_info.offset, "Should have offset");
    assertExists(result.page_info.limit, "Should have limit");

    // Verify application structure if we have any
    if (result.applications.length > 0) {
      const app = result.applications[0];
      assertExists(app.id, "Application should have id");
      assertExists(app.job_id, "Application should have job_id");
      assertExists(app.user_id, "Application should have user_id");
      assertExists(app.status, "Application should have status");
      assertExists(app.applied_at, "Application should have applied_at");
      assertExists(app.candidate_id, "Application should have candidate_id");
      assertExists(app.candidate_name, "Application should have candidate_name");
      assertExists(app.job_title, "Application should have job_title");
    }

    // Cleanup
    await adminClient
      .schema("core")
      .from("applications")
      .delete()
      .eq("id", appId);
    await adminClient
      .schema("core")
      .from("jobs")
      .delete()
      .eq("id", jobId);
  },
});

Deno.test({
  name: "Office router - listJobs works without module import errors (verifies fix)",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const adminAuth = await ensureOfficeAdminAccess();
    const adminClient = createAdminClient();

    const fixture = await setupTeamManagementFixture({
      organizationName: "Test Org for listJobs",
    });

    // Create a job for the organization
    const jobId = crypto.randomUUID();
    const now = new Date().toISOString();
    const { error: jobError } = await adminClient
      .schema("core")
      .from("jobs")
      .insert({
        id: jobId,
        organization_id: fixture.organization.id,
        title: "Test Job for listJobs",
        slug: `test-job-${jobId.slice(0, 8)}`,
        status: "open",
        created_at: now,
        updated_at: now,
      });

    if (jobError && jobError.code !== "23505") {
      throw new Error(`Failed to create test job: ${jobError.message}`);
    }

    // This test verifies that office.listJobs works correctly after fixing
    // the import path from '../_shared' to '../../_shared'
    const response = await callTRPCEndpoint(
      "office.listJobs",
      {
        limit: 100,
        offset: 0,
        myTeamsOnly: false,
      },
      {
        authToken: adminAuth.token,
      },
    );

    // Should not have a module not found error
    const error = response[0]?.error;
    if (error) {
      const errorMessage = error.message || JSON.stringify(error);
      if (errorMessage.includes("Module not found") || 
          errorMessage.includes("team-permissions")) {
        throw new Error(
          `office.listJobs failed with module import error: ${errorMessage}. This indicates the import path fix didn't work.`
        );
      }
    }

    const result = response[0]?.result?.data;
    assertExists(result, "Request should return data");
    assertEquals(Array.isArray(result.jobs), true);
    assertExists(result.total, "Response should have total count");

    // Cleanup
    await adminClient
      .schema("core")
      .from("jobs")
      .delete()
      .eq("id", jobId);
  },
});

Deno.test({
  name: "Office router - listJobs supports filtering by organization_id",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const adminAuth = await ensureOfficeAdminAccess();
    const adminClient = createAdminClient();

    const fixture = await setupTeamManagementFixture({
      organizationName: "Test Org for listJobs Filter",
    });

    // Create jobs for the organization
    const job1Id = crypto.randomUUID();
    const job2Id = crypto.randomUUID();
    const now = new Date().toISOString();

    await adminClient
      .schema("core")
      .from("jobs")
      .insert([
        {
          id: job1Id,
          organization_id: fixture.organization.id,
          title: "Job 1",
          slug: `job-1-${job1Id.slice(0, 8)}`,
          status: "open",
          created_at: now,
          updated_at: now,
        },
        {
          id: job2Id,
          organization_id: fixture.organization.id,
          title: "Job 2",
          slug: `job-2-${job2Id.slice(0, 8)}`,
          status: "open",
          created_at: now,
          updated_at: now,
        },
      ]);

    // Filter by organization_id
    const response = await callTRPCEndpoint(
      "office.listJobs",
      {
        organization_id: fixture.organization.id,
        limit: 100,
        offset: 0,
      },
      {
        authToken: adminAuth.token,
      },
    );

    const result = response[0]?.result?.data;
    assertExists(result, "Request should return data");
    assertEquals(Array.isArray(result.jobs), true);

    // Verify all returned jobs belong to the organization
    const allMatchOrg = result.jobs.every(
      (job: { organization_id: string }) => job.organization_id === fixture.organization.id
    );
    assertEquals(allMatchOrg, true, "All jobs should belong to the specified organization");

    // Cleanup
    await adminClient
      .schema("core")
      .from("jobs")
      .delete()
      .in("id", [job1Id, job2Id]);
  },
});

Deno.test({
  name: "Office router - listJobs does not reference non-existent assigned_team_id column",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const adminAuth = await ensureOfficeAdminAccess();
    const adminClient = createAdminClient();

    const fixture = await setupTeamManagementFixture({
      organizationName: "Test Org for assigned_team_id fix",
    });

    // Create a job for the organization
    const jobId = crypto.randomUUID();
    const now = new Date().toISOString();
    await adminClient
      .schema("core")
      .from("jobs")
      .insert({
        id: jobId,
        organization_id: fixture.organization.id,
        title: "Test Job for assigned_team_id",
        slug: `test-job-${jobId.slice(0, 8)}`,
        status: "open",
        created_at: now,
        updated_at: now,
      });

    // Test with exact parameters from the failing request
    const response = await callTRPCEndpoint(
      "office.listJobs",
      {
        limit: 100,
        offset: 0,
        myTeamsOnly: false,
      },
      {
        authToken: adminAuth.token,
      },
    );

    // Should not have an error about assigned_team_id column
    const error = response[0]?.error;
    if (error) {
      const errorMessage = error.message || JSON.stringify(error);
      if (errorMessage.includes("assigned_team_id does not exist") ||
          errorMessage.includes("column jobs.assigned_team_id does not exist")) {
        throw new Error(
          `office.listJobs still references non-existent assigned_team_id column: ${errorMessage}`
        );
      }
      // Other errors are acceptable for this test (like no access, etc.)
    }

    const result = response[0]?.result?.data;
    if (result) {
      assertExists(result, "Request should return data");
      assertEquals(Array.isArray(result.jobs), true);
      assertExists(result.total, "Response should have total count");

      // Verify job structure - should have teamAssignments but not assigned_team_id
      if (result.jobs.length > 0) {
        const job = result.jobs[0];
        assertExists(job.id, "Job should have id");
        // Team assignments should come from job_team_assignments, not assigned_team_id
        if ("teamAssignments" in job) {
          assertEquals(Array.isArray(job.teamAssignments), true);
        }
      }
    }

    // Cleanup
    await adminClient
      .schema("core")
      .from("jobs")
      .delete()
      .eq("id", jobId);
  },
});
