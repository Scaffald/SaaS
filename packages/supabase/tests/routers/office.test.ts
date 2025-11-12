/**
 * Office router baseline coverage.
 */

import { assertEquals, assertExists } from "../shared/assert.ts";

import { callTRPCEndpoint, loadCachedTokens } from "../shared/setup.ts";
import { requireAuthSetup } from "../shared/test-context.ts";

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
