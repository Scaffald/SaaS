/**
 * Notifications router baseline coverage.
 */

import { assertEquals, assertExists } from "../shared/assert.ts";

import { callTRPCEndpoint, loadCachedTokens } from "../shared/setup.ts";
import { requireAuthSetup } from "../shared/test-context.ts";

Deno.test({
  name: "Notifications router - list requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "notifications.list",
      { status: "all", limit: 5 },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Notifications router - list and unread count succeed for user",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const listResponse = await callTRPCEndpoint(
      "notifications.list",
      { status: "all", limit: 5 },
      {
        authToken: tokens.regular.token,
      },
    );

    const listData = listResponse[0]?.result?.data;
    assertExists(listData, "List response should include data");
    assertEquals(Array.isArray(listData.items), true);

    const countResponse = await callTRPCEndpoint(
      "notifications.getUnreadCount",
      undefined,
      {
        authToken: tokens.regular.token,
      },
    );

    const countData = countResponse[0]?.result?.data;
    assertExists(countData, "Unread count should include data");
    assertEquals(typeof countData.count, "number");
  },
});
