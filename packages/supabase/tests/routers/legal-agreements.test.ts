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
  name: "legalAgreements.createHireAgreement creates agreement record",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const seedClient = createSeedClient();
    const orgId = crypto.randomUUID();
    const workerId = tokens.regular.userId;
    const slugSuffix = crypto.randomUUID().slice(0, 8);

    try {
      // Create test organization
      await seedClient
        .schema("core")
        .from("organizations")
        .insert({
          id: orgId,
          owner_user_id: tokens.regular.userId,
          name: `Test Org ${slugSuffix}`,
          slug: `test-org-${slugSuffix}`,
        });

      // Add user as org member
      const { data: role } = await seedClient
        .schema("core")
        .from("roles")
        .select("id")
        .eq("name", "org_admin")
        .eq("scope", "organization")
        .maybeSingle();

      if (role) {
        await seedClient
          .schema("core")
          .from("role_assignments")
          .insert({
            role_id: role.id,
            user_id: tokens.regular.userId,
            scope_org_id: orgId,
          });
      }

      const response = await callTRPCEndpoint(
        "legalAgreements.createHireAgreement",
        {
          organizationId: orgId,
          workerUserId: workerId,
          termsAccepted: true,
          antiCircumventionAccepted: true,
        },
        {
          type: "mutation",
          authToken: tokens.regular.token,
        },
      );

      const result = response[0]?.result?.data as
        | { id: string; organizationId: string; status: string }
        | undefined;

      assertExists(result, "Expected hire agreement response");
      assertExists(result.id);
      assertEquals(result.organizationId, orgId);
      assertEquals(result.status, "active");

      // Verify agreement was created in database
      const { data: agreement } = await seedClient
        .schema("core")
        .from("hire_agreements")
        .select("*")
        .eq("id", result.id)
        .maybeSingle();

      assertExists(agreement, "Agreement should exist in database");
      assertEquals(agreement.organization_id, orgId);
      assertEquals(agreement.worker_user_id, workerId);
      assertEquals(agreement.terms_accepted, true);
      assertEquals(agreement.anti_circumvention_accepted, true);
    } finally {
      await seedClient
        .schema("core")
        .from("hire_agreements")
        .delete()
        .eq("organization_id", orgId);

      await seedClient
        .schema("core")
        .from("role_assignments")
        .delete()
        .eq("scope_org_id", orgId);

      await seedClient
        .schema("core")
        .from("organizations")
        .delete()
        .eq("id", orgId);
    }
  },
});

Deno.test({
  name: "legalAgreements.reportViolation creates report and marks agreement as violated",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const seedClient = createSeedClient();
    const orgId = crypto.randomUUID();
    const workerId = tokens.regular.userId;
    const slugSuffix = crypto.randomUUID().slice(0, 8);
    let agreementId: string | null = null;

    try {
      // Create test organization
      await seedClient
        .schema("core")
        .from("organizations")
        .insert({
          id: orgId,
          owner_user_id: tokens.regular.userId,
          name: `Test Org ${slugSuffix}`,
          slug: `test-org-${slugSuffix}`,
        });

      // Create hire agreement
      const { data: agreement } = await seedClient
        .schema("core")
        .from("hire_agreements")
        .insert({
          organization_id: orgId,
          worker_user_id: workerId,
          agreement_text: "Test agreement",
          agreement_version: "1.0",
          agreed_by_user_id: tokens.regular.userId,
          terms_accepted: true,
          anti_circumvention_accepted: true,
        })
        .select("id")
        .maybeSingle();

      assertExists(agreement, "Agreement should be created");
      agreementId = agreement.id;

      const response = await callTRPCEndpoint(
        "legalAgreements.reportViolation",
        {
          organizationId: orgId,
          workerUserId: workerId,
          hireAgreementId: agreementId,
          violationType: "off_platform_hire",
          description: "Test violation report - worker hired off-platform",
        },
        {
          type: "mutation",
          authToken: tokens.regular.token,
        },
      );

      const result = response[0]?.result?.data as
        | { id: string; status: string }
        | undefined;

      assertExists(result, "Expected violation report response");
      assertEquals(result.status, "pending");

      // Verify agreement was marked as violated
      const { data: updatedAgreement } = await seedClient
        .schema("core")
        .from("hire_agreements")
        .select("status, violated_at")
        .eq("id", agreementId)
        .maybeSingle();

      assertExists(updatedAgreement, "Agreement should exist");
      assertEquals(updatedAgreement.status, "violated");
      assertExists(updatedAgreement.violated_at);
    } finally {
      await seedClient
        .schema("core")
        .from("circumvention_reports")
        .delete()
        .eq("organization_id", orgId);

      if (agreementId) {
        await seedClient
          .schema("core")
          .from("hire_agreements")
          .delete()
          .eq("id", agreementId);
      }

      await seedClient
        .schema("core")
        .from("organizations")
        .delete()
        .eq("id", orgId);
    }
  },
});

Deno.test({
  name: "legalAgreements.listViolationReports returns paginated results",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "legalAgreements.listViolationReports",
      {
        limit: 10,
        offset: 0,
      },
      {
        type: "query",
        authToken: tokens.office.token,
      },
    );

    const result = response[0]?.result?.data as
      | { items: unknown[]; totalCount: number }
      | undefined;

    assertExists(result, "Expected violation reports list response");
    assert(Array.isArray(result.items));
    assert(typeof result.totalCount === "number");
  },
});

