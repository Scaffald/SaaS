/**
 * Office router baseline coverage.
 */

import { assertEquals, assertExists } from '../shared/assert';

import { callTRPCEndpoint, loadCachedTokens } from '../shared/setup';
import { requireAuthSetup } from '../shared/test-context';

Deno.test({
  name: "Office router - listUsers restricts access to admins",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Cached tokens should be available");

    if (tokens.admin.token !== tokens.regular.token) {
      const adminResponse = await callTRPCEndpoint(
        "office.listUsers",
        undefined,
        {
          authToken: tokens.admin.token,
        },
      );

      const adminData = adminResponse[0]?.result?.data;
      assertExists(adminData, "Admin request should return data");
      assertEquals(
        Array.isArray(adminData.users),
        true,
        "Admin payload should include users array",
      );
    }

    const userResponse = await callTRPCEndpoint(
      "office.listUsers",
      undefined,
      {
        authToken: tokens.regular.token,
      },
    );

    const error = userResponse[0]?.error;
    assertExists(error, "Regular user should receive an error payload");
    assertEquals(error?.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Office router - storage analytics limited to admins",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Cached tokens should be available");

    if (tokens.admin.token !== tokens.regular.token) {
      const adminResponse = await callTRPCEndpoint(
        "office.storage.analytics",
        undefined,
        { authToken: tokens.admin.token },
      );

      const analytics = adminResponse[0]?.result?.data;
      assertExists(analytics, "Admin analytics payload should exist");
      assertExists(analytics.totals, "Totals summary should be returned");
      assertEquals(
        typeof analytics.totals.totalBytes === "number",
        true,
        "Totals should include numeric values",
      );
      assertEquals(
        Array.isArray(analytics.topUsers),
        true,
        "Analytics response should include topUsers array",
      );
    }

    const userResponse = await callTRPCEndpoint(
      "office.storage.analytics",
      undefined,
      { authToken: tokens.regular.token },
    );

    const error = userResponse[0]?.error;
    assertExists(error, "Non-admin request should return an error");
    assertEquals(error?.data?.code, "FORBIDDEN");
  },
});
