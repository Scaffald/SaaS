/**
 * Organizations router baseline coverage.
 */

import { assertEquals, assertExists } from "../shared/assert.ts";

import { callTRPCEndpoint } from "../shared/setup.ts";

const ORGANIZATION_ID = crypto.randomUUID();

Deno.test({
  name: "Organizations router - getOpenJobsCount returns numeric count",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "organizations.getOpenJobsCount",
      { organizationId: ORGANIZATION_ID },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected response payload");
    assertEquals(typeof data.count, "number");
    assertEquals(data.organizationId, ORGANIZATION_ID);
  },
});

Deno.test({
  name: "Organizations router - createOrganizationRequest requires auth",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "organizations.createOrganizationRequest",
      {
        name: "Test Org",
        slug: `test-org-${crypto.randomUUID().slice(0, 8)}`,
        website: "https://example.com",
      },
      { type: "mutation" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});
