import {
  assertEquals,
  assertExists,
} from "jsr:@std/assert";

import { callTRPCEndpoint, loadCachedTokens } from "../setup.ts";

Deno.test({
  name: "Office router - listUsers requires admin token",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const tokens = await loadCachedTokens();
    if (!tokens) {
      throw new Error("No cached auth tokens available. Run auth.test.ts first.");
    }

    const adminResponse = await callTRPCEndpoint("office.listUsers", undefined, {
      authToken: tokens.admin.token,
    });

    const adminResult = adminResponse[0]?.result?.data;
    assertExists(adminResult, "Admin request should return data");
    assertEquals(Array.isArray(adminResult.users), true);

    const regularResponse = await callTRPCEndpoint("office.listUsers", undefined, {
      authToken: tokens.regular.token,
    });

    const error = regularResponse[0]?.error;
    assertExists(error, "Regular user should receive an error response");
    assertEquals(error?.data?.code, "FORBIDDEN");
  },
});
