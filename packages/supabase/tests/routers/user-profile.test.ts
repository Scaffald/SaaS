/**
 * User profile router baseline coverage.
 */

import { assertEquals, assertExists } from "../shared/assert.ts";

import { callTRPCEndpoint } from "../shared/setup.ts";

Deno.test({
  name: "User profile router - getPreview returns NOT_FOUND for unknown user",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("userProfile.getPreview", {
      userId: crypto.randomUUID(),
    });

    const error = response[0]?.error;
    assertExists(error, "Expected error payload");
    assertEquals(error?.data?.code, "NOT_FOUND");
  },
});
