/// <reference lib="deno.ns" />

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

Deno.test({
  name: "idVerification.requestVerification + confirm flow issues badge record",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const seedClient = createSeedClient();
    const pricingId = crypto.randomUUID();
    const slugSuffix = crypto.randomUUID().slice(0, 8);

    try {
      await seedClient
        .schema("core")
        .from("service_pricing")
        .insert({
          id: pricingId,
          service_type: "id_verification",
          tier: `idv-tier-${slugSuffix}`,
          name: `ID Verification ${slugSuffix}`,
          description: "Test verification pricing row",
          price_cents: 3500,
          is_active: true,
        });

      const requestResponse = await callTRPCEndpoint(
        "idVerification.requestVerification",
        {
          workerUserId: tokens.regular.userId,
          pricingId,
        },
        {
          type: "mutation",
          authToken: tokens.regular.token,
        },
      );

      const requestResult = requestResponse[0]?.result?.data as
        | { paymentIntentId: string; clientSecret: string }
        | undefined;

      assertExists(requestResult, "Expected payment session payload");
      assert(requestResult.paymentIntentId.startsWith("pi_"));
      assert(requestResult.clientSecret.startsWith("cs_"));

      const confirmResponse = await callTRPCEndpoint(
        "idVerification.confirmVerificationPayment",
        {
          paymentIntentId: requestResult.paymentIntentId,
        },
        {
          type: "mutation",
          authToken: tokens.regular.token,
        },
      );

      const confirmResult = confirmResponse[0]?.result?.data as
        | { id: string; badgeStatus: string }
        | undefined;

      assertExists(confirmResult, "Expected confirmed verification record");
      assertEquals(confirmResult.badgeStatus, "active");

      const { data: verificationRecord } = await seedClient
        .schema("core")
        .from("id_verifications")
        .select("*")
        .eq("id", confirmResult.id)
        .maybeSingle();

      assertExists(verificationRecord, "Verification record should exist");
      assertEquals(verificationRecord.worker_user_id, tokens.regular.userId);
      assertEquals(verificationRecord.badge_status, "active");
      assertEquals(typeof verificationRecord.badge_expires_at, "string");
      assert(
        typeof verificationRecord.persona_status === "string" &&
          verificationRecord.persona_status.length > 0,
        "Persona status should be recorded",
      );
    } finally {
      await seedClient.schema("core").from("id_verifications").delete()
        .eq("worker_user_id", tokens?.regular.userId ?? "");
      await seedClient.schema("core").from("service_pricing").delete().eq("id", pricingId);
    }
  },
});

