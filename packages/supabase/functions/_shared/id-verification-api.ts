/**
 * Shared ID verification API logic for REST and tRPC
 * Extracted from trpc/routers/id-verification.router.ts
 */

import type Stripe from "stripe";

// One Stripe API version for every caller (#1259, #454): defined once in
// payments/stripe-client.ts, also passed to configure_stripe_server.
import { STRIPE_API_VERSION } from "./payments/stripe-client.ts";

let StripeClass: typeof import("stripe").default | null = null;

async function getStripeClass(): Promise<typeof import("stripe").default> {
  if (!StripeClass) {
    const stripeModule = await import("stripe");
    StripeClass = stripeModule.default;
  }
  return StripeClass;
}

async function getStripeHttpClient() {
  const Stripe = await getStripeClass();
  return Stripe.createFetchHttpClient();
}

const mockStripePaymentIntents = new Map<
  string,
  {
    amount: number;
    currency: string;
    clientSecret: string;
    metadata: Record<string, unknown>;
  }
>();

function stripeMockEnabled(): boolean {
  return typeof Deno !== "undefined" &&
    Deno.env.get("STRIPE_MOCK_MODE") === "1";
}

function createMockStripeClient(): Stripe {
  return {
    paymentIntents: {
      create: async (payload: Stripe.PaymentIntentCreateParams) => {
        const id = `pi_${crypto.randomUUID()}`;
        const clientSecret = `cs_${crypto.randomUUID()}`;
        mockStripePaymentIntents.set(id, {
          amount: payload.amount ?? 0,
          currency: payload.currency ?? "usd",
          clientSecret,
          metadata: (payload.metadata as Record<string, unknown>) ?? {},
        });
        return {
          id,
          amount: payload.amount ?? 0,
          currency: payload.currency ?? "usd",
          client_secret: clientSecret,
          metadata: payload.metadata ?? {},
          status: "requires_confirmation",
          created: Math.floor(Date.now() / 1000),
          object: "payment_intent",
        } as Stripe.PaymentIntent;
      },
      retrieve: async (paymentIntentId: string) => {
        const stored = mockStripePaymentIntents.get(paymentIntentId);
        if (!stored) throw new Error("Mock payment intent not found");
        return {
          id: paymentIntentId,
          amount: stored.amount,
          currency: stored.currency,
          client_secret: stored.clientSecret,
          metadata: stored.metadata,
          status: "succeeded",
          created: Math.floor(Date.now() / 1000),
          object: "payment_intent",
        } as Stripe.PaymentIntent;
      },
    },
  } as unknown as Stripe;
}

// PromiseLike throughout: supabase-js query builders are thenables, not Promises.
type SupabaseQueryBuilder = PromiseLike<{ data: unknown; error: unknown }> & {
  maybeSingle: () => PromiseLike<{ data: unknown; error: unknown }>;
};

type SupabaseLike = {
  schema: (s: string) => {
    from: (t: string) => {
      select: (
        cols: string,
      ) => { eq: (k: string, v: string) => SupabaseQueryBuilder };
    };
    // PromiseLike, not Promise: supabase-js returns a thenable builder here.
    rpc: (
      name: string,
      params: Record<string, string>,
    ) => PromiseLike<{ data: unknown; error: unknown }>;
  };
};

/**
 * The Stripe secret key from Vault, or null when none is configured.
 * Throws only when the lookup itself fails.
 */
async function loadStripeSecret(
  supabaseAdmin: SupabaseLike,
): Promise<string | null> {
  if (!supabaseAdmin) throw new Error("Admin client not available");

  const { data: settings, error } = await supabaseAdmin
    .schema("core")
    .from("stripe_settings")
    .select("api_key_secret_id")
    .eq("settings_name", "stripe")
    .maybeSingle() as {
      data: { api_key_secret_id: string } | null;
      error: { message: string } | null;
    };

  if (error) {
    throw new Error(`Failed to load Stripe settings: ${error.message}`);
  }
  if (!settings?.api_key_secret_id) return null;

  const { data: secretValue, error: secretError } = await supabaseAdmin
    .schema("core")
    .rpc("get_secret_value", { p_secret_id: settings.api_key_secret_id });

  if (secretError) {
    throw new Error(
      `Failed to load Stripe secret: ${
        (secretError as { message: string }).message
      }`,
    );
  }
  return (secretValue as string | null) || null;
}

