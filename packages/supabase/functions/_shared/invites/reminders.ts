/**
 * One reminder per email invite (#1397).
 *
 * Due: a targeted invite sent by email at least REMINDER_AFTER_DAYS ago that
 * is still pending, not expired, and not yet reminded. Each due invite gets
 * exactly one reminder: `reminder_sent_at` is stamped whether the send went
 * out or was refused for good (suppressed, the person joined meanwhile), so
 * nothing is ever reminded twice. A send that failed for a reason that may
 * pass (NevarMail's daily cap, an outage) leaves it unstamped for tomorrow;
 * the cap also ends the run.
 *
 * Phone invites are never reminded: Scaffald doesn't text (TCPA).
 *
 * Driven once a day by pg_cron → the `invites-remind` function (migration
 * 400). The gated test calls processDueReminders directly.
 */
import { wrapInBrandedTemplate } from "../email-template.ts";
import { resolveAppBaseUrl } from "../app-url.ts";
import { type NevarMailClient, NevarMailError } from "../nevarmail.ts";
import {
  firstName,
  inviteLink,
  renderInviteEmail,
} from "../../api/lib/invites.ts";

// deno-lint-ignore no-explicit-any
// biome-ignore lint/suspicious/noExplicitAny: untyped Deno Supabase client (#477)
type Supabase = any;

export const REMINDER_AFTER_DAYS = 5;
export const DEFAULT_REMINDER_LIMIT = 100;

export interface ReminderOutcome {
  due: number;
  sent: number;
  /** Stamped without sending: suppressed, or the person has joined. */
  closed: number;
  /** Left for tomorrow. */
  deferred: number;
  stoppedBy: "send_limit" | null;
}

export async function processDueReminders(
  db: Supabase,
  mail: { client: NevarMailClient; useCaseId: string } | null,
  opts: { now?: Date; limit?: number; baseUrl?: string } = {},
): Promise<ReminderOutcome> {
  const now = opts.now ?? new Date();
  const cutoff = new Date(now.getTime() - REMINDER_AFTER_DAYS * 86_400_000)
    .toISOString();
  const core = () => db.schema("core");

  const { data: due, error } = await core().from("generic_invitations")
    .select(
      "id, inviter_id, invitee_email, invitee_name, referral_code, personal_message",
    )
    .eq("kind", "targeted")
    .eq("channel", "email")
    .eq("status", "pending")
    .is("reminder_sent_at", null)
    .is("invitee_user_id", null)
    .not("email_sent_at", "is", null)
    .lte("email_sent_at", cutoff)
    .gt("expires_at", now.toISOString())
    .order("email_sent_at", { ascending: true })
    .limit(opts.limit ?? DEFAULT_REMINDER_LIMIT);
  if (error) throw new Error(`due reminders lookup failed: ${error.message}`);

  const outcome: ReminderOutcome = {
    due: due?.length ?? 0,
    sent: 0,
    closed: 0,
    deferred: 0,
    stoppedBy: null,
  };
  if (!due?.length) return outcome;
  if (!mail) {
    outcome.deferred = due.length;
    return outcome;
  }

  const stamp = (id: string) =>
    core().from("generic_invitations").update({
      reminder_sent_at: now.toISOString(),
    }).eq("id", id);

  // Anyone who joined since the invite went out is not reminded.
  const emails = [
    ...new Set(due.map((d: { invitee_email: string }) => d.invitee_email)),
  ];
  const members = new Set<string>();
  for (let i = 0; i < emails.length; i += 200) {
    const { data } = await core().rpc("user_ids_by_email", {
      p_emails: emails.slice(i, i + 200),
    });
    for (const r of (data ?? []) as Array<{ email: string }>) {
      members.add(r.email);
    }
  }

  const inviterIds = [
    ...new Set(due.map((d: { inviter_id: string }) => d.inviter_id)),
  ];
  const { data: inviters } = await core().from("users").select(
    "id, display_name",
  ).in("id", inviterIds);
  const names = new Map<string, string | null>(
    (inviters ?? []).map((
      u: { id: string; display_name: string | null },
    ) => [u.id, u.display_name]),
  );
  const baseUrl = opts.baseUrl ?? resolveAppBaseUrl();

  for (const invite of due) {
    if (outcome.stoppedBy) {
      outcome.deferred++;
      continue;
    }
    if (members.has(invite.invitee_email)) {
      await stamp(invite.id);
      outcome.closed++;
      continue;
    }
    const inviterName = names.get(invite.inviter_id)?.trim() || firstName(null);
    const content = renderInviteEmail({
      inviterName,
      inviteeName: invite.invitee_name,
      link: inviteLink(baseUrl, invite.referral_code),
      message: invite.personal_message,
      reminder: true,
    });
    try {
      await mail.client.send({
        to: invite.invitee_email,
        useCaseId: mail.useCaseId,
        emailType: "marketing",
        subject: content.subject,
        html: wrapInBrandedTemplate({
          title: "Scaffald",
          body: content.bodyHtml,
          footerHtml: content.footerHtml,
        }),
        text: content.text,
        metadata: { invitationId: invite.id, kind: "referral_invite_reminder" },
      });
      await stamp(invite.id);
      outcome.sent++;
    } catch (e) {
      if (e instanceof NevarMailError && e.isDailyCap) {
        outcome.stoppedBy = "send_limit";
        outcome.deferred++;
      } else if (
        e instanceof NevarMailError && (e.isSuppressed || e.isTestModeBlocked)
      ) {
        await stamp(invite.id);
        outcome.closed++;
      } else {
        console.error(`[invites-remind] ${invite.id}: ${(e as Error).message}`);
        outcome.deferred++;
      }
    }
  }
  return outcome;
}
