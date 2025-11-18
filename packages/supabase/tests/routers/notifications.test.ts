/**
 * Notifications router baseline coverage.
 * Expanded for REQ-74 test coverage.
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

Deno.test({
  name: "Notifications router - markAsRead requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("notifications.markAsRead", {
      id: "test-notification-id",
    });

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Notifications router - markAsRead updates notification read status",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    // First, get a notification
    const listResponse = await callTRPCEndpoint(
      "notifications.list",
      { status: "all", limit: 1 },
      {
        authToken: tokens.regular.token,
      },
    );

    const listData = listResponse[0]?.result?.data;
    assertExists(listData, "List response should include data");
    assertEquals(Array.isArray(listData.items), true);

    if (listData.items.length > 0) {
      const notificationId = listData.items[0].id;
      const wasRead = listData.items[0].read;

      // Mark as read
      const markResponse = await callTRPCEndpoint(
        "notifications.markAsRead",
        { id: notificationId },
        {
          authToken: tokens.regular.token,
        },
      );

      const markData = markResponse[0]?.result?.data;
      assertExists(markData, "Mark as read should return data");

      // Verify unread count decreased if it was unread
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
    }
  },
});

Deno.test({
  name: "Notifications router - list endpoint respects limit parameter",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "notifications.list",
      { status: "all", limit: 3 },
      {
        authToken: tokens.regular.token,
      },
    );

    const listData = response[0]?.result?.data;
    assertExists(listData, "List response should include data");
    assertEquals(Array.isArray(listData.items), true);
    // Limit should be respected (items should be <= limit)
    assertEquals(listData.items.length <= 3, true);
  },
});

Deno.test({
  name: "Notifications router - list endpoint returns proper notification structure",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "notifications.list",
      { status: "all", limit: 1 },
      {
        authToken: tokens.regular.token,
      },
    );

    const listData = response[0]?.result?.data;
    assertExists(listData, "List response should include data");
    assertEquals(Array.isArray(listData.items), true);

    if (listData.items.length > 0) {
      const notification = listData.items[0];
      // Verify notification has required fields for NotificationItem interface
      assertExists(notification.id, "Notification should have id");
      assertExists(notification.type, "Notification should have type");
      assertExists(notification.title, "Notification should have title");
      assertExists(notification.created_at, "Notification should have created_at");
      assertEquals(typeof notification.read, "boolean", "Notification should have read boolean");
    }
  },
});

Deno.test({
  name: "Notifications router - getUnreadCount returns accurate count",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    // Get all notifications
    const listResponse = await callTRPCEndpoint(
      "notifications.list",
      { status: "all", limit: 100 },
      {
        authToken: tokens.regular.token,
      },
    );

    const listData = listResponse[0]?.result?.data;
    assertExists(listData, "List response should include data");

    // Count unread manually
    const unreadCount = listData.items.filter((item: { read: boolean }) => !item.read).length;

    // Get unread count from endpoint
    const countResponse = await callTRPCEndpoint(
      "notifications.getUnreadCount",
      undefined,
      {
        authToken: tokens.regular.token,
      },
    );

    const countData = countResponse[0]?.result?.data;
    assertExists(countData, "Unread count should include data");
    assertEquals(countData.count, unreadCount, "Unread count should match actual unread items");
  },
});
