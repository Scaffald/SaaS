import type { SupabaseClient } from '@supabase/supabase-js';

import { assert, assertEquals, assertExists } from '../shared/assert';
import { createSeedClient } from '../shared/seeding';
import {
  callTRPCEndpoint,
  loadCachedTokens,
} from '../shared/setup';
import { requireAuthSetup } from '../shared/test-context';

if (!Deno.env.get("STRIPE_MOCK_MODE")) {
  Deno.env.set("STRIPE_MOCK_MODE", "1");
}

async function withSeededBackgroundCheck(
  userId: string,
  options: { status?: string } = {},
  handler: (context: {
    checkId: string;
    packageId: string;
    typeId: string;
    seedClient: SupabaseClient;
  }) => Promise<void>,
): Promise<void> {
  const seedClient = createSeedClient();
  const typeId = crypto.randomUUID();
  const packageId = crypto.randomUUID();
  const checkId = crypto.randomUUID();
  const slugSuffix = crypto.randomUUID().slice(0, 8);

  await seedClient
    .schema("core")
    .from("background_check_types")
    .insert({
      id: typeId,
      slug: `test-type-${slugSuffix}`,
      display_name: `Test Type ${slugSuffix}`,
      platform_cost_cents: 1500,
      retail_cost_cents: 2500,
      required_documents: [],
      metadata: {},
      provider_configuration: {},
    });

  await seedClient
    .schema("core")
    .from("background_check_packages")
    .insert({
      id: packageId,
      slug: `test-package-${slugSuffix}`,
      display_name: `Test Package ${slugSuffix}`,
      check_type_ids: [typeId],
      platform_cost_cents: 2500,
      retail_cost_cents: 4500,
      component_overrides: [],
      metadata: {},
    });

  await seedClient
    .schema("core")
    .from("background_checks")
    .insert({
      id: checkId,
      user_id: userId,
      package_id: packageId,
      check_type_ids: [typeId],
      status: options.status ?? "completed_clear",
      status_history: [],
      component_statuses: [],
      initiated_by: "worker",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  try {
    await handler({ checkId, packageId, typeId, seedClient });
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

    await seedClient
      .schema("core")
      .from("background_check_packages")
      .delete()
      .eq("id", packageId);

    await seedClient
      .schema("core")
      .from("background_check_types")
      .delete()
      .eq("id", typeId);
  }
}

Deno.test({
  name: "backgroundChecks.listPackages requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("backgroundChecks.listPackages");

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "backgroundChecks.createUploadUrl returns signed payload for worker",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    await withSeededBackgroundCheck(
      tokens.regular.userId,
      { status: "completed_not_clear" },
      async ({ checkId }) => {
        const payload = {
          background_check_id: checkId,
          document_type: "dispute_supporting_1",
          file_name: "evidence.pdf",
          mime_type: "application/pdf",
          file_size: 1024,
        };

        const response = await callTRPCEndpoint(
          "backgroundChecks.createUploadUrl",
          payload,
          {
            type: "mutation",
            authToken: tokens.regular.token,
          },
        );

        const result = response[0]?.result?.data as
          | {
            bucket: string;
            storagePath: string;
            token: string;
            uploadUrl: string;
          }
          | undefined;

        assertExists(result, "Expected signed upload payload");
        assertEquals(result.bucket, "background-check-documents");
        assert(
          result.storagePath.includes(checkId),
          "Storage path should include background check identifier",
        );
        assert(
          result.uploadUrl.length > 0 && result.token.length > 0,
          "Signed URL metadata should be present",
        );
      },
    );
  },
});

Deno.test({
  name: "backgroundChecks.createUploadUrl rejects oversized files",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    await withSeededBackgroundCheck(tokens.regular.userId, {}, async ({ checkId }) => {
      const response = await callTRPCEndpoint(
        "backgroundChecks.createUploadUrl",
        {
          background_check_id: checkId,
          document_type: "dispute_supporting_1",
          file_name: "too-large.pdf",
          mime_type: "application/pdf",
          file_size: 25 * 1024 * 1024,
        },
        {
          type: "mutation",
          authToken: tokens.regular.token,
        },
      );

      const error = response[0]?.error;
      assertExists(error, "Expected BAD_REQUEST for oversized file");
      assertEquals(error?.data?.code, "BAD_REQUEST");
    });
  },
});

