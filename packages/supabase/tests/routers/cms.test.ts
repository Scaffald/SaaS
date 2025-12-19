/**
 * CMS router baseline coverage.
 */

import { assertEquals, assertExists } from "../shared/assert.ts";

import { callTRPCEndpoint, loadCachedTokens } from "../shared/setup.ts";
import { requireAuthSetup } from "../shared/test-context.ts";

Deno.test({
  name: "CMS router - getActiveWelcomeSlides returns slides array",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("cms.getActiveWelcomeSlides");

    const data = response[0]?.result?.data;
    assertExists(data, "Response should include data");
    assertEquals(Array.isArray(data.slides), true);
  },
});

Deno.test({
  name: "CMS router - getWelcomeSlide requires office authorization",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "cms.getWelcomeSlide",
      { id: crypto.randomUUID() },
      { authToken: tokens.regular.token },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected FORBIDDEN response for non-admin");
    assertEquals(error?.data?.code, "FORBIDDEN");
  },
});
