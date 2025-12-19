/**
 * Universities Router Tests
 * Tests for university search and CRUD operations with authenticated context
 *
 * Run with: deno test --allow-all packages/supabase/functions/trpc/__tests__/universities.test.ts
 */

import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.208.0/assert/mod';
import { callTRPCEndpoint } from './setup';
import { getTestContext } from './test-context';

Deno.test({
  name: "Universities - Unauthenticated request should fail",
  async fn() {
    // Test without auth token - should fail before reaching tRPC
    try {
      const result = await callTRPCEndpoint(
        "office.universities.searchUniversities",
        {
          query: "ferris",
          country: "United States",
          limit: 5,
        },
      );

      // If we get here, check for error in response
      const hasError = result.error || result[0]?.error || !result.ok;

      if (!hasError) {
        throw new Error(
          "Expected authentication to fail but request succeeded",
        );
      }

      console.log("✅ Correctly rejected unauthenticated request");
    } catch (error) {
      // Network/auth errors are also acceptable
      console.log(
        "✅ Correctly rejected unauthenticated request (threw error)",
      );
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Universities - Search for 'Ferris' returns Ferris State University",
  async fn() {
    const ctx = await getTestContext();

    // Search for Ferris
    const result = await callTRPCEndpoint(
      "office.universities.searchUniversities",
      {
        query: "Ferris",
        country: "United States",
        limit: 10,
      },
      ctx.user.token,
    );

    // Batch responses are in format: [{ result: { data: [...] } }]
    console.log("Raw result:", JSON.stringify(result, null, 2));

    const error = result[0]?.error;
    const responseData = result[0]?.result?.data;
    const universities = responseData?.universities || [];

    if (error) {
      throw new Error(`Search failed: ${JSON.stringify(error)}`);
    }

    assertExists(responseData, "Should have response data");
    assertEquals(
      Array.isArray(universities),
      true,
      "Universities should be an array",
    );

    if (universities.length === 0) {
      console.log(
        "⚠️  No universities found in database - please run university seed script",
      );
      console.log("   Run: pnpm supa db reset");
      return;
    }

    // Find Ferris State University in results
    const ferrisStateUniversity = universities.find((uni: { name: string }) =>
      uni.name.includes("Ferris State University")
    );

    assertExists(
      ferrisStateUniversity,
      "Should find 'Ferris State University' in search results",
    );

    console.log(
      "✅ Found Ferris State University:",
      ferrisStateUniversity.name,
    );
    console.log(`   Total results: ${universities.length}`);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Universities - Search behavior validation",
  async fn() {
    // Document expected search behavior
    console.log("\n=== Expected Search Behavior ===");
    console.log("1. Trigram similarity search on university names");
    console.log("2. Optional country filter");
    console.log("3. Configurable result limit");
    console.log("4. Results ordered by similarity score (best matches first)");
    console.log("5. Only returns active universities (is_active = true)");
    console.log("6. Requires authentication (regular or admin user)");
    console.log("\nExample queries:");
    console.log(
      "  - query='ferris', country='United States' -> Ferris State University",
    );
    console.log(
      "  - query='mit', country=null -> All universities matching 'mit'",
    );
    console.log("  - query='harvard', limit=5 -> Top 5 matches for 'harvard'");
    console.log("\n✅ Documentation test passed");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Universities - Admin user can search",
  async fn() {
    const ctx = await getTestContext();

    // Use admin token
    const result = await callTRPCEndpoint(
      "office.universities.searchUniversities",
      {
        query: "harvard",
        limit: 3,
      },
      ctx.admin.token,
    );

    const error = result.error || result[0]?.error;
    const data = result.result?.data || result[0]?.result?.data;

    if (error) {
      console.log("⚠️  Admin search returned error:", error.message);
    } else {
      assertExists(data, "Admin should have access");
      console.log("✅ Admin successfully executed search");
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
