import { assertEquals, assertExists } from "../shared/assert.ts";
import { loadCachedTokens, callTRPCEndpoint, requireAuthSetup } from "../shared/setup.ts";
import { createSeedClient } from "../shared/seeding.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

async function withSeededBackgroundCheck(
  userId: string,
  status: string,
  handler: (context: { checkId: string; seedClient: SupabaseClient }) => Promise<void>,
): Promise<void> {
  const seedClient = createSeedClient();
  const checkId = crypto.randomUUID();

  await seedClient
    .schema("core")
    .from("background_checks")
    .insert({
      id: checkId,
      user_id: userId,
      package_id: crypto.randomUUID(),
      check_type_ids: [],
      status,
      status_history: [],
      component_statuses: [],
      initiated_by: "worker",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  try {
    await handler({ checkId, seedClient });
  } finally {
    await seedClient
      .schema("core")
      .from("background_check_disputes")
      .delete()
      .eq("background_check_id", checkId);

    await seedClient
      .schema("core")
      .from("background_checks")
      .delete()
      .eq("id", checkId);
  }
}

Deno.test({
  name: "backgroundChecks.submitDispute rejects when background check is not completed",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    await withSeededBackgroundCheck(tokens.regular.userId, "in_progress", async ({ checkId }) => {
      const response = await callTRPCEndpoint(
        "backgroundChecks.submitDispute",
        {
          background_check_id: checkId,
          dispute_reason: "Records contain inaccurate findings",
          dispute_details: "This record has not completed yet.",
        },
        {
          type: "mutation",
          authToken: tokens.regular.token,
        },
      );

      const error = response[0]?.error;
      assertExists(error, "Expected BAD_REQUEST for incomplete background check");
      assertEquals(error?.data?.code, "BAD_REQUEST");
    });
  },
});

Deno.test({
  name: "backgroundChecks.submitDispute enforces ownership",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    await withSeededBackgroundCheck(tokens.admin.userId, "completed_clear", async ({ checkId }) => {
      const response = await callTRPCEndpoint(
        "backgroundChecks.submitDispute",
        {
          background_check_id: checkId,
          dispute_reason: "Should not be allowed",
          dispute_details: "Attempt by non-owner",
        },
        {
          type: "mutation",
          authToken: tokens.regular.token,
        },
      );

      const error = response[0]?.error;
      assertExists(error, "Expected NOT_FOUND when disputing another user's check");
      assertEquals(error?.data?.code, "NOT_FOUND");
    });
  },
});

Deno.test({
  name: "backgroundChecks.listDisputesForCheck returns empty array for other users",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    await withSeededBackgroundCheck(tokens.regular.userId, "completed_consider", async ({
      checkId,
      seedClient,
    }) => {
      const disputeId = crypto.randomUUID();
      const now = new Date().toISOString();

      await seedClient
        .schema("core")
        .from("background_check_disputes")
        .insert({
          id: disputeId,
          background_check_id: checkId,
          user_id: tokens.regular.userId,
          dispute_reason: "Records contain inaccurate findings",
          dispute_details: "Record owned by worker",
          supporting_documents: [],
          status: "pending",
          created_at: now,
          updated_at: now,
        });

      const response = await callTRPCEndpoint(
        "backgroundChecks.listDisputesForCheck",
        { background_check_id: checkId },
        {
          authToken: tokens.admin.token,
        },
      );

      const disputes = response[0]?.result?.data as
        | Array<Record<string, unknown>>
        | undefined;

      assertExists(disputes, "Expected dispute response payload");
      assertEquals(disputes.length, 0);
    });
  },
});
