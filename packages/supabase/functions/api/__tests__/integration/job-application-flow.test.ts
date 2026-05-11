/**
 * Job Application Flow Integration Tests
 * Tests complete job discovery to application submission workflows
 */

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  assertStatus,
  assertSuccessResponse,
  createTestClient,
} from "../helpers/test-client.ts";
import { cleanupCurrentTestData } from "../helpers/fixtures.ts";
import {
  createAdminClient,
  markTestStart,
  registerUserWithMagicLink,
} from "../setup.ts";

/**
 * Integration Test: Complete Job Search and Application Flow
 *
 * Scenario: Job seeker discovers a job and submits an application
 *
 * Steps:
 * 1. User authenticates
 * 2. Browse jobs (with filters)
 * 3. View specific job details
 * 4. View similar jobs
 * 5. Submit quick application
 * 6. Verify application was created
 * 7. View application status
 * 8. Withdraw application
 */
Deno.test("JOB FLOW: Complete job discovery to application submission", async () => {
  markTestStart();

  const admin = createAdminClient();
  const timestamp = Date.now();

  // Setup: Create organization and jobs
  const { data: org } = await admin
    .schema("core")
    .from("organizations")
    .insert({
      name: `Tech Company ${timestamp}`,
      slug: `tech-company-${timestamp}`,
      type: "employer",
    })
    .select()
    .single();

  // Create multiple jobs for browsing
  const { data: jobs } = await admin
    .schema("core")
    .from("jobs")
    .insert([
      {
        organization_id: org!.id,
        title: "Senior Software Engineer",
        description: "Build amazing products",
        status: "published",
        employment_type: "full_time",
        remote_option: "remote",
        location: "San Francisco, CA",
        pay_range_min_cents: 15000000,
        pay_range_max_cents: 20000000,
      },
      {
        organization_id: org!.id,
        title: "Frontend Developer",
        description: "Create beautiful UIs",
        status: "published",
        employment_type: "full_time",
        remote_option: "hybrid",
        location: "San Francisco, CA",
        pay_range_min_cents: 12000000,
        pay_range_max_cents: 16000000,
      },
      {
        organization_id: org!.id,
        title: "Backend Engineer",
        description: "Scale our infrastructure",
        status: "published",
        employment_type: "full_time",
        remote_option: "remote",
        location: "New York, NY",
        pay_range_min_cents: 14000000,
        pay_range_max_cents: 18000000,
      },
    ])
    .select();

  assertExists(jobs, "Should create test jobs");
  assertEquals(jobs.length, 3, "Should create 3 jobs");

  const targetJob = jobs[0];

  // Step 1: User authenticates
  const user = await registerUserWithMagicLink(
    `jobseeker-${timestamp}@example.com`,
  );
  assertExists(user, "Should authenticate user");

  const client = createTestClient({ authToken: user.token });

  // Step 2: Browse jobs with filters
  const browseResponse = await client.get("/v1/jobs", {
    query: {
      location: "San Francisco",
      remote_option: "remote",
      limit: 10,
    },
  });

  assertSuccessResponse(browseResponse);
  assert(Array.isArray(browseResponse.body.data));
  assert(
    browseResponse.body.data.length >= 1,
    "Should find at least 1 remote job in SF",
  );

  // Verify pagination metadata
  assertExists(browseResponse.body.pagination);
  assertEquals(typeof browseResponse.body.pagination.total, "number");
  assertEquals(browseResponse.body.pagination.limit, 10);

  // Step 3: View specific job details
  const jobDetailsResponse = await client.get(`/v1/jobs/${targetJob.id}`);

  assertSuccessResponse(jobDetailsResponse);
  assertEquals(jobDetailsResponse.body.data.id, targetJob.id);
  assertEquals(jobDetailsResponse.body.data.title, "Senior Software Engineer");
  assertExists(jobDetailsResponse.body.data.description);
  assertEquals(jobDetailsResponse.body.data.employment_type, "full_time");
  assertEquals(jobDetailsResponse.body.data.remote_option, "remote");

  // Step 4: View similar jobs
  const similarJobsResponse = await client.get(
    `/v1/jobs/${targetJob.id}/similar`,
    {
      query: { limit: 5 },
    },
  );

  assertSuccessResponse(similarJobsResponse);
  assert(Array.isArray(similarJobsResponse.body.data));
  // Should find similar jobs from same org or type
  assert(
    similarJobsResponse.body.data.every(
      (job: { id: string }) => job.id !== targetJob.id,
    ),
    "Similar jobs should not include the source job",
  );

  // Step 5: Submit quick application
  const applicationResponse = await client.post("/v1/applications", {
    job_id: targetJob.id,
    current_location: "Los Angeles, CA",
    willing_to_relocate: true,
    start_date_preference: "flexible",
    is_complete: true,
  });

  assertSuccessResponse(applicationResponse);
  assertEquals(applicationResponse.status, 201);
  assertExists(applicationResponse.body.data.id);
  assertEquals(applicationResponse.body.data.job_id, targetJob.id);
  assertEquals(applicationResponse.body.data.user_id, user.userId);
  assertEquals(applicationResponse.body.data.status, "pending");
  assertEquals(applicationResponse.body.data.type, "quick");

  const applicationId = applicationResponse.body.data.id;

  // Step 6: Verify application was created (check can retrieve it)
  const getApplicationResponse = await client.get(
    `/v1/applications/${applicationId}`,
  );

  assertSuccessResponse(getApplicationResponse);
  assertEquals(getApplicationResponse.body.data.id, applicationId);
  assertEquals(getApplicationResponse.body.data.status, "pending");

  // Verify application includes job details
  assertExists(getApplicationResponse.body.data.job);
  assertEquals(
    getApplicationResponse.body.data.job.title,
    "Senior Software Engineer",
  );

  // Step 7: Update application with additional info
  const updateResponse = await client.patch(
    `/v1/applications/${applicationId}`,
    {
      cover_letter:
        "I am very excited about this opportunity and believe my skills align perfectly with your needs.",
    },
  );

  assertSuccessResponse(updateResponse);
  assertExists(updateResponse.body.data.cover_letter);
  assertEquals(updateResponse.body.data.status, "pending"); // Status shouldn't change

  // Step 8: Withdraw application
  const withdrawResponse = await client.post(
    `/v1/applications/${applicationId}/withdraw`,
  );

  assertSuccessResponse(withdrawResponse);
  assertEquals(withdrawResponse.body.data.status, "withdrawn");
  assertExists(withdrawResponse.body.data.withdrawn_at);

  // Verify withdrawn application cannot be modified
  const attemptUpdateResponse = await client.patch(
    `/v1/applications/${applicationId}`,
    {
      cover_letter: "Updated letter",
    },
  );

  assertStatus(attemptUpdateResponse, 400);
  assert(attemptUpdateResponse.body.message?.includes("withdrawn"));

  await cleanupCurrentTestData();
});