Deno.test({
  name: "backgroundChecks.requestCheck enforces consent for worker self-service",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const seedClient = createSeedClient();
    const slugSuffix = crypto.randomUUID().slice(0, 8);
    const typeId = crypto.randomUUID();
    const packageId = crypto.randomUUID();
    const pricingId = crypto.randomUUID();
    const tierKey = `tier-${slugSuffix}`;
    let createdCheckId: string | null = null;
    let createdPaymentIntentId: string | null = null;

    try {
      await seedClient
        .schema("core")
        .from("background_check_types")
        .insert({
          id: typeId,
          slug: `test-type-${slugSuffix}`,
          display_name: `Test Type ${slugSuffix}`,
          platform_cost_cents: 1200,
          retail_cost_cents: 2200,
          required_documents: [],
          metadata: {},
          provider_configuration: {},
        });

      await seedClient
        .schema("core")
        .from("background_check_packages")
        .insert({
          id: packageId,
          slug: `test-package-${slugSuffix}`,
          display_name: `Test Package ${slugSuffix}`,
          check_type_ids: [typeId],
          platform_cost_cents: 2200,
          retail_cost_cents: 3200,
          component_overrides: [],
          metadata: {},
          is_active: true,
        });

      await seedClient
        .schema("core")
        .from("service_pricing")
        .insert({
          id: pricingId,
          service_type: "background_check",
          tier: tierKey,
          name: `Test Tier ${slugSuffix}`,
          price_cents: 3200,
          is_active: true,
          display_order: 0,
          metadata: {},
        });

      const missingConsentResponse = await callTRPCEndpoint(
        "backgroundChecks.requestCheck",
        {
          package_id: packageId,
          tier: tierKey,
          paid_by: "worker",
          metadata: {},
        },
        {
          type: "mutation",
          authToken: tokens.regular.token,
        },
      );

      const missingConsentError = missingConsentResponse[0]?.error;
      assertExists(missingConsentError, "Expected consent error");
      assertEquals(missingConsentError.data?.code, "BAD_REQUEST");

      const consentTimestamp = new Date().toISOString();
      const response = await callTRPCEndpoint(
        "backgroundChecks.requestCheck",
        {
          package_id: packageId,
          tier: tierKey,
          paid_by: "worker",
          consent: {
            consent_signature: "Test Worker",
            consent_given_at: consentTimestamp,
            consent_ip_address: "127.0.0.1",
            consent_user_agent: "deno-test",
            disclosure_provided_at: consentTimestamp,
            summary_of_rights_provided_at: consentTimestamp,
          },
          metadata: {
            documents: [],
          },
        },
        {
          type: "mutation",
          authToken: tokens.regular.token,
        },
      );

      const session = response[0]?.result?.data as
        | {
          backgroundCheckId: string;
          paymentIntentId: string;
          clientSecret: string;
          amountCents: number;
        }
        | undefined;
      assertExists(session, "Expected payment session payload");

      createdCheckId = session.backgroundCheckId;
      createdPaymentIntentId = session.paymentIntentId;

      const { data: consentRows } = await seedClient
        .schema("core")
        .from("background_check_consent")
        .select("consent_text, metadata")
        .eq("background_check_id", session.backgroundCheckId);

      assertExists(consentRows, "Consent rows should be returned");
      assertEquals(consentRows.length, 1, "Only one consent record expected");
      assertEquals(
        consentRows[0]?.consent_text,
        "By proceeding you acknowledge that Scaffolded Trades will obtain a consumer report (background check) for employment purposes.\n\nYou have the right to request information about the nature and scope of any consumer report and dispute inaccurate information.",
      );
      const consentMetadata = consentRows[0]?.metadata as
        | Record<string, unknown>
        | undefined;
      assertExists(consentMetadata, "Consent metadata should be stored");
      assertEquals(consentMetadata?.consent_signature, "Test Worker");
      assertEquals(consentMetadata?.consent_source, "worker_self_service");
    } finally {
      if (createdPaymentIntentId) {
        await seedClient
          .schema("core")
          .from("payment_transactions")
          .delete()
          .eq("stripe_payment_intent_id", createdPaymentIntentId);
      }

      if (createdCheckId) {
        await seedClient
          .schema("core")
          .from("background_check_consent")
          .delete()
          .eq("background_check_id", createdCheckId);
        await seedClient
          .schema("core")
          .from("background_checks")
          .delete()
          .eq("id", createdCheckId);
      }

      await seedClient
        .schema("core")
        .from("service_pricing")
        .delete()
        .eq("id", pricingId);

      await seedClient
        .schema("core")
        .from("background_check_packages")
        .delete()
        .eq("id", packageId);

      await seedClient
        .schema("core")
        .from("background_check_types")
        .delete()
        .eq("id", typeId);
    }
  },
});

