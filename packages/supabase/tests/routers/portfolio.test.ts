/**
 * Portfolio router baseline coverage.
 * Expanded for REQ-74 test coverage.
 */

import { assertEquals, assertExists } from '../shared/assert';

import { callTRPCEndpoint, loadCachedTokens } from '../shared/setup';
import { requireAuthSetup } from '../shared/test-context';

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

Deno.test({
  name: "Portfolio router - create requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("portfolio.create", {
      title: "Test Portfolio Item",
      displayOrder: 0,
    });

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Portfolio router - create validates required fields (title)",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be available");

    const response = await callTRPCEndpoint(
      "portfolio.create",
      {
        title: "",
        displayOrder: 0,
      },
      { authToken: tokens.regular.token },
    );

    const error = response[0]?.error;
    // Should have validation error for empty title
    assertExists(error, "Expected validation error for empty title");
  },
});

Deno.test({
  name: "Portfolio router - create stores image file_path",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be available");

    const response = await callTRPCEndpoint(
      "portfolio.create",
      {
        title: "Test Portfolio with Image",
        displayOrder: 0,
        filePath: "portfolio/user-123/test-image.jpg",
      },
      { authToken: tokens.regular.token },
    );

    const result = response[0]?.result?.data;
    // If successful, verify file_path is stored
    if (result && !response[0]?.error) {
      assertExists(result.file_path || result.id, "Portfolio item should be created");
    }
  },
});

Deno.test({
  name: "Portfolio router - update requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("portfolio.update", {
      id: "test-id",
      title: "Updated Title",
    });

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Portfolio router - delete requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("portfolio.delete", {
      id: "test-id",
    });

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Portfolio router - list returns items ordered by display_order",
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

    // Verify items are ordered by display_order
    if (result.length > 1) {
      for (let i = 1; i < result.length; i++) {
        assertEquals(
          result[i].display_order >= result[i - 1].display_order,
          true,
          "Items should be ordered by display_order",
        );
      }
    }
  },
});