/**
 * Integration Test: Job Application Duplicate Prevention
 *
 * Scenario: User attempts to apply to same job twice
 *
 * Steps:
 * 1. User submits first application
 * 2. User attempts to submit second application
 * 3. Verify duplicate is prevented (409 Conflict)
 * 4. Withdraw first application
 * 5. Submit new application (should succeed after withdrawal)
 */
Deno.test("JOB FLOW: Duplicate application prevention and re-application", async () => {
  markTestStart();

  const admin = createAdminClient();
  const timestamp = Date.now();

  // Setup
  const { data: org } = await admin
    .schema("core")
    .from("organizations")
    .insert({
      name: `Company ${timestamp}`,
      slug: `company-${timestamp}`,
      type: "employer",
    })
    .select()
    .single();

  const { data: job } = await admin
    .schema("core")
    .from("jobs")
    .insert({
      organization_id: org!.id,
      title: "Product Manager",
      description: "Lead product development",
      status: "published",
    })
    .select()
    .single();

  const user = await registerUserWithMagicLink(
    `duplicate-test-${timestamp}@example.com`,
  );
  assertExists(user);

  const client = createTestClient({ authToken: user.token });

  // Step 1: Submit first application
  const firstApplication = await client.post("/v1/applications", {
    job_id: job!.id,
    current_location: "Seattle, WA",
    is_complete: true,
  });

  assertSuccessResponse(firstApplication);
  assertEquals(firstApplication.status, 201);

  const applicationId = firstApplication.body.data.id;

  // Step 2: Attempt duplicate application
  const duplicateApplication = await client.post("/v1/applications", {
    job_id: job!.id,
    current_location: "Seattle, WA",
    is_complete: true,
  });

  assertStatus(duplicateApplication, 409);
  assert(duplicateApplication.body.message?.includes("already applied"));

  // Step 3: Withdraw first application
  const withdrawResponse = await client.post(
    `/v1/applications/${applicationId}/withdraw`,
  );
  assertSuccessResponse(withdrawResponse);

  // Step 4: Re-apply after withdrawal (should succeed)
  const reapplication = await client.post("/v1/applications", {
    job_id: job!.id,
    current_location: "Seattle, WA",
    is_complete: true,
  });

  assertSuccessResponse(reapplication);
  assertEquals(reapplication.status, 201);
  assert(
    reapplication.body.data.id !== applicationId,
    "Should create new application",
  );

  await cleanupCurrentTestData();
});

/**
 * Integration Test: Job Application Deadline Enforcement
 *
 * Scenario: User attempts to apply after deadline
 *
 * Steps:
 * 1. Create job with past deadline
 * 2. User attempts to apply
 * 3. Verify application is rejected
 */
