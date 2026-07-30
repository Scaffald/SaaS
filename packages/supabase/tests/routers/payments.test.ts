/// <reference lib="deno.ns" />

import { assert, assertEquals, assertExists } from '../shared/assert.ts';
import { createSeedClient } from '../shared/seeding.ts';
import {
  callTRPCEndpoint,
  loadCachedTokens,
} from '../shared/setup.ts';
import { requireAuthSetup } from '../shared/test-context.ts';

if (!Deno.env.get("STRIPE_MOCK_MODE")) {
  Deno.env.set("STRIPE_MOCK_MODE", "1");
}

/*
 * These suites referenced `tokens.office`, a persona that does not exist:
 * CachedTokens only ever carries `regular` and `admin`, and nothing creates an
 * office user. So they never type-checked and never ran. Repointed by intent
 * rather than uniformly — the ownership tests need a plain user who owns the
 * org (`regular`), while adminGetAnalytics/adminListTransactions need an
 * admin caller (`admin`). If a distinct employer persona is wanted later, add
 * it to TEST_USERS and the auth setup rather than reintroducing a token that
 * is never populated.
 */

Deno.test({
  name: "payments.getAccountCredits returns zero balance for new organization",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const seedClient = createSeedClient();
    const orgId = crypto.randomUUID();
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
        "payments.getAccountCredits",
        {
          organizationId: orgId,
        },
        {
          type: "query",
          authToken: tokens.regular.token,
        },
      );

      const result = response[0]?.result?.data as
        | { balanceCents: number; currency: string }
        | undefined;

      assertExists(result, "Expected account credits response");
      assertEquals(result.balanceCents, 0);
      assertEquals(result.currency, "usd");
    } finally {
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
  name: "payments.depositCredits creates payment intent and records transaction",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const seedClient = createSeedClient();
    const orgId = crypto.randomUUID();
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

      const response = await callTRPCEndpoint(
        "payments.depositCredits",
        {
          organizationId: orgId,
          amountCents: 5000,
        },
        {
          type: "mutation",
          authToken: tokens.regular.token,
        },
      );

      const result = response[0]?.result?.data as
        | { paymentIntentId: string; clientSecret: string; status: string }
        | undefined;

      assertExists(result, "Expected deposit response");
      assert(result.paymentIntentId.startsWith("seti_") || result.paymentIntentId.startsWith("pi_"));
      assertExists(result.clientSecret);
      assertExists(result.status);

      // Verify transaction was recorded
      const { data: transaction } = await seedClient
        .schema("core")
        .from("payment_transactions")
        .select("*")
        .eq("organization_id", orgId)
        .eq("transaction_type", "credit_deposit")
        .maybeSingle();

      assertExists(transaction, "Transaction should be recorded");
      assertEquals(transaction.amount_cents, 5000);
    } finally {
      await seedClient
        .schema("core")
        .from("payment_transactions")
        .delete()
        .eq("organization_id", orgId);

      await seedClient
        .schema("core")
        .from("organizations")
        .delete()
        .eq("id", orgId);
    }
  },
});

Deno.test({
  name: "payments.getCreditLedger returns empty list for new organization",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const seedClient = createSeedClient();
    const orgId = crypto.randomUUID();
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
        "payments.getCreditLedger",
        {
          organizationId: orgId,
        },
        {
          type: "query",
          authToken: tokens.regular.token,
        },
      );

      const result = response[0]?.result?.data as
        | { items: unknown[]; totalCount: number }
        | undefined;

      assertExists(result, "Expected credit ledger response");
      assertEquals(result.items.length, 0);
      assertEquals(result.totalCount, 0);
    } finally {
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
  name: "payments.applyCreditsToPayment prevents negative balance",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const seedClient = createSeedClient();
    const orgId = crypto.randomUUID();
    const slugSuffix = crypto.randomUUID().slice(0, 8);

    try {
      // Create test organization with credits
      await seedClient
        .schema("core")
        .from("organizations")
        .insert({
          id: orgId,
          owner_user_id: tokens.regular.userId,
          name: `Test Org ${slugSuffix}`,
          slug: `test-org-${slugSuffix}`,
        });

      // Create account with 1000 cents balance
      await seedClient
        .schema("core")
        .from("account_credits")
        .insert({
          organization_id: orgId,
          balance_cents: 1000,
          currency: "usd",
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

      // Try to withdraw more than available (should fail)
      const response = await callTRPCEndpoint(
        "payments.applyCreditsToPayment",
        {
          organizationId: orgId,
          amountCents: 2000, // More than available
          transactionType: "background_check",
          description: "Test withdrawal",
        },
        {
          type: "mutation",
          authToken: tokens.regular.token,
        },
      );

      const error = response[0]?.result?.error;
      assertExists(error, "Expected error for insufficient credits");
      assert(
        error.message.includes("Insufficient credits") ||
          error.message.includes("balance"),
        "Error should mention insufficient credits",
      );
    } finally {
      await seedClient
        .schema("core")
        .from("credit_ledger")
        .delete()
        .eq("organization_id", orgId);

      await seedClient
        .schema("core")
        .from("account_credits")
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
  name: "payments.adminGetAnalytics returns KPIs and breakdowns",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "payments.adminGetAnalytics",
      undefined,
      {
        type: "query",
        authToken: tokens.admin.token,
      },
    );

    const result = response[0]?.result?.data as
      | {
          kpis: {
            totalRevenue: number;
            totalTransactions: number;
            successRate: number;
          };
          breakdowns: {
            byType: Record<string, unknown>;
            byStatus: Record<string, unknown>;
          };
        }
      | undefined;

    assertExists(result, "Expected analytics response");
    assertExists(result.kpis);
    assertExists(result.breakdowns);
    assert(typeof result.kpis.totalRevenue === "number");
    assert(typeof result.kpis.totalTransactions === "number");
    assert(typeof result.kpis.successRate === "number");
  },
});

Deno.test({
  name: "payments.adminListTransactions returns paginated results",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "payments.adminListTransactions",
      {
        limit: 10,
        offset: 0,
      },
      {
        type: "query",
        authToken: tokens.admin.token,
      },
    );

    const result = response[0]?.result?.data as
      | { items: unknown[]; totalCount: number }
      | undefined;

    assertExists(result, "Expected transactions list response");
    assert(Array.isArray(result.items));
    assert(typeof result.totalCount === "number");
  },
});

