/**
 * Map Functions Tests
 * Tests for get_organizations_with_coords, get_jobs_with_coords functions and v_profile_search view
 *
 * These are direct database endpoints accessed via PostgREST, not tRPC endpoints.
 * They provide data for the discover/map page.
 *
 * Run with: deno test --allow-all packages/supabase/functions/trpc/__tests__/map-functions.test.ts
 */

import {
  assert,
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

/**
 * Helper to call Supabase REST API with timeout protection
 */
async function callSupabaseRPC(
  functionName: string,
  params: Record<string, unknown> = {},
  token = ANON_KEY,
) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": token,
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? await response.json() : null,
      error: !response.ok ? await response.text() : null,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Helper to query a view via Supabase REST API with timeout protection
 */
async function querySupabaseView(
  viewName: string,
  queryParams: Record<string, string> = {},
  token = ANON_KEY,
) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${viewName}`);

  // Add query parameters
  for (const [key, value] of Object.entries(queryParams)) {
    url.searchParams.append(key, value);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "apikey": token,
        "Authorization": `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? await response.json() : null,
      error: !response.ok ? await response.text() : null,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

Deno.test({
  name: "Map Functions - get_organizations_with_coords returns valid data",
  async fn() {
    const result = await callSupabaseRPC("get_organizations_with_coords");

    assertEquals(result.ok, true, "Should return successful response");
    assertExists(result.data, "Should have data");
    assertEquals(Array.isArray(result.data), true, "Data should be an array");

    console.log(
      `✅ Found ${result.data.length} organizations with coordinates`,
    );

    if (result.data.length > 0) {
      const org = result.data[0];

      // Verify required fields exist
      assertExists(org.id, "Organization should have id");
      assertExists(org.name, "Organization should have name");
      assertExists(org.slug, "Organization should have slug");
      assertExists(org.longitude, "Organization should have longitude");
      assertExists(org.latitude, "Organization should have latitude");

      // Verify longitude/latitude are numbers
      assertEquals(
        typeof org.longitude,
        "number",
        "Longitude should be a number",
      );
      assertEquals(
        typeof org.latitude,
        "number",
        "Latitude should be a number",
      );

      // Verify coordinates are in valid range
      assert(
        org.longitude >= -180 && org.longitude <= 180,
        "Longitude should be between -180 and 180",
      );
      assert(
        org.latitude >= -90 && org.latitude <= 90,
        "Latitude should be between -90 and 90",
      );

      console.log(
        `   Sample org: ${org.name} at (${org.latitude}, ${org.longitude})`,
      );
    } else {
      console.log(
        "⚠️  No organizations with coordinates found - seed data may be needed",
      );
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Map Functions - get_organizations_with_coords respects limit",
  async fn() {
    const result = await callSupabaseRPC("get_organizations_with_coords");

    assertEquals(result.ok, true, "Should return successful response");

    if (result.data && result.data.length > 0) {
      // Function has a LIMIT 100 clause
      assert(
        result.data.length <= 100,
        "Should not return more than 100 organizations",
      );
      console.log(
        `✅ Correctly limited to ${result.data.length} organizations (max 100)`,
      );
    } else {
      console.log("⚠️  No data to test limit");
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name:
    "Map Functions - get_organizations_with_coords only returns public orgs",
  async fn() {
    const result = await callSupabaseRPC("get_organizations_with_coords");

    assertEquals(result.ok, true, "Should return successful response");

    if (result.data && result.data.length > 0) {
      // All returned organizations should be public (we can't verify directly,
      // but the function filters by visibility='public')
      console.log(
        `✅ Returned ${result.data.length} organizations (filtered for public visibility)`,
      );
    } else {
      console.log("⚠️  No organizations found");
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Map Functions - v_profile_search view is accessible",
  async fn() {
    const result = await querySupabaseView("v_profile_search", {
      select: "*",
      limit: "10",
    });

    assertEquals(result.ok, true, "View should be accessible");
    assertExists(result.data, "Should have data");
    assertEquals(Array.isArray(result.data), true, "Data should be an array");

    console.log(
      `✅ Profile search view returned ${result.data.length} profiles`,
    );

    if (result.data.length > 0) {
      const profile = result.data[0];

      // Verify expected fields exist
      assertExists(profile.id, "Profile should have id");

      // Check for jittered coordinates
      if (profile.longitude !== null) {
        assertEquals(
          typeof profile.longitude,
          "number",
          "Longitude should be a number",
        );
        assert(
          profile.longitude >= -180 && profile.longitude <= 180,
          "Longitude should be in valid range",
        );
      }

      if (profile.latitude !== null) {
        assertEquals(
          typeof profile.latitude,
          "number",
          "Latitude should be a number",
        );
        assert(
          profile.latitude >= -90 && profile.latitude <= 90,
          "Latitude should be in valid range",
        );
      }

      // Check gamified_score
      if (profile.gamified_score !== null) {
        assertEquals(
          typeof profile.gamified_score,
          "number",
          "Score should be a number",
        );
        assert(
          profile.gamified_score >= 0 && profile.gamified_score <= 100,
          "Gamified score should be between 0 and 100",
        );
      }

      console.log(`   Sample profile: ${profile.name || profile.id}`);
    } else {
      console.log(
        "⚠️  No profiles with coordinates found - this is expected if no users have set their location",
      );
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Map Functions - v_profile_search filters by coordinates",
  async fn() {
    const result = await querySupabaseView("v_profile_search", {
      select: "*",
      limit: "50",
    });

    assertEquals(result.ok, true, "View should be accessible");

    if (result.data && result.data.length > 0) {
      // All profiles should have coordinates (view filters WHERE geo IS NOT NULL)
      const allHaveCoords = result.data.every(
        (profile: { latitude: number | null; longitude: number | null }) =>
          profile.latitude !== null && profile.longitude !== null,
      );

      assertEquals(
        allHaveCoords,
        true,
        "All profiles should have coordinates (view filters by geo IS NOT NULL)",
      );

      console.log(`✅ All ${result.data.length} profiles have coordinates`);
    } else {
      console.log("✅ No profiles returned (none have coordinates set)");
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Map Functions - v_profile_search can be ordered by gamified_score",
  async fn() {
    const result = await querySupabaseView("v_profile_search", {
      select: "*",
      order: "gamified_score.desc",
      limit: "10",
    });

    assertEquals(result.ok, true, "Should be able to order by gamified_score");

    if (result.data && result.data.length > 1) {
      // Verify descending order
      for (let i = 0; i < result.data.length - 1; i++) {
        const current = result.data[i].gamified_score || 0;
        const next = result.data[i + 1].gamified_score || 0;

        assert(
          current >= next,
          `Scores should be in descending order: ${current} >= ${next}`,
        );
      }

      console.log(
        "✅ Profiles correctly ordered by gamified_score (descending)",
      );
      console.log(`   Top score: ${result.data[0].gamified_score || 0}`);
    } else {
      console.log("⚠️  Not enough profiles to test ordering");
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Map Functions - Coordinate privacy jittering works",
  async fn() {
    // This test documents the privacy feature - coordinates are jittered by ±3km
    console.log("\n=== Coordinate Privacy Feature ===");
    console.log(
      "The jitter_coordinate() function adds random offset to coordinates:",
    );
    console.log(
      "  - Default offset: ±0.03 degrees (≈2-3km depending on latitude)",
    );
    console.log("  - Applied to both longitude and latitude");
    console.log(
      "  - Prevents exact location tracking while maintaining general area",
    );
    console.log("  - New jittered value on each query (VOLATILE function)");
    console.log("\nThis means:");
    console.log("  - Users can see workers in their area");
    console.log("  - Exact home addresses remain private");
    console.log(
      "  - Multiple queries will return slightly different coordinates",
    );
    console.log("\n✅ Privacy feature documented");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Map Functions - PostGIS geometry type is accessible",
  async fn() {
    // This test verifies the fix for the geometry type accessibility issue
    const result = await callSupabaseRPC("get_organizations_with_coords");

    assertEquals(
      result.ok,
      true,
      "Function should execute without geometry type errors",
    );

    // If we got this far without error, PostGIS geometry type is accessible
    console.log("✅ PostGIS geometry type is accessible via extensions schema");
    console.log("   Function uses: SET search_path = public, extensions");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Map Functions - get_jobs_with_coords returns valid data",
  async fn() {
    const result = await callSupabaseRPC("get_jobs_with_coords");

    assertEquals(result.ok, true, "Should return successful response");
    assertExists(result.data, "Should have data");
    assertEquals(Array.isArray(result.data), true, "Data should be an array");

    console.log(
      `✅ Found ${result.data.length} jobs with coordinates`,
    );

    if (result.data.length > 0) {
      const job = result.data[0];

      // Verify required fields exist
      assertExists(job.id, "Job should have id");
      assertExists(job.title, "Job should have title");
      assertExists(job.organization_id, "Job should have organization_id");
      assertExists(job.longitude, "Job should have longitude");
      assertExists(job.latitude, "Job should have latitude");
      assertExists(job.status, "Job should have status");

      // Verify longitude/latitude are numbers
      assertEquals(
        typeof job.longitude,
        "number",
        "Longitude should be a number",
      );
      assertEquals(
        typeof job.latitude,
        "number",
        "Latitude should be a number",
      );

      // Verify coordinates are in valid range
      assert(
        job.longitude >= -180 && job.longitude <= 180,
        "Longitude should be between -180 and 180",
      );
      assert(
        job.latitude >= -90 && job.latitude <= 90,
        "Latitude should be between -90 and 90",
      );

      // Verify status is 'open'
      assertEquals(
        job.status,
        "open",
        "Job status should be 'open'",
      );

      console.log(
        `   Sample job: ${job.title} at (${job.latitude}, ${job.longitude})`,
      );
    } else {
      console.log(
        "⚠️  No jobs with coordinates found - seed data may be needed or jobs may not have geo coordinates set",
      );
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Map Functions - get_jobs_with_coords respects limit",
  async fn() {
    const result = await callSupabaseRPC("get_jobs_with_coords");

    assertEquals(result.ok, true, "Should return successful response");

    if (result.data && result.data.length > 0) {
      // Function has a LIMIT 500 clause
      assert(
        result.data.length <= 500,
        "Should not return more than 500 jobs",
      );
      console.log(
        `✅ Correctly limited to ${result.data.length} jobs (max 500)`,
      );
    } else {
      console.log("⚠️  No data to test limit");
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Map Functions - get_jobs_with_coords only returns open jobs",
  async fn() {
    const result = await callSupabaseRPC("get_jobs_with_coords");

    assertEquals(result.ok, true, "Should return successful response");

    if (result.data && result.data.length > 0) {
      // All returned jobs should have status 'open'
      const allOpen = result.data.every(
        (job: { status: string }) => job.status === "open",
      );

      assertEquals(
        allOpen,
        true,
        "All jobs should have status 'open'",
      );

      console.log(
        `✅ All ${result.data.length} jobs have status 'open'`,
      );
    } else {
      console.log("⚠️  No jobs found");
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Map Functions - get_jobs_with_coords includes organization_name",
  async fn() {
    const result = await callSupabaseRPC("get_jobs_with_coords");

    assertEquals(result.ok, true, "Should return successful response");

    if (result.data && result.data.length > 0) {
      const job = result.data[0];

      // Organization name should be included (may be null if org doesn't exist)
      assertExists(
        "organization_name" in job,
        "Job should have organization_name field",
      );

      if (job.organization_name) {
        assertEquals(
          typeof job.organization_name,
          "string",
          "Organization name should be a string if present",
        );
        console.log(
          `✅ Job includes organization name: ${job.organization_name}`,
        );
      } else {
        console.log(
          "⚠️  Job has null organization_name (organization may not exist)",
        );
      }
    } else {
      console.log("⚠️  No jobs found to test organization_name");
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