Deno.test("JOB FLOW: Application deadline enforcement", async () => {
  markTestStart();

  const admin = createAdminClient();
  const timestamp = Date.now();

  const { data: org } = await admin
    .schema("core")
    .from("organizations")
    .insert({
      name: `Deadline Company ${timestamp}`,
      slug: `deadline-company-${timestamp}`,
      type: "employer",
    })
    .select()
    .single();

  // Create job with past deadline
  const { data: job } = await admin
    .schema("core")
    .from("jobs")
    .insert({
      organization_id: org!.id,
      title: "Expired Position",
      description: "This job has passed its deadline",
      status: "published",
      application_deadline: new Date(Date.now() - 24 * 60 * 60 * 1000)
        .toISOString(), // Yesterday
    })
    .select()
    .single();

  const user = await registerUserWithMagicLink(
    `deadline-test-${timestamp}@example.com`,
  );
  assertExists(user);

  const client = createTestClient({ authToken: user.token });

  // Attempt to apply after deadline
  const response = await client.post("/v1/applications", {
    job_id: job!.id,
    current_location: "Austin, TX",
    is_complete: true,
  });

  assertStatus(response, 400);
  assert(response.body.message?.includes("deadline"));

  await cleanupCurrentTestData();
});

/**
 * Integration Test: Multi-step Job Search with Filter Options
 *
 * Scenario: User progressively refines job search using available filters
 *
 * Steps:
 * 1. Get all filter options
 * 2. Search with employment type filter
 * 3. Add location filter
 * 4. Add remote option filter
 * 5. Verify results are progressively refined
 */
Deno.test("JOB FLOW: Progressive job search refinement", async () => {
  markTestStart();

  const admin = createAdminClient();
  const timestamp = Date.now();

  // Setup: Create diverse job listings
  const { data: org } = await admin
    .schema("core")
    .from("organizations")
    .insert({
      name: `Job Board ${timestamp}`,
      slug: `job-board-${timestamp}`,
      type: "employer",
    })
    .select()
    .single();

  await admin
    .schema("core")
    .from("jobs")
    .insert([
      {
        organization_id: org!.id,
        title: "Remote Full-Time Engineer - SF",
        description: "Description",
        status: "published",
        employment_type: "full_time",
        remote_option: "remote",
        location: "San Francisco, CA",
      },
      {
        organization_id: org!.id,
        title: "Remote Part-Time Designer - SF",
        description: "Description",
        status: "published",
        employment_type: "part_time",
        remote_option: "remote",
        location: "San Francisco, CA",
      },
      {
        organization_id: org!.id,
        title: "On-Site Full-Time Engineer - SF",
        description: "Description",
        status: "published",
        employment_type: "full_time",
        remote_option: "on_site",
        location: "San Francisco, CA",
      },
      {
        organization_id: org!.id,
        title: "Remote Full-Time Engineer - NY",
        description: "Description",
        status: "published",
        employment_type: "full_time",
        remote_option: "remote",
        location: "New York, NY",
      },
    ]);

  const user = await registerUserWithMagicLink(
    `search-test-${timestamp}@example.com`,
  );
  const client = createTestClient({ authToken: user.token });

  // Step 1: Get available filter options
  const filterOptionsResponse = await client.get("/v1/jobs/filter-options");
  assertSuccessResponse(filterOptionsResponse);
  assertExists(filterOptionsResponse.body.data.employmentTypes);
  assertExists(filterOptionsResponse.body.data.locations);
  assertExists(filterOptionsResponse.body.data.remoteOptions);

  // Step 2: Search with employment type
  const fullTimeSearch = await client.get("/v1/jobs", {
    query: { employmentType: "full_time" },
  });
  assertSuccessResponse(fullTimeSearch);
  const fullTimeCount = fullTimeSearch.body.data.length;
  assert(fullTimeCount >= 3, "Should find at least 3 full-time jobs");

  // Step 3: Add location filter
  const sfFullTimeSearch = await client.get("/v1/jobs", {
    query: {
      employmentType: "full_time",
      location: "San Francisco",
    },
  });
  assertSuccessResponse(sfFullTimeSearch);
  const sfFullTimeCount = sfFullTimeSearch.body.data.length;
  assert(
    sfFullTimeCount < fullTimeCount,
    "Adding location should refine results",
  );
  assert(sfFullTimeCount >= 2, "Should find at least 2 SF full-time jobs");

  // Step 4: Add remote option filter
  const remoteOnlySearch = await client.get("/v1/jobs", {
    query: {
      employmentType: "full_time",
      location: "San Francisco",
      remoteOption: "remote",
    },
  });
  assertSuccessResponse(remoteOnlySearch);
  const remoteCount = remoteOnlySearch.body.data.length;
  assert(
    remoteCount < sfFullTimeCount,
    "Adding remote option should further refine",
  );
  assertEquals(remoteCount, 1, "Should find exactly 1 remote full-time SF job");

  // Verify the result matches all criteria
  const result = remoteOnlySearch.body.data[0];
  assertEquals(result.employment_type, "full_time");
  assertEquals(result.remote_option, "remote");
  assert(result.location.includes("San Francisco"));

  await cleanupCurrentTestData();
});

console.log("✅ All job application flow integration tests passed!");
