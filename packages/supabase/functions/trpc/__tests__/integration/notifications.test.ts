import {
  assertEquals,
  assertExists,
} from 'jsr:@std/assert';

import { callTRPCEndpoint, getUserIdFromToken, loadCachedTokens } from '../setup';

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
    assertExists(error, "Expected UNAUTHORIZED error when no token provided");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Notifications router - list and unread count succeed",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const tokens = await loadCachedTokens();
    if (!tokens) {
      throw new Error("No cached auth tokens available. Run auth.test.ts first.");
    }

    const listResponse = await callTRPCEndpoint(
      "notifications.list",
      { status: "all", limit: 5 },
      {
        authToken: tokens.regular.token,
      },
    );

    const listResult = listResponse[0]?.result?.data;
    assertExists(listResult, "Notifications list should return data");
    assertEquals(Array.isArray(listResult.items), true);
    assertEquals(typeof listResult.nextCursor === "string" || listResult.nextCursor === null, true);

    const countResponse = await callTRPCEndpoint(
      "notifications.getUnreadCount",
      undefined,
      {
        authToken: tokens.regular.token,
      },
    );

    const countResult = countResponse[0]?.result?.data;
    assertExists(countResult, "Unread count should return data");
    assertEquals(typeof countResult.count, "number");
  },
});

Deno.test({
  name: "Notifications router - list returns only rows for authenticated user (RLS regression)",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const tokens = await loadCachedTokens();
    if (!tokens) {
      throw new Error("No cached auth tokens available. Run auth.test.ts first.");
    }

    const userId = await getUserIdFromToken(tokens.regular.token);
    assertExists(userId, "Should resolve user ID from token");

    const listResponse = await callTRPCEndpoint(
      "notifications.list",
      { status: "all", limit: 100 },
      { authToken: tokens.regular.token },
    );

    const listResult = listResponse[0]?.result?.data;
    assertExists(listResult, "Notifications list should return data");
    assertExists(listResult.items, "Items should be present");

    for (const item of listResult.items) {
      assertEquals(
        item.user_id,
        userId,
        `Every notification must belong to the authenticated user (RLS). Got user_id ${item.user_id} for notification ${item.id}`,
      );
    }
  },
});
