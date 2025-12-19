/**
 * Employers router baseline coverage.
 */

import { assertEquals, assertExists } from '../shared/assert';

import { callTRPCEndpoint, loadCachedTokens } from '../shared/setup';
import { requireAuthSetup } from '../shared/test-context';

const ORGANIZATION_ID = crypto.randomUUID();

Deno.test({
  name: "Employers router - getOrganizationEmploymentStatus requires auth",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "employers.getOrganizationEmploymentStatus",
      { organizationId: ORGANIZATION_ID },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Employers router - getOrganizationEmploymentStatus returns defaults",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "employers.getOrganizationEmploymentStatus",
      { organizationId: ORGANIZATION_ID },
      { authToken: tokens.regular.token },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected status payload");
    assertEquals(typeof data.isLinked, "boolean");
    assertEquals(data.experienceId, null);
  },
});
