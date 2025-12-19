/**
 * Applications router baseline coverage.
 */

import { assertEquals, assertExists } from "../shared/assert.ts";

import { callTRPCEndpoint, loadCachedTokens } from "../shared/setup.ts";
import { requireAuthSetup } from "../shared/test-context.ts";

const TEST_JOB_ID = "00000000-0000-0000-0000-000000000000";

function buildSubmitPayload() {
  return {
    job_id: TEST_JOB_ID,
    current_location: "Test City, TS",
    willing_to_relocate: false,
    years_experience: 3,
    is_authorized_to_work: true,
    earliest_start_date: new Date().toISOString(),
    is_complete: true as const,
  };
}

Deno.test({
  name: "Applications router - submit requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "applications.submit",
      buildSubmitPayload(),
      { type: "mutation" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error payload");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Applications router - submit validates job existence",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "applications.submit",
      buildSubmitPayload(),
      {
        type: "mutation",
        authToken: tokens.regular.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected NOT_FOUND response for unknown job");
    assertEquals(error?.data?.code, "NOT_FOUND");
  },
});