Deno.test({
  name: "backgroundChecks.submitDispute persists dispute and updates status",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    await withSeededBackgroundCheck(
      tokens.regular.userId,
      { status: "completed_consider" },
      async ({ checkId, seedClient }) => {
        const response = await callTRPCEndpoint(
          "backgroundChecks.submitDispute",
          {
            background_check_id: checkId,
            dispute_reason: "Records contain inaccurate findings",
            dispute_details: "County search returned incorrect conviction.",
            supporting_documents: [
              {
                document_type: "dispute_supporting_1",
                file_path: "user/check/document.pdf",
              },
            ],
          },
          {
            type: "mutation",
            authToken: tokens.regular.token,
          },
        );

        const result = response[0]?.result?.data as
          | { id: string; status: string }
          | undefined;
        assertExists(result, "Expected dispute payload");
        assertEquals(result.status, "pending");

        const { data: disputes } = await seedClient
          .schema("core")
          .from("background_check_disputes")
          .select("status, dispute_reason, supporting_documents")
          .eq("background_check_id", checkId);

        assertExists(disputes, "Dispute row should exist");
        assertEquals(disputes.length, 1);
        assertEquals(disputes[0]?.status, "pending");
        assertEquals(
          disputes[0]?.dispute_reason,
          "Records contain inaccurate findings",
        );

        const supportingDocuments = disputes[0]?.supporting_documents as
          | Array<Record<string, string>>
          | undefined;
        assertExists(
          supportingDocuments,
          "Supporting documents should be persisted",
        );
        assertEquals(supportingDocuments.length, 1);

        const { data: checkRows } = await seedClient
          .schema("core")
          .from("background_checks")
          .select("status, status_history")
          .eq("id", checkId)
          .maybeSingle();

        assertExists(checkRows, "Background check should still exist");
        assertEquals(checkRows.status, "disputed");
        assert(Array.isArray(checkRows.status_history), "Status history should be array");
        const hasDisputedHistory = (checkRows.status_history as unknown[]).some(
          (entry) =>
            entry &&
            typeof entry === "object" &&
            (entry as Record<string, unknown>).status === "disputed",
        );
        assert(hasDisputedHistory, "Status history should include disputed entry");
      },
    );
  },
});

Deno.test({
  name: "backgroundChecks.listDisputesForCheck returns worker dispute history",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    await withSeededBackgroundCheck(
      tokens.regular.userId,
      { status: "disputed" },
      async ({ checkId, seedClient }) => {
        const disputeId = crypto.randomUUID();
        const now = new Date().toISOString();

        await seedClient
          .schema("core")
          .from("background_check_disputes")
          .insert({
            id: disputeId,
            background_check_id: checkId,
            user_id: tokens.regular.userId,
            dispute_reason: "Information is outdated",
            dispute_details: "Records still show an expunged case.",
            supporting_documents: [],
            status: "pending",
            created_at: now,
            updated_at: now,
          });

        const response = await callTRPCEndpoint(
          "backgroundChecks.listDisputesForCheck",
          { background_check_id: checkId },
          {
            authToken: tokens.regular.token,
          },
        );

        const disputes = response[0]?.result?.data as
          | Array<Record<string, unknown>>
          | undefined;

        assertExists(disputes, "Expected dispute listing");
        assert(disputes.length >= 1, "At least one dispute should be returned");
        const firstDispute = disputes[0];
        assertEquals(firstDispute?.dispute_reason, "Information is outdated");
        assertEquals(firstDispute?.status, "pending");
      },
    );
  },
});
