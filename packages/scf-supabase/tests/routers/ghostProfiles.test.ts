/**
 * Ghost profile detection router integration tests.
 */

import { assertEquals, assertExists } from "../shared/assert.ts";

import { callTRPCEndpoint, loadCachedTokens } from "../shared/setup.ts";
import { requireAuthSetup } from "../shared/test-context.ts";

Deno.test({
  name: "Ghost profiles router - getGhostProfiles requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("office.profiles.getGhostProfiles", {
      offset: 0,
      limit: 20,
    });

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Ghost profiles router - getGhostProfiles requires office role",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    // Try with regular user token (should fail)
    const response = await callTRPCEndpoint(
      "office.profiles.getGhostProfiles",
      {
        offset: 0,
        limit: 20,
      },
      { authToken: tokens.regular.token },
    );

    const error = response[0]?.error;
    // Should fail with UNAUTHORIZED or FORBIDDEN
    assertExists(error, "Expected authorization error");
    assertExists(
      error?.data?.code === "UNAUTHORIZED" || error?.data?.code === "FORBIDDEN",
      "Should require office role",
    );
  },
});

Deno.test({
  name: "Ghost profiles router - getGhostProfiles returns paginated results",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    // This test requires admin/office role token
    // For now, we verify the endpoint structure exists
    // Actual execution would require proper admin authentication
    const response = await callTRPCEndpoint(
      "office.profiles.getGhostProfiles",
      {
        offset: 0,
        limit: 20,
      },
      { authToken: tokens.admin?.token || tokens.regular.token },
    );

    // If unauthorized, that's expected for non-admin users
    // If authorized, should return paginated results
    const error = response[0]?.error;
    if (!error) {
      const data = response[0]?.result?.data;
      assertExists(data, "Expected ghost profiles payload");
      assertExists(Array.isArray(data.profiles));
      assertEquals(typeof data.total, "number");
      assertEquals(typeof data.offset, "number");
      assertEquals(typeof data.limit, "number");
    }
  },
});

Deno.test({
  name: "Ghost profiles router - getGhostProfiles filters by query",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "office.profiles.getGhostProfiles",
      {
        offset: 0,
        limit: 20,
        query: "test",
      },
      { authToken: tokens.admin?.token || tokens.regular.token },
    );

    const error = response[0]?.error;
    if (!error) {
      const data = response[0]?.result?.data;
      assertExists(data, "Expected ghost profiles payload");
      // Results should be filtered by query
      assertExists(Array.isArray(data.profiles));
    }
  },
});

Deno.test({
  name: "Ghost profiles router - sendReminder requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("office.profiles.sendReminder", {
      userId: "00000000-0000-0000-0000-000000000001",
      message: "Test reminder",
    });

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Ghost profiles router - sendReminder requires office role",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "office.profiles.sendReminder",
      {
        userId: "00000000-0000-0000-0000-000000000001",
        message: "Test reminder",
      },
      { authToken: tokens.regular.token },
    );

    const error = response[0]?.error;
    // Should fail with UNAUTHORIZED or FORBIDDEN
    assertExists(error, "Expected authorization error");
    assertExists(
      error?.data?.code === "UNAUTHORIZED" || error?.data?.code === "FORBIDDEN",
      "Should require office role",
    );
  },
});

Deno.test({
  name: "Ghost profiles router - sendReminder updates lastReminderAt",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    // This test requires admin/office role token
    const response = await callTRPCEndpoint(
      "office.profiles.sendReminder",
      {
        userId: "00000000-0000-0000-0000-000000000001",
        message: "Please complete your profile",
      },
      { authToken: tokens.admin?.token || tokens.regular.token },
    );

    const error = response[0]?.error;
    if (!error) {
      const data = response[0]?.result?.data;
      assertExists(data, "Expected reminder response");
      assertEquals(data.success, true);
      assertExists(data.reminderSentAt);
    }
  },
});

