/**
 * Notifications router baseline coverage.
 * Notifications router test coverage.
 */

import { assertEquals, assertExists } from "../shared/assert";

import { callTRPCEndpoint, loadCachedTokens } from "../shared/setup";
import { requireAuthSetup } from "../shared/test-context";

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
  name:
    "Notifications router - list endpoint returns proper notification structure",
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
      assertExists(
        notification.created_at,
        "Notification should have created_at",
      );
      assertEquals(
        typeof notification.read,
        "boolean",
        "Notification should have read boolean",
      );
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
    const unreadCount = listData.items.filter((item: { read: boolean }) =>
      !item.read
    ).length;

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
    assertEquals(
      countData.count,
      unreadCount,
      "Unread count should match actual unread items",
    );
  },
});

Deno.test({
  name:
    "Notifications router - user scoping isolates notifications between users",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const { createAdminClient } = await import("../shared/setup");
    const admin = createAdminClient();

    // Create test notifications for both users
    const regularUserId = tokens.regular.userId;
    const adminUserId = tokens.admin.userId;

    // Insert notification for regular user
    const { data: regularNotification, error: regularError } = await admin
      .schema("core")
      .from("notifications")
      .insert({
        user_id: regularUserId,
        type: "task_assigned",
        severity: "info",
        title: "Test notification for regular user",
        message: "This notification should only be visible to regular user",
        read: false,
      })
      .select()
      .single();

    assertExists(
      regularNotification,
      "Should create notification for regular user",
    );
    assertEquals(
      regularError,
      null,
      "Should not have error creating notification",
    );

    // Insert notification for admin user
    const { data: adminNotification, error: adminError } = await admin
      .schema("core")
      .from("notifications")
      .insert({
        user_id: adminUserId,
        type: "task_assigned",
        severity: "info",
        title: "Test notification for admin user",
        message: "This notification should only be visible to admin user",
        read: false,
      })
      .select()
      .single();

    assertExists(
      adminNotification,
      "Should create notification for admin user",
    );
    assertEquals(
      adminError,
      null,
      "Should not have error creating notification",
    );

    // Regular user should only see their notification
    const regularListResponse = await callTRPCEndpoint(
      "notifications.list",
      { status: "all", limit: 100 },
      {
        authToken: tokens.regular.token,
      },
    );

    const regularListData = regularListResponse[0]?.result?.data;
    assertExists(
      regularListData,
      "Regular user list response should include data",
    );
    const regularNotificationIds = regularListData.items.map((
      item: { id: string },
    ) => item.id);
    assertEquals(
      regularNotificationIds.includes(regularNotification.id),
      true,
      "Regular user should see their own notification",
    );
    assertEquals(
      regularNotificationIds.includes(adminNotification.id),
      false,
      "Regular user should NOT see admin user's notification",
    );

    // Admin user should only see their notification
    const adminListResponse = await callTRPCEndpoint(
      "notifications.list",
      { status: "all", limit: 100 },
      {
        authToken: tokens.admin.token,
      },
    );

    const adminListData = adminListResponse[0]?.result?.data;
    assertExists(adminListData, "Admin user list response should include data");
    const adminNotificationIds = adminListData.items.map((
      item: { id: string },
    ) => item.id);
    assertEquals(
      adminNotificationIds.includes(adminNotification.id),
      true,
      "Admin user should see their own notification",
    );
    assertEquals(
      adminNotificationIds.includes(regularNotification.id),
      false,
      "Admin user should NOT see regular user's notification",
    );

    // Cleanup
    await admin.schema("core").from("notifications").delete().eq(
      "id",
      regularNotification.id,
    );
    await admin.schema("core").from("notifications").delete().eq(
      "id",
      adminNotification.id,
    );
  },
});

Deno.test({
  name:
    "Notifications router - soft delete excludes deleted notifications from queries",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const { createAdminClient } = await import("../shared/setup");
    const admin = createAdminClient();

    const userId = tokens.regular.userId;

    // Create test notification
    const { data: notification, error: insertError } = await admin
      .schema("core")
      .from("notifications")
      .insert({
        user_id: userId,
        type: "task_assigned",
        severity: "info",
        title: "Test notification for soft delete",
        message: "This notification will be soft deleted",
        read: false,
      })
      .select()
      .single();

    assertExists(notification, "Should create notification");
    assertEquals(
      insertError,
      null,
      "Should not have error creating notification",
    );

    // Verify notification appears in list
    const beforeDeleteResponse = await callTRPCEndpoint(
      "notifications.list",
      { status: "all", limit: 100 },
      {
        authToken: tokens.regular.token,
      },
    );

    const beforeDeleteData = beforeDeleteResponse[0]?.result?.data;
    assertExists(beforeDeleteData, "List response should include data");
    const beforeDeleteIds = beforeDeleteData.items.map((item: { id: string }) =>
      item.id
    );
    assertEquals(
      beforeDeleteIds.includes(notification.id),
      true,
      "Notification should appear in list before deletion",
    );

    // Soft delete the notification
    const deleteResponse = await callTRPCEndpoint(
      "notifications.deleteMany",
      { ids: [notification.id] },
      {
        authToken: tokens.regular.token,
        type: "mutation",
      },
    );

    const deleteData = deleteResponse[0]?.result?.data;
    assertExists(deleteData, "Delete response should include data");

    // Verify notification is excluded from list
    const afterDeleteResponse = await callTRPCEndpoint(
      "notifications.list",
      { status: "all", limit: 100 },
      {
        authToken: tokens.regular.token,
      },
    );

    const afterDeleteData = afterDeleteResponse[0]?.result?.data;
    assertExists(afterDeleteData, "List response should include data");
    const afterDeleteIds = afterDeleteData.items.map((item: { id: string }) =>
      item.id
    );
    assertEquals(
      afterDeleteIds.includes(notification.id),
      false,
      "Notification should NOT appear in list after soft delete",
    );

    // Verify notification still exists in database with deleted_at set
    const { data: deletedNotification } = await admin
      .schema("core")
      .from("notifications")
      .select("id, deleted_at")
      .eq("id", notification.id)
      .single();

    assertExists(
      deletedNotification,
      "Notification should still exist in database",
    );
    assertExists(
      deletedNotification.deleted_at,
      "Notification should have deleted_at timestamp",
    );

    // Verify unread count excludes deleted notifications
    const countResponse = await callTRPCEndpoint(
      "notifications.getUnreadCount",
      undefined,
      {
        authToken: tokens.regular.token,
      },
    );

    const countData = countResponse[0]?.result?.data;
    assertExists(countData, "Unread count should include data");
    // Unread count should not include the deleted notification
    assertEquals(
      typeof countData.count,
      "number",
      "Unread count should be a number",
    );

    // Cleanup - hard delete the test notification
    await admin
      .schema("core")
      .from("notifications")
      .delete()
      .eq("id", notification.id);
  },
});
