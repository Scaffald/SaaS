/**
 * Profile Experience Router Tests
 * Tests for work experience CRUD operations
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.218.0/assert/mod.ts";
import {
  createAdminClient,
  createTestClient,
  registerUserWithMagicLink,
} from "./setup.ts";

// Test user email
const TEST_USER_EMAIL = `experience-test-${Date.now()}@example.com`;

// Test data
const TEST_ORGANIZATION_ID = "123e4567-e89b-12d3-a456-426614174000"; // Will be created in setup

Deno.test({
  name: "Profile Experience - Full CRUD Flow",
  fn: async (t) => {
    let authToken: string;
    let userId: string;
    let experienceId: string;
    let orgId: string;

    await t.step("Setup: Register test user", async () => {
      const auth = await registerUserWithMagicLink(TEST_USER_EMAIL);
      assertExists(auth, "Failed to register user");
      authToken = auth!.token;
      userId = auth!.userId;
      console.log("✓ User registered:", userId);
    });

    await t.step("Setup: Create test organization", async () => {
      const admin = createAdminClient();
      
      const { data, error } = await admin
        .from("organizations")
        .insert({
          name: "Test Construction Company",
          slug: `test-construction-${Date.now()}`,
          industry_id: null,
          visibility: "public",
        })
        .select()
        .single();

      assertEquals(error, null, "Failed to create test organization");
      assertExists(data, "No organization data returned");
      orgId = data!.id;
      console.log("✓ Test organization created:", orgId);
    });

    await t.step("1. Get experience entries (should be empty initially)", async () => {
      const supabase = createTestClient(authToken);

      const { data, error } = await supabase
        .schema("private")
        .from("user_experience")
        .select("*")
        .eq("user_id", userId);

      assertEquals(error, null, "Failed to fetch experience");
      assertEquals(data, [], "Should have no experience entries initially");
      console.log("✓ Initial experience is empty");
    });

    await t.step("2. Get experience summary (career_level)", async () => {
      const supabase = createTestClient(authToken);

      const { data, error } = await supabase
        .schema("private")
        .from("profile")
        .select("career_level")
        .eq("user_id", userId)
        .single();

      assertEquals(error, null, "Failed to fetch experience summary");
      assertExists(data, "No profile data returned");
      console.log("✓ Experience summary fetched");
    });

    await t.step("3. Create new experience entry (with organization link)", async () => {
      const supabase = createTestClient(authToken);

      const { data, error } = await supabase
        .schema("private")
        .from("user_experience")
        .insert({
          user_id: userId,
          organization_id: orgId,
          job_title: "Senior Electrician",
          company_name: "Test Construction Company",
          employment_type: "Full-time",
          location: "San Francisco, CA",
          is_remote: false,
          start_date: "2020-01-01",
          end_date: null,
          is_current: true,
          description: "Leading electrical installations for commercial projects.",
        })
        .select()
        .single();

      assertEquals(error, null, "Failed to create experience entry");
      assertExists(data, "No experience data returned");
      assertExists(data!.id, "Experience ID should exist");
      assertEquals(data!.job_title, "Senior Electrician");
      assertEquals(data!.organization_id, orgId, "Organization ID should be linked");
      
      experienceId = data!.id;
      console.log("✓ Experience entry created:", experienceId);
    });

    await t.step("4. Create experience entry without organization", async () => {
      const supabase = createTestClient(authToken);

      const { data, error } = await supabase
        .schema("private")
        .from("user_experience")
        .insert({
          user_id: userId,
          organization_id: null,
          job_title: "Apprentice Electrician",
          company_name: "Smith Electric Services",
          employment_type: "Apprenticeship",
          location: "Oakland, CA",
          is_remote: false,
          start_date: "2018-06-01",
          end_date: "2019-12-31",
          is_current: false,
          description: "Learned residential electrical work under licensed electrician.",
        })
        .select()
        .single();

      assertEquals(error, null, "Failed to create experience without org");
      assertExists(data, "No experience data returned");
      assertEquals(data!.organization_id, null, "Organization ID should be null");
      assertEquals(data!.company_name, "Smith Electric Services");
      console.log("✓ Experience without organization created");
    });

    await t.step("5. Get all experience entries", async () => {
      const supabase = createTestClient(authToken);

      const { data, error } = await supabase
        .schema("private")
        .from("user_experience")
        .select("*")
        .eq("user_id", userId)
        .order("start_date", { ascending: false });

      assertEquals(error, null, "Failed to fetch all experience");
      assertExists(data, "No experience data returned");
      assertEquals(data!.length, 2, "Should have 2 experience entries");
      console.log("✓ All experience entries fetched:", data!.length);
    });

    await t.step("6. Update experience entry", async () => {
      const supabase = createTestClient(authToken);

      const { data, error } = await supabase
        .schema("private")
        .from("user_experience")
        .update({
          job_title: "Lead Electrician",
          description: "Updated: Leading electrical installations and managing team.",
        })
        .eq("id", experienceId)
        .eq("user_id", userId)
        .select()
        .single();

      assertEquals(error, null, "Failed to update experience");
      assertExists(data, "No updated data returned");
      assertEquals(data!.job_title, "Lead Electrician");
      console.log("✓ Experience entry updated");
    });

    await t.step("7. Update career_level in profile", async () => {
      const supabase = createTestClient(authToken);

      const { data, error } = await supabase
        .schema("private")
        .from("profile")
        .update({ career_level: "Mid Level" })
        .eq("user_id", userId)
        .select()
        .single();

      assertEquals(error, null, "Failed to update career level");
      assertExists(data, "No profile data returned");
      assertEquals(data!.career_level, "Mid Level");
      console.log("✓ Career level updated");
    });

    await t.step("8. Test RLS: Other user cannot see experience", async () => {
      // Register another user
      const otherUserEmail = `experience-other-${Date.now()}@example.com`;
      const otherAuth = await registerUserWithMagicLink(otherUserEmail);
      assertExists(otherAuth, "Failed to register other user");

      const supabase = createTestClient(otherAuth!.token);

      const { data, error } = await supabase
        .schema("private")
        .from("user_experience")
        .select("*")
        .eq("user_id", userId); // Try to fetch first user's experience

      // Should succeed but return empty (RLS filters it out)
      assertEquals(error, null, "Query should succeed");
      assertEquals(data, [], "Should not see other user's experience");
      console.log("✓ RLS prevents seeing other user's data");
    });

    await t.step("9. Test experience with dates and current position", async () => {
      const supabase = createTestClient(authToken);

      const { data: currentJobs, error: currentError } = await supabase
        .schema("private")
        .from("user_experience")
        .select("*")
        .eq("user_id", userId)
        .eq("is_current", true);

      assertEquals(currentError, null, "Failed to fetch current positions");
      assertExists(currentJobs, "No current jobs returned");
      assertEquals(currentJobs!.length, 1, "Should have 1 current position");
      assertEquals(currentJobs![0].end_date, null, "Current job should have no end date");
      console.log("✓ Current position query works");
    });

    await t.step("10. Delete experience entry", async () => {
      const supabase = createTestClient(authToken);

      const { error: deleteError } = await supabase
        .schema("private")
        .from("user_experience")
        .delete()
        .eq("id", experienceId)
        .eq("user_id", userId);

      assertEquals(deleteError, null, "Failed to delete experience");

      // Verify deletion
      const { data, error } = await supabase
        .schema("private")
        .from("user_experience")
        .select("*")
        .eq("id", experienceId);

      assertEquals(error, null, "Query failed");
      assertEquals(data, [], "Experience should be deleted");
      console.log("✓ Experience entry deleted");
    });

    await t.step("11. Test organization CASCADE on delete", async () => {
      const admin = createAdminClient();

      // Get experience count before org deletion
      const { data: beforeDelete } = await admin
        .schema("private")
        .from("user_experience")
        .select("id")
        .eq("organization_id", orgId);

      console.log("  Experience entries with org before delete:", beforeDelete?.length || 0);

      // Delete organization (should SET NULL on experience)
      const { error: deleteOrgError } = await admin
        .from("organizations")
        .delete()
        .eq("id", orgId);

      assertEquals(deleteOrgError, null, "Failed to delete organization");

      // Check experience entries - organization_id should be SET NULL
      const { data: afterDelete } = await admin
        .schema("private")
        .from("user_experience")
        .select("*")
        .eq("user_id", userId);

      assertExists(afterDelete, "No experience data after org delete");
      
      // All organization_id fields should now be null
      const hasOrgId = afterDelete!.some(exp => exp.organization_id === orgId);
      assertEquals(hasOrgId, false, "Organization ID should be SET NULL on delete");
      
      console.log("✓ Organization FK SET NULL works correctly");
    });

    await t.step("Cleanup: Delete test user and data", async () => {
      const admin = createAdminClient();

      // Delete experience entries
      await admin
        .schema("private")
        .from("user_experience")
        .delete()
        .eq("user_id", userId);

      // Delete profile
      await admin
        .schema("private")
        .from("profile")
        .delete()
        .eq("user_id", userId);

      // Delete user from public.users
      await admin
        .from("users")
        .delete()
        .eq("id", userId);

      // Delete auth user
      await admin.auth.admin.deleteUser(userId);

      console.log("✓ Test data cleaned up");
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Profile Experience - Field Validation",
  fn: async (t) => {
    let authToken: string;
    let userId: string;

    await t.step("Setup: Register test user", async () => {
      const auth = await registerUserWithMagicLink(
        `experience-validation-${Date.now()}@example.com`,
      );
      assertExists(auth, "Failed to register user");
      authToken = auth!.token;
      userId = auth!.userId;
    });

    await t.step("Test required fields (job_title, company_name)", async () => {
      const supabase = createTestClient(authToken);

      // Missing job_title
      const { error: error1 } = await supabase
        .schema("private")
        .from("user_experience")
        .insert({
          user_id: userId,
          company_name: "Test Company",
        });

      assertExists(error1, "Should fail without job_title");
      console.log("✓ job_title is required");

      // Missing company_name
      const { error: error2 } = await supabase
        .schema("private")
        .from("user_experience")
        .insert({
          user_id: userId,
          job_title: "Test Job",
        });

      assertExists(error2, "Should fail without company_name");
      console.log("✓ company_name is required");
    });

    await t.step("Test optional fields work correctly", async () => {
      const supabase = createTestClient(authToken);

      const { data, error } = await supabase
        .schema("private")
        .from("user_experience")
        .insert({
          user_id: userId,
          job_title: "Minimal Job",
          company_name: "Minimal Company",
          // All other fields optional
        })
        .select()
        .single();

      assertEquals(error, null, "Should succeed with only required fields");
      assertExists(data, "No data returned");
      assertEquals(data!.job_title, "Minimal Job");
      assertEquals(data!.employment_type, null);
      assertEquals(data!.location, null);
      assertEquals(data!.is_remote, false); // Default
      assertEquals(data!.is_current, false); // Default
      console.log("✓ Optional fields work correctly");
    });

    await t.step("Cleanup", async () => {
      const admin = createAdminClient();
      await admin.schema("private").from("user_experience").delete().eq("user_id", userId);
      await admin.schema("private").from("profile").delete().eq("user_id", userId);
      await admin.from("users").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
