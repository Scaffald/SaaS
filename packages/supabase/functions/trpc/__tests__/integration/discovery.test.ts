import {
  assertEquals,
  assertExists,
} from "jsr:@std/assert";

import { callTRPCEndpoint, loadCachedTokens } from "../setup.ts";
import { ensurePublicWorker } from "./seed-utils.ts";

Deno.test({
  name: "Workers router - getWorkers returns list",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await ensurePublicWorker();

    const response = await callTRPCEndpoint("workers.getWorkers", { limit: 5 });

    assertEquals(Array.isArray(response), true);
    const result = response[0]?.result?.data;
    assertExists(
      result,
      `Workers response should include data. Received: ${JSON.stringify(response, null, 2)}`,
    );
    assertEquals(Array.isArray(result.workers), true);
    assertEquals(typeof result.total, "number");
  },
});

Deno.test({
  name: "Employers router - employment status requires auth",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "employers.getOrganizationEmploymentStatus",
      { organizationId: "00000000-0000-0000-0000-000000000000" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED response for anonymous call");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Map router - getLocationCounts returns numeric totals",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("map.getLocationCounts", {
      city: "Test City",
      state: "TS",
      bounds: {
        north: 38.0,
        south: 37.0,
        east: -121.0,
        west: -123.0,
      },
    });

    const result = response[0]?.result?.data;
    assertExists(result, "Map counts response should include data");
    assertEquals(typeof result.workers, "number");
    assertEquals(typeof result.jobs, "number");
    assertEquals(typeof result.employers, "number");
  },
});

Deno.test({
  name: "Map router - findNearestResults handles empty datasets",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("map.findNearestResults", {
      coordinates: {
        lat: 37.7749,
        lng: -122.4194,
      },
      radius: 25,
    });

    // Endpoint may return null when no nearby results are found
    assertEquals(Array.isArray(response), true);
    const payload = response[0]?.result?.data;
    if (payload !== null) {
      assertExists(payload.location);
      assertExists(payload.counts);
    }
  },
});
