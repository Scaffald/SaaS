/**
 * O*NET router comprehensive tests.
 * Tests for career assessment endpoints including RIASEC scores and occupation management.
 */

import { assertEquals, assertExists } from '../shared/assert';

import { callTRPCEndpoint, loadCachedTokens } from '../shared/setup';
import { requireAuthSetup } from '../shared/test-context';

Deno.test({
  name: "O*NET router - searchOccupations returns array",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "onet.searchOccupations",
      { query: "engineer", limit: 5 },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected response payload");
    assertEquals(Array.isArray(data.occupations), true);
    assertEquals(data.occupations.length > 0, true);
  },
});

Deno.test({
  name: "O*NET router - searchOccupations returns occupations with correct structure",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "onet.searchOccupations",
      { query: "software", limit: 3 },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected response payload");
    assertEquals(Array.isArray(data.occupations), true);
    
    if (data.occupations.length > 0) {
      const occupation = data.occupations[0];
      assertExists(occupation.onetsoc_code, "Occupation should have onetsoc_code");
      assertExists(occupation.title, "Occupation should have title");
      assertEquals(typeof occupation.onetsoc_code, "string");
      assertEquals(typeof occupation.title, "string");
    }
  },
});

Deno.test({
  name: "O*NET router - searchOccupations respects limit parameter",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "onet.searchOccupations",
      { query: "developer", limit: 2 },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected response payload");
    assertEquals(data.occupations.length <= 2, true);
  },
});

Deno.test({
  name: "O*NET router - saveCareerAssessment requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "onet.saveCareerAssessment",
      {
        riasec_scores: {
          realistic: 3,
          investigative: 3,
          artistic: 3,
          social: 3,
          enterprising: 3,
          conventional: 3,
        },
      },
      { type: "mutation" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "O*NET router - saveCareerAssessment saves RIASEC scores correctly",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const riasecScores = {
      realistic: 4,
      investigative: 5,
      artistic: 2,
      social: 3,
      enterprising: 4,
      conventional: 3,
    };

    const response = await callTRPCEndpoint(
      "onet.saveCareerAssessment",
      {
        riasec_scores: riasecScores,
      },
      { type: "mutation", authToken: tokens.regular.token },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected response payload");
    assertEquals(data.success, true);
  },
});

Deno.test({
  name: "O*NET router - saveCareerAssessment validates RIASEC score range",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    // Test with score out of range (should fail validation)
    const response = await callTRPCEndpoint(
      "onet.saveCareerAssessment",
      {
        riasec_scores: {
          realistic: 6, // Invalid: should be 1-5
          investigative: 3,
          artistic: 3,
          social: 3,
          enterprising: 3,
          conventional: 3,
        },
      },
      { type: "mutation", authToken: tokens.regular.token },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected validation error");
  },
});

Deno.test({
  name: "O*NET router - saveCareerAssessment saves occupation codes correctly",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "onet.saveCareerAssessment",
      {
        current_occupation_code: "15-1252.00",
        target_occupation_codes: ["15-1253.00", "15-1254.00"],
      },
      { type: "mutation", authToken: tokens.regular.token },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected response payload");
    assertEquals(data.success, true);
  },
});

Deno.test({
  name: "O*NET router - saveCareerAssessment handles partial updates",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    // Save only RIASEC scores first
    const response1 = await callTRPCEndpoint(
      "onet.saveCareerAssessment",
      {
        riasec_scores: {
          realistic: 3,
          investigative: 3,
          artistic: 3,
          social: 3,
          enterprising: 3,
          conventional: 3,
        },
      },
      { type: "mutation", authToken: tokens.regular.token },
    );

    assertEquals(response1[0]?.result?.data?.success, true);

    // Then save only occupations (should not override RIASEC scores)
    const response2 = await callTRPCEndpoint(
      "onet.saveCareerAssessment",
      {
        current_occupation_code: "15-1252.00",
      },
      { type: "mutation", authToken: tokens.regular.token },
    );

    assertEquals(response2[0]?.result?.data?.success, true);
  },
});

Deno.test({
  name: "O*NET router - getCareerAssessmentStatus returns correct status",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "onet.getCareerAssessmentStatus",
      undefined,
      { authToken: tokens.regular.token },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected response payload");
    assertEquals(typeof data.hasCompleted, "boolean");
    assertEquals(typeof data.riasec_scores === "object" || data.riasec_scores === null, true);
    assertEquals(typeof data.current_occupation_code === "string" || data.current_occupation_code === null, true);
    assertEquals(Array.isArray(data.target_occupation_codes), true);
  },
});

Deno.test({
  name: "O*NET router - getRIASECStatus returns correct status",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "onet.getRIASECStatus",
      undefined,
      { authToken: tokens.regular.token },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected response payload");
    assertEquals(typeof data.isCompleted, "boolean");
    assertEquals(typeof data.scores === "object" || data.scores === null, true);
  },
});

Deno.test({
  name: "O*NET router - getOccupationStatus returns correct status",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "onet.getOccupationStatus",
      undefined,
      { authToken: tokens.regular.token },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected response payload");
    assertEquals(typeof data.isCompleted, "boolean");
    assertEquals(typeof data.hasCurrentOccupation, "boolean");
    assertEquals(typeof data.hasTargetOccupations, "boolean");
    assertEquals(typeof data.currentOccupationCode === "string" || data.currentOccupationCode === null, true);
    assertEquals(Array.isArray(data.targetOccupationCodes), true);
  },
});

Deno.test({
  name: "O*NET router - getRIASECStatus requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("onet.getRIASECStatus");

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "O*NET router - getOccupationStatus requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("onet.getOccupationStatus");

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});
