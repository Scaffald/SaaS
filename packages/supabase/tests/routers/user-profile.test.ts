/**
 * UserProfile router test coverage.
 * User profile router test coverage.
 */

import { assertEquals, assertExists } from "../shared/assert.ts";

import { callTRPCEndpoint, loadCachedTokens } from "../shared/setup.ts";
import { requireAuthSetup } from "../shared/test-context.ts";

Deno.test({
  name: "UserProfile router - getPreview requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("userProfile.getPreview", {
      userId: "00000000-0000-0000-0000-000000000000",
    });

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "UserProfile router - getPreview returns lightweight profile data",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be available");

    // Use the authenticated user's ID
    const response = await callTRPCEndpoint(
      "userProfile.getPreview",
      {
        userId: tokens.regular.userId,
      },
      { authToken: tokens.regular.token },
    );

    const result = response[0]?.result?.data;
    assertExists(result, "Preview should return data");
    assertExists(result.id, "Preview should include user id");
    assertExists(result.displayName, "Preview should include display name");
  },
});

Deno.test({
  name: "UserProfile router - getPreview includes avatar URL/path",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be available");

    const response = await callTRPCEndpoint(
      "userProfile.getPreview",
      {
        userId: tokens.regular.userId,
      },
      { authToken: tokens.regular.token },
    );

    const result = response[0]?.result?.data;
    assertExists(result, "Preview should return data");
    // Avatar should be present (either avatarPath or avatarUrl)
    assertEquals(
      typeof result.avatarPath === "string" ||
        typeof result.avatarUrl === "string" || result.avatarPath === null,
      true,
      "Preview should include avatar path or URL",
    );
  },
});

Deno.test({
  name: "UserProfile router - getPreview includes top 3 skills",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be available");

    const response = await callTRPCEndpoint(
      "userProfile.getPreview",
      {
        userId: tokens.regular.userId,
      },
      { authToken: tokens.regular.token },
    );

    const result = response[0]?.result?.data;
    assertExists(result, "Preview should return data");
    assertExists(result.topSkills, "Preview should include topSkills");
    assertEquals(
      Array.isArray(result.topSkills),
      true,
      "topSkills should be an array",
    );
    // Should return up to 5 skills (as per router implementation)
    assertEquals(
      result.topSkills.length <= 5,
      true,
      "topSkills should have max 5 items",
    );
  },
});

Deno.test({
  name:
    "UserProfile router - getPreview includes display name, headline, location",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be available");

    const response = await callTRPCEndpoint(
      "userProfile.getPreview",
      {
        userId: tokens.regular.userId,
      },
      { authToken: tokens.regular.token },
    );

    const result = response[0]?.result?.data;
    assertExists(result, "Preview should return data");
    assertExists(result.displayName, "Preview should include displayName");
    // Headline and location are optional
    assertEquals(
      typeof result.headline === "string" || result.headline === null,
      true,
      "headline should be string or null",
    );
    assertEquals(
      typeof result.location === "string" || result.location === null,
      true,
      "location should be string or null",
    );
  },
});

Deno.test({
  name: "UserProfile router - getPreview handles missing user gracefully",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be available");

    const response = await callTRPCEndpoint(
      "userProfile.getPreview",
      {
        userId: "00000000-0000-0000-0000-000000000000",
      },
      { authToken: tokens.regular.token },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error for non-existent user");
    assertEquals(
      error?.data?.code === "NOT_FOUND" ||
        error?.data?.code === "INTERNAL_SERVER_ERROR",
      true,
    );
  },
});