export type StripeMode = "mock" | "test" | "live" | "unconfigured";

/**
 * Which kind of money a charge made right now would move.
 *
 * `test` only for a key Stripe itself marks as test (`sk_test_`/`rk_test_`).
 * Anything else that is configured counts as `live`, so an unfamiliar key
 * format fails closed rather than being mistaken for practice money.
 */
export async function loadStripeMode(
  supabaseAdmin: SupabaseLike,
): Promise<StripeMode> {
  if (stripeMockEnabled()) return "mock";
  const secret = await loadStripeSecret(supabaseAdmin);
  if (!secret) return "unconfigured";
  return /^(sk|rk)_test_/.test(secret) ? "test" : "live";
}

export async function loadStripeClient(
  supabaseAdmin: SupabaseLike,
): Promise<Stripe> {
  if (stripeMockEnabled()) return createMockStripeClient();

  const secretValue = await loadStripeSecret(supabaseAdmin);
  if (!secretValue) {
    throw new Error("Stripe API key is not configured.");
  }

  const Stripe = await getStripeClass();
  return new Stripe(secretValue, {
    apiVersion: STRIPE_API_VERSION,
    httpClient: await getStripeHttpClient(),
  });
}

export async function userHasPlatformRole(
  supabaseAdmin: SupabaseLike,
  userId: string,
): Promise<boolean> {
  type RoleRow = { role?: { scope?: string; name?: string | null } | null };
  const { data, error } = (await supabaseAdmin
    .schema("core")
    .from("role_assignments")
    .select("role:roles(name, scope)")
    .eq("user_id", userId)) as {
      data: RoleRow[] | null;
      error: { message: string } | null;
    };

  if (error) {
    throw new Error(`Unable to verify platform roles: ${error.message}`);
  }
  return Boolean(
    data?.some(
      (a) =>
        a.role?.scope === "platform" &&
        ["office", "super_admin"].includes(a.role?.name ?? ""),
    ),
  );
}

export async function ensureCanRequestForWorker(
  supabaseAdmin: SupabaseLike,
  userId: string,
  workerUserId: string,
): Promise<void> {
  if (!userId) throw new Error("UNAUTHORIZED");
  if (userId === workerUserId) return;
  const hasPlatform = await userHasPlatformRole(supabaseAdmin, userId);
  if (!hasPlatform) {
    throw new Error(
      "You are not allowed to request verification for this worker.",
    );
  }
}

export async function createPersonaInquiry(
  workerUserId: string,
): Promise<{ inquiryId: string; status: string }> {
  const apiKey = Deno.env.get("PERSONA_API_KEY");
  const templateId = Deno.env.get("PERSONA_TEMPLATE_ID");
  if (!apiKey || !templateId) {
    return { inquiryId: `persona_${crypto.randomUUID()}`, status: "pending" };
  }
  const response = await fetch("https://withpersona.com/api/v1/inquiries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "inquiry",
        attributes: { template_id: templateId, reference_id: workerUserId },
      },
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Persona inquiry creation failed: ${await response.text()}`,
    );
  }
  const json = await response.json();
  return {
    inquiryId: json?.data?.id ?? `persona_${crypto.randomUUID()}`,
    status: json?.data?.attributes?.status ?? "pending",
  };
}

export function addSixMonths(base: Date): Date {
  const expiry = new Date(base);
  expiry.setMonth(expiry.getMonth() + 6);
  return expiry;
}
