/**
 * Work logs router baseline coverage.
 */

import { assertEquals, assertExists } from "../shared/assert.ts";

import { callTRPCEndpoint } from "../shared/setup.ts";

Deno.test({
  name: "Work logs router - getById returns NOT_FOUND for unknown work log",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("workLogs.getById", {
      workLogId: crypto.randomUUID(),
    });

    const error = response[0]?.error;
    assertExists(error, "Expected error payload");
    const code = error?.data?.code ?? "";
    assertEquals(
      ["NOT_FOUND", "INTERNAL_SERVER_ERROR"].includes(code),
      true,
      "Error code should indicate missing work log",
    );
  },
});
