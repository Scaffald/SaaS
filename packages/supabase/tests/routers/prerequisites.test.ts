/**
 * Prerequisites router baseline coverage.
 */

import { assertEquals, assertExists } from "../shared/assert.ts";

import { callTRPCEndpoint, loadCachedTokens } from "../shared/setup.ts";
import { requireAuthSetup } from "../shared/test-context.ts";

Deno.test({
  name: "Prerequisites router - check requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("prerequisites.check");

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Prerequisites router - check returns status for authenticated user",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "prerequisites.check",
      undefined,
      { authToken: tokens.regular.token },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected status payload");
    assertEquals(typeof data.isComplete, "boolean");
  },
});
