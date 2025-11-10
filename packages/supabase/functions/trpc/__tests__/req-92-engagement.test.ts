/**
 * REQ-92 Engagement Flow Tests
 * Validates dashboard organization requests, follow/unfollow, and employment claims.
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
  name: "REQ-92 dashboard engagement flows",
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

    const slugSuffix = crypto.randomUUID().slice(0, 8);
    const organizationSlug = `req92-org-${slugSuffix}`;
    const requestSlug = `req92-request-${slugSuffix}`;
    const organizationName = `REQ-92 Test Org ${slugSuffix}`;

    let organizationId = "";
    let requestId: string | null = null;
    let experienceId: string | null = null;

    await t.step("Create organization for engagement flows", async () => {
      const { data, error } = await supabaseAdmin
        .schema("core")
        .from("organizations")
        .insert({
          name: organizationName,
          slug: organizationSlug,
          visibility: "public",
        })
        .select("id")
        .single();

      assertEquals(
        error,
        null,
        error?.message ?? "failed to create organization",
      );
      assertExists(data, "organization insert returned no data");
      organizationId = data.id;
    });

    await t.step("Submit moderated organization request", async () => {
      const result = await caller.organizations.createOrganizationRequest({
        name: `${organizationName} Request`,
        slug: requestSlug,
      });

      assertExists(result.request, "request payload missing");
      requestId = result.request.id;
      assertEquals(result.request.slug, requestSlug);

      const { data, error } = await supabaseAdmin
        .schema("core")
        .from("organization_requests")
        .select("id, slug, created_by_user_id")
        .eq("id", requestId)
        .single();

      assertEquals(error, null, error?.message ?? "fetch request failed");
      assertExists(data, "request row was not created");
      assertEquals(data.slug, requestSlug);
      assertEquals(data.created_by_user_id, ctx.user.userId);
    });

    await t.step("Follow and unfollow organization", async () => {
      await supabaseAdmin
        .schema("core")
        .from("follows")
        .delete()
        .match({
          follower_type: "user",
          follower_id: ctx.user.userId,
          followee_type: "organization",
          followee_id: organizationId,
        });

      const followResult = await caller.employers.followOrganization({
        organizationId,
      });
      assertEquals(followResult.alreadyFollowing, false);
      assertExists(followResult.follow, "follow payload missing");
      assertExists(followResult.follow?.id, "follow id missing");

      const followStatus = await caller.employers.getOrganizationFollowStatus({
        organizationId,
      });
      assertEquals(followStatus.isFollowing, true);

      const { data: followRow, error: followRowError } = await supabaseAdmin
        .schema("core")
        .from("follows")
        .select("follower_id, followee_id")
        .eq("id", followResult.follow!.id)
        .single();
      assertEquals(followRowError, null);
      assertExists(followRow, "follow row missing in database");
      assertEquals(followRow.follower_id, ctx.user.userId);
      assertEquals(followRow.followee_id, organizationId);

      const unfollowResult = await caller.employers.unfollowOrganization({
        organizationId,
      });
      assertEquals(unfollowResult.success, true);

      const followStatusAfter =
        await caller.employers.getOrganizationFollowStatus({
          organizationId,
        });
      assertEquals(followStatusAfter.isFollowing, false);

      const { data: remainingFollows, error: remainingError } =
        await supabaseAdmin
          .schema("core")
          .from("follows")
          .select("id")
          .match({
            follower_type: "user",
            follower_id: ctx.user.userId,
            followee_type: "organization",
            followee_id: organizationId,
          });
      assertEquals(remainingError, null);
      assertEquals(remainingFollows?.length ?? 0, 0);
    });

    await t.step("Claim and remove employment link", async () => {
      await supabaseAdmin
        .schema("core")
        .from("user_experience")
        .delete()
        .eq("user_id", ctx.user.userId)
        .eq("organization_id", organizationId);

      const claimResult = await caller.employers.claimOrganizationEmployment({
        organizationId,
      });
      assertEquals(claimResult.alreadyLinked, false);
      assertExists(claimResult.experience, "claim payload missing");
      experienceId = claimResult.experience?.id ?? null;
      assertExists(experienceId, "experience id missing");

      const { data: experienceRow, error: experienceError } =
        await supabaseAdmin
          .schema("core")
          .from("user_experience")
          .select("id, organization_id, source, claimed_at")
          .eq("id", experienceId)
          .single();
      assertEquals(experienceError, null);
      assertExists(experienceRow, "experience row missing");
      assertEquals(experienceRow.organization_id, organizationId);
      assertEquals(experienceRow.source, "claim");
      assertExists(experienceRow.claimed_at, "claimed_at should be recorded");

      const removeResult = await caller.employers.removeOrganizationEmployment({
        organizationId,
      });
      assertEquals(removeResult.removed, true);

      const { data: remainingExperience, error: remainingExperienceError } =
        await supabaseAdmin
          .schema("core")
          .from("user_experience")
          .select("id")
          .eq("id", experienceId);
      assertEquals(remainingExperienceError, null);
      assertEquals(remainingExperience?.length ?? 0, 0);
    });

    await t.step("Cleanup temporary data", async () => {
      await supabaseAdmin
        .schema("core")
        .from("organization_requests")
        .delete()
        .eq("slug", requestSlug);

      await supabaseAdmin
        .schema("core")
        .from("follows")
        .delete()
        .match({
          follower_type: "user",
          follower_id: ctx.user.userId,
          followee_type: "organization",
          followee_id: organizationId,
        });

      await supabaseAdmin
        .schema("core")
        .from("user_experience")
        .delete()
        .eq("organization_id", organizationId)
        .eq("user_id", ctx.user.userId);

      await supabaseAdmin
        .schema("core")
        .from("organizations")
        .delete()
        .eq("id", organizationId);
    });
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

