/**
 * Jobs router baseline coverage.
 */

import { assertEquals, assertExists } from '../shared/assert';

import { callTRPCEndpoint, loadCachedTokens } from '../shared/setup';
import { requireAuthSetup } from '../shared/test-context';

const UNKNOWN_JOB_ID = '00000000-0000-0000-0000-000000000000';

Deno.test({
  name: "Jobs router - external feed returns data array",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("jobs.getExternalJobs");
    assertEquals(Array.isArray(response), true, "tRPC batch payload expected");

    const firstEntry = response[0];
    assertExists(firstEntry, "Expected first batch entry");

    if (firstEntry.error) {
      assertExists(
        firstEntry.error.data?.code,
        "Error payload should include a code",
      );
      return;
    }

    const result = firstEntry.result?.data;
    assertExists(result, "Response should contain data payload");
    assertEquals(Array.isArray(result.jobs), true, "jobs should be an array");
  },
});

Deno.test({
  name: "Jobs router - published jobs listing supports pagination",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("jobs.getPublishedJobs", {
      limit: 5,
      offset: 0,
    });

    const result = response[0]?.result?.data;
    assertExists(result, "Published jobs response should contain data");
    assertEquals(Array.isArray(result.jobs), true, "jobs should be an array");
    assertEquals(typeof result.total, "number", "total should be numeric");
  },
});

Deno.test({
  name: "Jobs router - job details returns NOT_FOUND for unknown id",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("jobs.getJobDetails", {
      id: UNKNOWN_JOB_ID,
    });

    const error = response[0]?.error;
    assertExists(error, "Expected error payload for missing job");
    assertEquals(error?.data?.code, "NOT_FOUND");
  },
});

Deno.test({
  name: "Jobs router - createApplication requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const unauthorized = await callTRPCEndpoint(
      "jobs.createApplication",
      {
        job_id: UNKNOWN_JOB_ID,
        cover_letter: "",
        resume_path: null,
      },
      { type: "mutation" },
    );

    const unauthError = unauthorized[0]?.error;
    assertExists(unauthError, "Expected UNAUTHORIZED response");
    assertEquals(unauthError?.data?.code, "UNAUTHORIZED");

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be available after setup");

    const notFound = await callTRPCEndpoint(
      "jobs.createApplication",
      {
        job_id: UNKNOWN_JOB_ID,
        cover_letter: "I am interested in this role",
        resume_path: null,
      },
      {
        type: "mutation",
        authToken: tokens.regular.token,
      },
    );

    const error = notFound[0]?.error;
    assertExists(error, "Expected error for invalid job id");
    const errorCode = error?.data?.code;
    assertEquals(
      ["NOT_FOUND", "BAD_REQUEST"].includes(errorCode ?? ""),
      true,
      "Error code should indicate missing or invalid job",
    );
  },
});
