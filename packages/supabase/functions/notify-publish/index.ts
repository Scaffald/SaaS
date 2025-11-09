import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { ZodError } from "zod";

import { corsHeaders, createCorsResponse } from "../_shared/cors.ts";
import {
  createServiceSupabaseClient,
  filterDigestChannels,
  filterImmediateChannels,
  getDeviceTokens,
  getDigestBucket,
  getUserContacts,
  getUserPreferences,
  mergeChannelSets,
  planRouting,
  enqueueDelivery,
  upsertDigestQueue,
  insertNotification,
  ensureChannelArray,
} from "../_shared/notifications/utils.ts";
import {
  notificationEventSchema,
  NotificationChannel,
} from "../_shared/notifications/types.ts";

interface PublishResult {
  recipientId: string;
  notificationId?: string;
  queuedChannels?: NotificationChannel[];
  digestChannels?: NotificationChannel[];
  skippedChannels?: NotificationChannel[];
  status: "queued" | "duplicate" | "error";
  error?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return createCorsResponse("ok");
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let payload: unknown;

  try {
    payload = await req.json();
  } catch (error) {
    return jsonResponse({ error: "Invalid JSON payload", details: `${error}` }, 400);
  }

  let event;

  try {
    event = notificationEventSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse({ error: "Invalid payload", issues: error.issues }, 400);
    }
    return jsonResponse({ error: "Failed to parse payload" }, 400);
  }

  const supabase = createServiceSupabaseClient();
  const now = new Date();
  const timezone = event.timezone ?? "UTC";
  const results: PublishResult[] = [];

  for (const recipientId of event.recipients) {
    try {
      const dedupeKey = event.dedupeKey ?? `${event.id}:${recipientId}`;

      if (dedupeKey) {
        const existing = await supabase
          .schema("core")
          .from("notifications")
          .select("id")
          .eq("dedupe_key", dedupeKey)
          .maybeSingle();

        if (existing.data) {
          results.push({
            recipientId,
            notificationId: existing.data.id,
            status: "duplicate",
          });
          continue;
        }
      }

      const { resolved: preferences } = await getUserPreferences(
        supabase,
        recipientId,
      );

      const contacts = await getUserContacts(supabase, recipientId);
      const devices = await getDeviceTokens(supabase, recipientId);

      const routingPlan = planRouting(
        event,
        preferences,
        {
          in_app: true,
          email: Boolean(contacts.email),
          sms: Boolean(contacts.phone),
          push: devices.length > 0,
        },
        timezone,
        now,
      );

      const routedChannels = mergeChannelSets(routingPlan);
      const message = event.message ?? event.preview ?? event.title;

      const notification = await insertNotification(supabase, {
        user_id: recipientId,
        type: event.type,
        severity: event.severity,
        title: event.title,
        message,
        preview: event.preview ?? message,
        body: event.body ?? {},
        metadata: event.metadata ?? {},
        dedupe_key: dedupeKey,
        cta_label: event.cta?.label ?? null,
        cta_url: event.cta?.url ?? null,
        routed_channels: routedChannels,
      }, dedupeKey);

      if (!notification) {
        results.push({
          recipientId,
          status: "error",
          error: "Failed to insert notification",
        });
        continue;
      }

      const immediateChannels = filterImmediateChannels(routingPlan);
      const digestChannels = filterDigestChannels(routingPlan);

      const nextAttempt = event.sendAfter
        ? new Date(event.sendAfter)
        : null;

      if (immediateChannels.includes("email") && contacts.email) {
        await enqueueDelivery(supabase, notification.id, "email", "sendgrid", {
          email: contacts.email,
          subject: event.title,
          templateData: event.body ?? {},
          metadata: event.metadata ?? {},
        }, nextAttempt);
      }

      if (immediateChannels.includes("sms") && contacts.phone) {
        await enqueueDelivery(supabase, notification.id, "sms", "twilio", {
          phone: contacts.phone,
          body: message,
        }, nextAttempt);
      }

      if (immediateChannels.includes("push") && devices.length > 0) {
        for (const device of devices) {
          await enqueueDelivery(supabase, notification.id, "push", "expo", {
            token: device.token,
            platform: device.platform,
            data: event.body ?? {},
            title: event.title,
            body: message,
            url: event.cta?.url,
            ...device.metadata,
          }, nextAttempt);
        }
      }

      if (digestChannels.length > 0) {
        const bucket = getDigestBucket(
          routingPlan.effectiveFrequency,
          now,
          timezone,
        );

        await upsertDigestQueue(
          supabase,
          recipientId,
          notification.type,
          bucket,
          ensureChannelArray(digestChannels),
          event,
        );
      }

      results.push({
        recipientId,
        notificationId: notification.id,
        queuedChannels: immediateChannels,
        digestChannels,
        skippedChannels: routingPlan.disabled,
        status: "queued",
      });
    } catch (error) {
      console.error("Failed to process notification recipient", error);
      results.push({
        recipientId,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return jsonResponse({ ok: true, count: results.length, results });
});
