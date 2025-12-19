/**
 * Teams router baseline coverage.
 */

import { assertEquals, assertExists } from '../shared/assert';

import { callTRPCEndpoint } from '../shared/setup';

Deno.test({
  name: "Teams router - list requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("teams.list", {}, { type: "query" });

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Teams router - create requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "teams.create",
      {
        organizationId: "00000000-0000-0000-0000-000000000000",
        name: "Field Operations",
        defaultRoleKey: "member",
      },
      { type: "mutation" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Teams router - respondToInvitation returns NOT_FOUND for unknown token",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "teams.respondToInvitation",
      {
        token: "ffffffffffffffff",
        action: "accept",
      },
      { type: "mutation" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected NOT_FOUND error");
    assertEquals(error?.data?.code, "NOT_FOUND");
  },
});
