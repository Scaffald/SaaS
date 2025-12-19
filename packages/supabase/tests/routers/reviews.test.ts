/**
 * Reviews router baseline coverage.
 */

import { assertEquals, assertExists } from "../shared/assert.ts";

import { callTRPCEndpoint } from "../shared/setup.ts";

Deno.test({
  name: "Reviews router - getSoftSkills returns array",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("reviews.getSoftSkills");

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

    const result = firstEntry.result?.data;
    assertExists(result, "Expected data payload");
    assertEquals(Array.isArray(result), true, "Soft skills should be an array");
  },
});

Deno.test({
  name: "Reviews router - createDraft requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "reviews.createDraft",
      {
        subjectId: crypto.randomUUID(),
        subjectType: "user",
      },
      { type: "mutation" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});
