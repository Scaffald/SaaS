/**
 * Map router baseline coverage.
 */

import { assertEquals, assertExists } from '../shared/assert.ts';

import { callTRPCEndpoint } from '../shared/setup.ts';

const SAMPLE_BOUNDS = {
  north: 37.9,
  south: 37.6,
  east: -122.2,
  west: -122.6,
};

Deno.test({
  name: "Map router - getLocationCounts returns numeric counts",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("map.getLocationCounts", {
      city: "San Francisco",
      state: "CA",
      bounds: SAMPLE_BOUNDS,
    });

    const data = response[0]?.result?.data;
    assertExists(data, "Expected response payload");
    assertEquals(typeof data.workers, "number");
    assertEquals(typeof data.jobs, "number");
    assertEquals(typeof data.employers, "number");
  },
});
