/**
 * Portfolio router baseline coverage.
 */

import { assertEquals, assertExists } from "../shared/assert.ts";

import { callTRPCEndpoint, loadCachedTokens } from "../shared/setup.ts";
import { requireAuthSetup } from "../shared/test-context.ts";

Deno.test({
  name: "Portfolio router - list requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("portfolio.list");

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error payload");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Portfolio router - list returns array for authenticated user",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be available");

    const response = await callTRPCEndpoint(
      "portfolio.list",
      undefined,
      { authToken: tokens.regular.token },
    );

    const result = response[0]?.result?.data;
    assertExists(result, "Expected data payload");
    assertEquals(Array.isArray(result), true, "Portfolio items should be array");
  },
});
