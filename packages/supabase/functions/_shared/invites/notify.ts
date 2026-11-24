/**
 * Telling an inviter their invite worked (#1397).
 *
 * - "joined": when a new account is credited to their invite (POST
 *   /v1/invites/claim).
 * - "onboarded": when that person finishes onboarding (POST
 *   /v1/prerequisites/complete), which also stamps referral_attributions.
 *
 * Both are in-app notifications de-duplicated per referred user, so a retry
 * or a second claim can never notify twice. Callers treat failures as
 * non-fatal: the claim or the onboarding must not fail because a
 * notification couldn't be written.
 */
import { insertNotification } from "../notifications/utils.ts";
import type { NotificationSupabaseClient } from "../notifications/types.ts";

// deno-lint-ignore no-explicit-any
// biome-ignore lint/suspicious/noExplicitAny: untyped Deno Supabase client (#477)
type Supabase = any;

/** Where the notification's button goes: the inviter's invite screen. */
export const INVITES_SCREEN_PATH = "/dashboard/invite";

export function firstNameOf(name: string | null | undefined): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first && first.length > 0 ? first : null;
}

export async function notifyReferrerJoined(
  db: Supabase,
  opts: {
    referrerId: string;
    newUserId: string;
    /** Best name we have at claim time: the invite's name, else the account's. */
    name: string | null;
    invitationId: string | null;
  },
): Promise<void> {
  const who = firstNameOf(opts.name);
  await insertNotification(
    db as NotificationSupabaseClient,
    {
      user_id: opts.referrerId,
      // Added to core.notification_type in migration 400.
      type: "referral.joined" as never,
      severity: "info",
      title: who
        ? `${who} joined Scaffald`
        : "Someone you invited joined Scaffald",
      message: who
        ? `${who} joined from your invite.`
        : "Someone joined Scaffald from your invite.",
      cta_label: "See your invites",
      cta_url: INVITES_SCREEN_PATH,
      metadata: {
        referred_user_id: opts.newUserId,
        invitation_id: opts.invitationId,
      },
    },
    `referral.joined:${opts.newUserId}`,
  );
}

/**
 * Stamps onboarded_at on the user's attribution (first time only) and tells
 * the referrer. Returns whether there was an attribution to stamp.
 */
export async function markReferralOnboarded(
  db: Supabase,
  userId: string,
): Promise<boolean> {
  const { data, error } = await db.schema("core").from("referral_attributions")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("onboarded_at", null)
    .select("referrer_id")
    .maybeSingle();
  if (error) {
    throw new Error(`referral onboarded update failed: ${error.message}`);
  }
  if (!data?.referrer_id) return false;

  const { data: user } = await db.schema("core").from("users")
    .select("display_name").eq("id", userId).maybeSingle();
  const who = firstNameOf(user?.display_name);
  await insertNotification(
    db as NotificationSupabaseClient,
    {
      user_id: data.referrer_id,
      type: "referral.onboarded" as never,
      severity: "info",
      title: who
        ? `${who} set up their profile`
        : "Someone you invited set up their profile",
      message: who
        ? `${who} finished setting up on Scaffald. Thanks for bringing them in.`
        : "Someone you invited finished setting up on Scaffald.",
      cta_label: "See your invites",
      cta_url: INVITES_SCREEN_PATH,
      metadata: { referred_user_id: userId },
    },
    `referral.onboarded:${userId}`,
  );
  return true;
}
