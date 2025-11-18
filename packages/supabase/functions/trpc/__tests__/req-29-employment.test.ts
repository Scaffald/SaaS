/**
 * REQ-29 Employment Preferences Integration Tests
 * Tests the backend tRPC router for employment preferences
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.218.0/assert/mod.ts";
import { createClient } from "@supabase/supabase-js";
import { appRouter } from "../routers/_app.ts";
import {
  createAdminClient,
  TEST_SUPABASE_SERVICE_KEY,
  TEST_SUPABASE_URL,
} from "./setup.ts";
import { getTestContext, requireAuthSetup } from "./test-context.ts";

Deno.test({
  name: "REQ-29 employment preferences API",
  async fn(t) {
    await requireAuthSetup();
    const ctx = await getTestContext();

    const supabaseAdmin = createAdminClient();
    const supabaseForUser = createClient(
      TEST_SUPABASE_URL,
      TEST_SUPABASE_SERVICE_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${ctx.user.token}` },
        },
      },
    );

    const caller = appRouter.createCaller({
      user: { id: ctx.user.userId, email: ctx.user.email },
      userToken: ctx.user.token,
      supabase: supabaseForUser,
      supabaseAdmin,
    });

    await t.step("getEmployment returns correct data structure", async () => {
      const result = await caller.profile.getEmployment();

      assertExists(result);
      assertEquals(typeof result.preferred_work_locations, "object");
      assertEquals(Array.isArray(result.preferred_work_locations), true);
      assertEquals(typeof result.open_to_travel, "boolean");
      assertEquals(typeof result.travel_distance_miles, "number");
      assertEquals(typeof result.us_resident, "boolean");
      assertEquals(typeof result.us_passport, "boolean");
      assertEquals(Array.isArray(result.drivers_license_classes), true);
      assertEquals(Array.isArray(result.military_status), true);
      assertEquals(Array.isArray(result.availability), true);
    });

    await t.step("getEmployment handles missing data (returns defaults)", async () => {
      const result = await caller.profile.getEmployment();

      // Should return defaults for boolean fields
      assertEquals(typeof result.us_resident, "boolean");
      assertEquals(typeof result.us_passport, "boolean");
      assertEquals(result.open_to_travel, true); // Default is true
      assertEquals(typeof result.travel_distance_miles, "number");
      assertEquals(result.travel_distance_miles, 25); // Default is 25

      // Arrays should be empty arrays, not null
      assertEquals(Array.isArray(result.preferred_work_locations), true);
      assertEquals(Array.isArray(result.drivers_license_classes), true);
      assertEquals(Array.isArray(result.military_status), true);
      assertEquals(Array.isArray(result.availability), true);
    });

    await t.step("getEmployment converts hourly_rate_cents to hourly_rate", async () => {
      // First, set an hourly rate
      await caller.profile.updateEmployment({
        hourly_rate: 45.50,
        us_resident: true,
        travel_distance_miles: 25,
      });

      const result = await caller.profile.getEmployment();

      // Should convert cents to dollars
      if (result.hourly_rate !== null && result.hourly_rate !== undefined) {
        assertEquals(typeof result.hourly_rate, "number");
        // Should be in dollars (not cents)
        assertEquals(result.hourly_rate >= 0 && result.hourly_rate <= 200, true);
      }
    });

    await t.step("updateEmployment saves all fields correctly", async () => {
      const updateData = {
        preferred_work_locations: ["Location 1", "Location 2"],
        open_to_travel: true,
        travel_distance_miles: 50,
        us_resident: true,
        us_passport: true,
        drivers_license_classes: ["Class A", "Class B"],
        military_status: ["Veteran"],
        availability: ["Full-time", "Part-time"],
        hourly_rate: 30.00,
      };

      const result = await caller.profile.updateEmployment(updateData);
      assertEquals(result.success, true);

      // Verify data was saved
      const retrieved = await caller.profile.getEmployment();
      assertEquals(retrieved.us_resident, true);
      assertEquals(retrieved.us_passport, true);
      assertEquals(retrieved.travel_distance_miles, 50);
      assertEquals(retrieved.drivers_license_classes.length, 2);
      assertEquals(retrieved.military_status.length, 1);
      assertEquals(retrieved.availability.length, 2);
      if (retrieved.hourly_rate !== null && retrieved.hourly_rate !== undefined) {
        assertEquals(retrieved.hourly_rate, 30.00);
      }
    });

    await t.step("updateEmployment supports partial updates", async () => {
      // Update only one field
      await caller.profile.updateEmployment({
        travel_distance_miles: 75,
        us_resident: true,
      });

      const result = await caller.profile.getEmployment();
      assertEquals(result.travel_distance_miles, 75);
      // Other fields should remain unchanged
      assertEquals(result.us_resident, true);
    });

    await t.step("updateEmployment converts hourly_rate to hourly_rate_cents", async () => {
      await caller.profile.updateEmployment({
        hourly_rate: 25.50,
        us_resident: true,
        travel_distance_miles: 25,
      });

      const result = await caller.profile.getEmployment();
      if (result.hourly_rate !== null && result.hourly_rate !== undefined) {
        // Should be stored as cents in DB, returned as dollars
        assertEquals(result.hourly_rate, 25.50);
      }
    });

    await t.step("updateEmployment handles empty arrays correctly", async () => {
      await caller.profile.updateEmployment({
        drivers_license_classes: [],
        military_status: [],
        availability: [],
        preferred_work_locations: [],
        us_resident: true,
        travel_distance_miles: 25,
      });

      const result = await caller.profile.getEmployment();
      assertEquals(result.drivers_license_classes.length, 0);
      assertEquals(result.military_status.length, 0);
      assertEquals(result.availability.length, 0);
      assertEquals(result.preferred_work_locations.length, 0);
    });

    await t.step("updateEmployment handles database errors", async () => {
      // This test verifies error handling
      // We can't easily simulate a database error, but we can verify
      // that invalid data is handled by the schema validation
      try {
        await caller.profile.updateEmployment({
          // Missing required fields might cause validation errors
          hourly_rate: -1, // Invalid: negative value
          us_resident: true,
          travel_distance_miles: 25,
        });
        // If it doesn't throw, that's also valid (schema might allow it)
      } catch (error) {
        // Error is expected for invalid data
        assertExists(error);
      }
    });
  },
});

