/**
 * NevarMail delivery events (#1393, #1389).
 *
 * NevarMail identifies a message only by `email_id`, the id its send call
 * returned; payloads do not echo our metadata. So an event is matched by that
 * id: first to a worker invite (generic_invitations.nevarmail_email_id), then
 * to a notification delivery (notification_deliveries.provider_msg_id, which
 * #1389 sets for notifications sent through NevarMail).
 */
import type { NevarMailEmailEvent } from "../../_shared/nevarmail.ts";

// deno-lint-ignore no-explicit-any
// biome-ignore lint/suspicious/noExplicitAny: untyped Deno Supabase client (#477)
type Supabase = any;

export type InviteEventResult =
  | { matched: false }
  | { matched: true; invitationId: string; changed: string[] };

/** Invites expire after 30 days; nothing older is matched by recipient. */
const RECIPIENT_MATCH_DAYS = 30;

const FAILURE_TYPES = new Set([
  "email.bounced",
  "email.dropped",
  "email.complained",
]);

/**
 * Applies an `email.*` event to the invite it belongs to, if any. Opens and
 * clicks keep their FIRST time; a failure is recorded in metadata and leaves
 * the invite pending (the inviter can still send the link another way).
 */
export async function applyInviteEvent(
  supabase: Supabase,
  event: NevarMailEmailEvent,
): Promise<InviteEventResult> {
  const core = supabase.schema("core");
  const columns = "id, email_opened_at, email_clicked_at, metadata";
  let invite: {
    id: string;
    email_opened_at: string | null;
    email_clicked_at: string | null;
    metadata: Record<string, unknown> | null;
  } | null = null;

  if (event.email_id) {
    const { data, error } = await core
      .from("generic_invitations")
      .select(columns)
      .eq("nevarmail_email_id", event.email_id)
      .maybeSingle();
    if (error) throw new Error(`invite lookup failed: ${error.message}`);
    invite = data;
  }

  // NevarMail's v1 send returns the PROVIDER message id as `id`, but its
  // webhooks carry NevarMail's own sent-email UUID as `email_id` (seen live on
  // dev, 2026-11-26), so the id lookup above never matches today. Fall back to
  // the recipient: the newest invite emailed to that address that is still
  // pending and was sent within the last INVITE_TTL window.
  if (!invite && event.recipient) {
    const sentBefore = new Date(
      new Date(event.occurred_at || Date.now()).getTime() + 60_000,
    ).toISOString();
    const sentAfter = new Date(Date.now() - RECIPIENT_MATCH_DAYS * 86_400_000)
      .toISOString();
    const { data, error } = await core
      .from("generic_invitations")
      .select(columns)
      .eq("invitee_email", event.recipient.trim().toLowerCase())
      .eq("channel", "email")
      .eq("status", "pending")
      .not("email_sent_at", "is", null)
      .lte("email_sent_at", sentBefore)
      .gte("email_sent_at", sentAfter)
      .order("email_sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      throw new Error(`invite lookup by recipient failed: ${error.message}`);
    }
    invite = data;
  }
  if (!invite) return { matched: false };

  const at = event.occurred_at ?? new Date().toISOString();
  const updates: Record<string, unknown> = {};
  if (event.type === "email.opened" && !invite.email_opened_at) {
    updates.email_opened_at = at;
  }
  if (event.type === "email.clicked") {
    if (!invite.email_clicked_at) updates.email_clicked_at = at;
    // A click implies an open, even when the open pixel was blocked.
    if (!invite.email_opened_at) updates.email_opened_at = at;
  }
  if (FAILURE_TYPES.has(event.type)) {
    updates.metadata = {
      ...(invite.metadata ?? {}),
      delivery_failure: { type: event.type, reason: event.reason ?? null, at },
    };
  }

  const changed = Object.keys(updates);
  if (changed.length) {
    const { error: updateError } = await core
      .from("generic_invitations")
      .update(updates)
      .eq("id", invite.id);
    if (updateError) {
      throw new Error(`invite update failed: ${updateError.message}`);
    }
  }
  return { matched: true, invitationId: invite.id, changed };
}

export type DeliveryEventResult =
  | { matched: false; ignored?: boolean }
  | { matched: true; deliveryId: number; status: string | null };

type DeliveryMapping = {
  /** New delivery status, if the event changes it. */
  status?: "sent" | "delivered" | "bounce" | "blocked";
  /** notification_events kind recorded for the event. */
  event: "accepted" | "delivered" | "opened" | "clicked" | "bounce" | "complaint" | "failed";
  error?: boolean;
};

/**
 * NevarMail event → notification delivery. Opens, clicks, complaints and
 * deferrals are recorded as events without touching the status: a complaint
 * comes after delivery, and NevarMail retries a deferral itself.
 */
const DELIVERY_MAP: Partial<Record<NevarMailEmailEvent["type"], DeliveryMapping>> = {
  "email.sent": { status: "sent", event: "accepted" },
  "email.delivered": { status: "delivered", event: "delivered" },
  "email.opened": { event: "opened" },
  "email.clicked": { event: "clicked" },
  "email.bounced": { status: "bounce", event: "bounce", error: true },
  // Dropped = never attempted (suppressed or rejected before sending).
  "email.dropped": { status: "blocked", event: "failed", error: true },
  "email.complained": { event: "complaint", error: true },
  "email.deferred": { event: "accepted" },
};

/** Statuses a late `email.sent` may still advance; it never undoes `delivered`. */
const SENT_FROM = new Set(["queued", "sending"]);

/**
 * Applies an `email.*` event to the notification delivery whose
 * provider_msg_id is the event's `email_id` (#1389). Matching by id only:
 * a delivery row has no recipient address to fall back on.
 */
export async function applyDeliveryEvent(
  supabase: Supabase,
  event: NevarMailEmailEvent,
): Promise<DeliveryEventResult> {
  const mapping = DELIVERY_MAP[event.type];
  if (!mapping) return { matched: false, ignored: true };
  if (!event.email_id) return { matched: false };

  const core = supabase.schema("core");
  const { data: delivery, error } = await core
    .from("notification_deliveries")
    .select("id, notification_id, channel, status")
    .eq("provider_msg_id", event.email_id)
    .maybeSingle();
  if (error) throw new Error(`delivery lookup failed: ${error.message}`);
  if (!delivery) return { matched: false };

  let status: string | null = null;
  if (
    mapping.status &&
    (mapping.status !== "sent" || SENT_FROM.has(delivery.status))
  ) {
    status = mapping.status;
    const { error: updateError } = await core
      .from("notification_deliveries")
      .update({
        status,
        last_error: mapping.error
          ? (event.reason ?? `NevarMail reported ${event.type}`)
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", delivery.id);
    if (updateError) {
      throw new Error(`delivery update failed: ${updateError.message}`);
    }
  }

  const { error: eventError } = await core.from("notification_events").insert({
    notification_id: delivery.notification_id,
    delivery_id: delivery.id,
    channel: delivery.channel,
    event: mapping.event,
    ...(event.occurred_at ? { occurred_at: event.occurred_at } : {}),
    meta: {
      provider: "nevarmail",
      type: event.type,
      ...(event.url ? { url: event.url } : {}),
      ...(event.reason ? { reason: event.reason } : {}),
    },
  });
  if (eventError) {
    throw new Error(`delivery event insert failed: ${eventError.message}`);
  }
  return { matched: true, deliveryId: delivery.id, status };
}
