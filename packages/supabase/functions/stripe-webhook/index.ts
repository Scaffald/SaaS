import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import Stripe from "stripe";

import { corsHeaders } from "../_shared/cors.ts";
import { createServiceSupabaseClient } from "../_shared/notifications/utils.ts";
import { handleStripeEvent, loadStripeSecretsWithClient } from "./handler.ts";

const STRIPE_API_VERSION = "2024-06-20";
const stripeHttpClient = Stripe.createFetchHttpClient();
const cryptoProvider = Stripe.createSubtleCryptoProvider();

interface StripeSecrets {
  apiKey: string;
  webhookSecret: string;
}

async function loadStripeSecrets(): Promise<StripeSecrets> {
  const supabase = createServiceSupabaseClient();
  return loadStripeSecretsWithClient(supabase);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  let secrets: StripeSecrets;
  try {
    secrets = await loadStripeSecrets();
  } catch (error) {
    console.error("[stripe-webhook] failed to load secrets", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? "secrets_unavailable" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const stripe = new Stripe(secrets.apiKey, {
    apiVersion: STRIPE_API_VERSION,
    httpClient: stripeHttpClient,
  });

  const signature = req.headers.get("Stripe-Signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature ?? "",
      secrets.webhookSecret,
      undefined,
      cryptoProvider,
    );
  } catch (error) {
    console.error("[stripe-webhook] signature verification failed", error);
    return new Response(
      JSON.stringify({ error: "invalid_signature" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  const supabase = createServiceSupabaseClient();

  try {
    await handleStripeEvent(supabase, event);
  } catch (error) {
    console.error("[stripe-webhook] event handling error", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? "event_handling_failed" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  return new Response(
    JSON.stringify({ received: true }),
    { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});

