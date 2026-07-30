/**
 * Profile router baseline coverage.
 */

import { assertEquals, assertExists } from '../shared/assert.ts';

import { loadCachedTokens } from '../shared/setup.ts';
import { requireAuthSetup } from '../shared/test-context.ts';

const PROFILE_ENDPOINT = 'http://127.0.0.1:54321/functions/v1/trpc/profile.updateGeneral?batch=1';

Deno.test({
  name: "Profile router - updateGeneral allows address updates",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Cached tokens should exist");
    assertExists(tokens.regular.token, "Regular auth token should exist");

    const testAddress = {
      street: "123 Test St",
      city: "Test City",
      state: "TS",
      zip: "12345",
      country: "US",
      latitude: 40.7128,
      longitude: -74.006,
    };

    const response = await fetch(PROFILE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokens.regular.token}`,
      },
      body: JSON.stringify({
        0: {
          first_name: "Test",
          last_name: "User",
          address: testAddress,
        },
      }),
    });

    assertEquals(response.ok, true, `Update should succeed (status ${response.status})`);

    const payload = await response.json() as Array<
      { error?: unknown; result?: { data?: { success?: boolean } } }
    >;
    const error = payload[0]?.error;
    assertEquals(error, undefined, `Unexpected error response: ${JSON.stringify(error)}`);

    const data = payload[0]?.result?.data;
    assertExists(data, "Result payload should contain data");
    assertEquals(data.success, true, "Profile update should succeed");
  },
});
