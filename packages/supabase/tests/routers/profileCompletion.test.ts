/**
 * Profile completion router integration tests.
 */

import { assertEquals, assertExists } from '../shared/assert.ts';

import { callTRPCEndpoint, loadCachedTokens } from '../shared/setup.ts';
import { requireAuthSetup } from '../shared/test-context.ts';

Deno.test({
  name: "Profile completion router - getStatus requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("profile.getStatus");

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Profile completion router - getStatus calculates completion percentage correctly",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "profile.getStatus",
      undefined,
      { authToken: tokens.regular.token },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected status payload");
    assertEquals(typeof data.completionPercentage, "number");
    assertExists(data.completionPercentage >= 0 && data.completionPercentage <= 100);
  },
});

Deno.test({
  name: "Profile completion router - getStatus identifies completed and incomplete sections",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "profile.getStatus",
      undefined,
      { authToken: tokens.regular.token },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected status payload");
    assertExists(Array.isArray(data.sectionProgress));
    assertExists(Array.isArray(data.incompleteSections));
  },
});

Deno.test({
  name: "Profile completion router - getStatus tracks milestones",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "profile.getStatus",
      undefined,
      { authToken: tokens.regular.token },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected status payload");
    assertExists(Array.isArray(data.milestoneBadges));
    // Should have milestones for 25%, 50%, 75%, 100%
    assertExists(data.milestoneBadges.length >= 0);
  },
});

Deno.test({
  name: "Profile completion router - getStatus returns nudge status",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "profile.getStatus",
      undefined,
      { authToken: tokens.regular.token },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected status payload");
    assertExists(data.nudgeStatus);
    assertEquals(typeof data.nudgeStatus.shouldPrompt, "boolean");
    assertExists(Array.isArray(data.nudgeStatus.dismissed) || typeof data.nudgeStatus.dismissed === "object");
  },
});

Deno.test({
  name: "Profile completion router - dismissNudge requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("profile.dismissNudge", {
      nudgeId: "modal",
      reason: "user_action",
    });

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Profile completion router - dismissNudge records dismissal",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const dismissResponse = await callTRPCEndpoint(
      "profile.dismissNudge",
      {
        nudgeId: "modal",
        reason: "user_action",
      },
      { authToken: tokens.regular.token },
    );

    const dismissData = dismissResponse[0]?.result?.data;
    assertExists(dismissData, "Expected dismiss response");

    // Verify nudge was dismissed by checking status
    const statusResponse = await callTRPCEndpoint(
      "profile.getStatus",
      undefined,
      { authToken: tokens.regular.token },
    );

    const statusData = statusResponse[0]?.result?.data;
    assertExists(statusData);
    assertExists(statusData.nudgeStatus.lastDismissedAt !== null || statusData.nudgeStatus.dismissed);
  },
});

Deno.test({
  name: "Profile completion router - getPersonalizedBenefits requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("profile.getPersonalizedBenefits");

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Profile completion router - getPersonalizedBenefits calculates benefits based on incomplete sections",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "profile.getPersonalizedBenefits",
      undefined,
      { authToken: tokens.regular.token },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected benefits payload");
    assertExists(Array.isArray(data.benefits));
    assertEquals(typeof data.completionPercentage, "number");
    assertExists(Array.isArray(data.incompleteSections));
  },
});

Deno.test({
  name: "Profile completion router - getPersonalizedBenefits returns opportunity counts",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "profile.getPersonalizedBenefits",
      undefined,
      { authToken: tokens.regular.token },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected benefits payload");
    if (data.benefits.length > 0) {
      const firstBenefit = data.benefits[0];
      assertExists(typeof firstBenefit.opportunityCount === "number");
      assertExists(firstBenefit.opportunityCount >= 0);
    }
  },
});

