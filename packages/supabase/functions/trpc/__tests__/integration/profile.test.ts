/**
 * Profile Integration Tests
 * Tests profile update operations including the users table permissions fix (migration 012)
 *
 * Run with: deno test --allow-all packages/supabase/functions/trpc/__tests__/integration/profile.test.ts
 */

import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { loadCachedTokens } from '../setup.ts';

Deno.test({
  name: "Profile - Update with address (tests users table upsert)",
  async fn() {
    const tokens = await loadCachedTokens();
    assertExists(tokens?.regular.token);

    const testAddress = {
      street: "123 Test St",
      city: "Test City",
      state: "TS",
      zip: "12345",
      country: "US",
      latitude: 40.7128,
      longitude: -74.006,
    };

    const response = await fetch(
      "http://127.0.0.1:54321/functions/v1/trpc/profile.updateGeneral?batch=1",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.regular.token}`,
        },
        body: JSON.stringify({
          "0": {
            first_name: "Test",
            last_name: "User",
            address: testAddress,
          },
        }),
      },
    );

    assertEquals(
      response.ok,
      true,
      `Address update should succeed. Status: ${response.status}`,
    );

    const result = await response.json();
    assertEquals(
      result[0].error,
      undefined,
      `Should not have permission errors. Got: ${
        JSON.stringify(
          result[0]?.error,
        )
      }`,
    );

    assertExists(result[0].result?.data);
    assertEquals(result[0].result.data.success, true);

    console.log(
      "✅ Address update successful (users table INSERT/UPDATE permissions working)",
    );
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
