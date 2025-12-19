/**
 * O*NET router baseline coverage.
 */

import { assertEquals, assertExists } from '../shared/assert';

import { callTRPCEndpoint } from '../shared/setup';

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
