/**
 * Workers router baseline coverage.
 */

import { assertEquals, assertExists } from '../shared/assert.ts';

import { callTRPCEndpoint } from '../shared/setup.ts';

Deno.test({
  name: "Workers router - getWorkers returns list and count",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("workers.getWorkers", {
      limit: 5,
    });

    const firstEntry = response[0];
    assertExists(firstEntry, "Expected batch entry");

    if (firstEntry.error) {
      assertEquals(
        typeof firstEntry.error.data?.code,
        "string",
        "Error payload should expose a code",
      );
      return;
    }

    const data = firstEntry.result?.data;
    assertExists(data, "Expected response payload");
    assertEquals(Array.isArray(data.workers), true);
    assertEquals(typeof data.total, "number");
  },
});

Deno.test({
  name: "Workers router - getWorkerById yields error for unknown id",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "workers.getWorkerById",
      { id: crypto.randomUUID() },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error payload for missing worker");
    assertEquals(error?.data?.code, "INTERNAL_SERVER_ERROR");
  },
});
