import Stripe from "stripe";

export type PaymentTransactionRow = {
  id: string;
  stripe_payment_intent_id: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
  succeeded_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
};

export type StripeSettingsRow = {
  api_key_secret_id: string | null;
  webhook_secret_id: string | null;
};

type SupabaseError = { message: string } | null;

type SupabaseSelectResult<T> = Promise<{ data: T | null; error: SupabaseError }>;

type SupabaseUpdateResult = Promise<{ error: SupabaseError }>;

export interface StripeWebhookSupabaseClient {
  schema(schema: string): {
    from(table: "stripe_settings"): {
      select(columns: string): {
        eq(column: string, value: unknown): SupabaseSelectResult<StripeSettingsRow> & {
          maybeSingle(): SupabaseSelectResult<StripeSettingsRow>;
        };
      };
    };
    from(table: "payment_transactions"): {
      select(columns: string): {
        eq(column: string, value: unknown): SupabaseSelectResult<PaymentTransactionRow> & {
          maybeSingle(): SupabaseSelectResult<PaymentTransactionRow>;
        };
      };
      update(values: Record<string, unknown>): {
        eq(column: string, value: unknown): SupabaseUpdateResult;
      };
    };
    rpc(functionName: string, payload: Record<string, unknown>): Promise<{ data: string | null; error: SupabaseError }>;
  };
}

export interface StripeSecrets {
  apiKey: string;
  webhookSecret: string;
}

export async function loadStripeSecretsWithClient(
  supabase: StripeWebhookSupabaseClient,
): Promise<StripeSecrets> {
  const { data: settings, error } = await supabase
    .schema("core")
    .from("stripe_settings")
    .select("api_key_secret_id, webhook_secret_id")
    .eq("settings_name", "stripe")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load stripe settings: ${error.message}`);
  }

  if (!settings?.api_key_secret_id) {
    throw new Error("Stripe API key is not configured");
  }

  if (!settings?.webhook_secret_id) {
    throw new Error("Stripe webhook secret is not configured");
  }

  const [{ data: apiKey, error: apiKeyError }, { data: webhookSecret, error: webhookError }] =
    await Promise.all([
      supabase.schema("core").rpc("get_secret_value", { p_secret_id: settings.api_key_secret_id }),
      supabase.schema("core").rpc("get_secret_value", { p_secret_id: settings.webhook_secret_id }),
    ]);

  if (apiKeyError || !apiKey) {
    throw new Error(apiKeyError ? `Failed to read API key: ${apiKeyError.message}` : "Stripe API key secret missing");
  }

  if (webhookError || !webhookSecret) {
    throw new Error(
      webhookError ? `Failed to read webhook secret: ${webhookError.message}` : "Stripe webhook secret missing",
    );
  }

  return { apiKey, webhookSecret };
}

export async function getTransactionByIntent(
  supabase: StripeWebhookSupabaseClient,
  intentId: string,
): Promise<PaymentTransactionRow | null> {
  const { data, error } = await supabase
    .schema("core")
    .from("payment_transactions")
    .select("*")
    .eq("stripe_payment_intent_id", intentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load payment transaction: ${error.message}`);
  }

  return data ?? null;
}

export function mergeMetadata(current: Record<string, unknown> | null, updates: Record<string, unknown>) {
  return {
    ...(current ?? {}),
    ...updates,
  };
}

export async function updateTransaction(
  supabase: StripeWebhookSupabaseClient,
  intent: Stripe.PaymentIntent,
  event: Stripe.Event,
  status: "succeeded" | "failed" | "cancelled",
  failureReason?: string | null,
) {
  const existing = await getTransactionByIntent(supabase, intent.id);

  if (!existing) {
    console.warn("[stripe-webhook] payment transaction not found", { intentId: intent.id });
    return;
  }

  const currentMetadata = (existing.metadata ?? {}) as Record<string, unknown>;
  if (currentMetadata.last_stripe_event_id === event.id) {
    return;
  }

  const nowIso = new Date().toISOString();
  const updates: Record<string, unknown> = {
    status,
    metadata: mergeMetadata(currentMetadata, {
      last_stripe_event_id: event.id,
      last_stripe_event_type: event.type,
      last_stripe_event_at: new Date(event.created * 1000).toISOString(),
    }),
  };

  if (status === "succeeded") {
    updates.succeeded_at = new Date(intent.created * 1000).toISOString();
    updates.failed_at = null;
    updates.failure_reason = null;
  } else if (status === "failed") {
    updates.failed_at = nowIso;
    updates.failure_reason = failureReason ?? intent.last_payment_error?.message ?? null;
  } else if (status === "cancelled") {
    updates.failed_at = updates.failed_at ?? nowIso;
    updates.failure_reason = failureReason ?? intent.cancellation_reason ?? "cancelled";
  }

  const { error } = await supabase
    .schema("core")
    .from("payment_transactions")
    .update(updates)
    .eq("id", existing.id);

  if (error) {
    throw new Error(`Failed to update payment transaction: ${error.message}`);
  }
}

export async function handleStripeEvent(supabase: StripeWebhookSupabaseClient, event: Stripe.Event) {
  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      await updateTransaction(supabase, intent, event, "succeeded");
      break;
    }
    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const failure = intent.last_payment_error?.message ?? "Payment failed";
      await updateTransaction(supabase, intent, event, "failed", failure);
      break;
    }
    case "payment_intent.canceled": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const failure = intent.cancellation_reason ?? "cancelled";
      await updateTransaction(supabase, intent, event, "cancelled", failure);
      break;
    }
    default:
      console.warn("[stripe-webhook] unhandled event type", event.type);
  }
}
