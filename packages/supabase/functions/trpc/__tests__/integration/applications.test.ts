import {
  assertEquals,
  assertExists,
} from 'jsr:@std/assert';

import { callTRPCEndpoint, loadCachedTokens } from '../setup';

const TEST_JOB_ID = '00000000-0000-0000-0000-000000000000';

function buildSubmitPayload() {
  return {
    job_id: TEST_JOB_ID,
    current_location: "San Francisco, CA",
    willing_to_relocate: false,
    years_experience: 5,
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
    assertExists(error, "Expected UNAUTHORIZED response");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Applications router - submit validates job existence",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const tokens = await loadCachedTokens();
    if (!tokens) {
      throw new Error("No cached auth tokens available. Run auth.test.ts first.");
    }

    const response = await callTRPCEndpoint(
      "applications.submit",
      buildSubmitPayload(),
      {
        type: "mutation",
        authToken: tokens.regular.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected NOT_FOUND response for missing job");
    assertEquals(error?.data?.code, "NOT_FOUND");
  },
});
