/**
 * Feedback router baseline coverage.
 */

import { assertEquals, assertExists } from "../shared/assert.ts";

import { callTRPCEndpoint } from "../shared/setup.ts";

Deno.test({
  name: "Feedback router - submit requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "feedback.submit",
      {
        feedbackType: "bug",
        feedbackText: "Sample issue description",
        pageUrl: "https://example.com",
        userAgent: "test",
      },
      { type: "mutation" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});
