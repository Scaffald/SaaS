import {
  assertEquals,
  assertExists,
} from "jsr:@std/assert";

import { callTRPCEndpoint } from "../setup.ts";

Deno.test({
  name: "Teams router - list requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "teams.list",
      {},
      { type: "query" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error response");
    assertEquals(error.data?.code, "UNAUTHORIZED");
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
    assertExists(error, "Expected UNAUTHORIZED error response");
    assertEquals(error.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Teams router - respondToInvitation returns NOT_FOUND for unknown tokens",
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
    assertExists(error, "Expected NOT_FOUND error response");
    assertEquals(error.data?.code, "NOT_FOUND");
  },
});

