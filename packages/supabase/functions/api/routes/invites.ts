/**
 * Worker invites REST API (#1393, epic #1399).
 *
 *   POST /v1/invites                  (user)   invite contacts by email or phone
 *   GET  /v1/invites                  (user)   my invites + counts
 *   GET  /v1/invites/link             (user)   my personal link + share text
 *   GET  /v1/invites/:code/preview    (public) who invited you (first name + avatar only)
 *   POST /v1/invites/claim            (user)   attribute a new account to its invite
 *
 * SDK-facing, so bodies are bare (no `{ data }` wrapper).
 *
 * This route is the only writer of core.generic_invitations and
 * core.referral_attributions (migration 396 made both service-role-only for
 * writes), so the limits here are the limits.
 *
 * Email invites go out through NevarMail as `marketing` sends under the
 * `referral_invites` use case: NevarMail adds the unsubscribe footer and
 * header, and refuses suppressed addresses. Phone invites are never sent by
 * us (TCPA); the response carries an `sms:` link for the inviter's own phone.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { ApiEnv } from "../middleware/auth.ts";
import { wrapInBrandedTemplate } from "../../_shared/email-template.ts";
import { resolveAppBaseUrl } from "../../_shared/app-url.ts";
import {
  NevarMailError,
  nevarMailFromEnv,
  nevarMailUseCase,
} from "../../_shared/nevarmail.ts";
import {
  CLAIM_WINDOW_DAYS,
  type ContactSkipReason,
  DAILY_INVITE_LIMIT,
  firstName,
  generateInviteCode,
  INVITE_TTL_DAYS,
  inviteLink,
  isPlausibleCode,
  MAX_CONTACTS_PER_REQUEST,
  normalizeContacts,
  normalizeEmail,
  REINVITE_WINDOW_DAYS,
  renderInviteEmail,
  shareText,
  smsUrl,
  SOURCE_RE,
} from "../lib/invites.ts";

const app = new Hono<ApiEnv>();

function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 86_400_000).toISOString();

function unauthorized() {
  return { error: "Unauthorized", message: "Sign in to invite people." };
}

type InviteResult =
  | { index: number; status: "sent"; invitationId: string; email: string }
  | {
    index: number;
    status: "ready";
    invitationId: string;
    phone: string;
    link: string;
    smsUrl: string;
    shareText: string;
  }
  | {
    index: number;
    status: "skipped";
    reason: ContactSkipReason | "suppressed";
  }
  | {
    index: number;
    status: "failed";
    reason: "email_not_configured" | "send_limit" | "test_mode" | "send_failed";
  };

// ---------------------------------------------------------------------------
// POST /v1/invites
// ---------------------------------------------------------------------------

const createSchema = z.object({
  contacts: z.array(z.object({
    name: z.string().max(120).optional().nullable(),
    email: z.string().max(254).optional().nullable(),
    phone: z.string().max(40).optional().nullable(),
  })).min(1).max(MAX_CONTACTS_PER_REQUEST),
  message: z.string().max(500).optional().nullable(),
  source: z.string().regex(SOURCE_RE).optional(),
});

app.post("/", zValidator("json", createSchema), async (c) => {
  const user = c.get("user");
  if (!user) return c.json(unauthorized(), 401);
  const body = c.req.valid("json");
  const admin = serviceClient();
  const core = admin.schema("core");

  const [{ data: inviter }, { data: rule }] = await Promise.all([
    core.from("users").select("display_name").eq("id", user.id).maybeSingle(),
    core.from("invitation_rules").select("id")
      .eq("source_role", "worker").eq("target_role", "worker").maybeSingle(),
  ]);
  if (!inviter) {
    return c.json({
      error: "Not Found",
      message: "Finish setting up your profile first.",
    }, 404);
  }
  const inviterName = firstName(inviter.display_name);

  const { ok, skipped } = normalizeContacts(body.contacts);
  const results: InviteResult[] = skipped.map((s) => ({
    index: s.index,
    status: "skipped",
    reason: s.reason,
  }));

  // Yourself, and people who already have an account.
  const ownEmail = normalizeEmail(user.email ?? null);
  const emails = ok.map((x) => x.email).filter((e): e is string => !!e);
  const members = new Set<string>();
  if (emails.length) {
    const { data, error } = await core.rpc("user_ids_by_email", {
      p_emails: emails,
    });
    if (error) {
      console.error("[invites] user_ids_by_email failed:", error.message);
      return c.json({
        error: "Internal Server Error",
        message: "Could not check contacts.",
      }, 500);
    }
    for (const row of (data ?? []) as Array<{ email: string }>) {
      members.add(row.email);
    }
  }

  // Anyone this user invited recently.
  const since = daysAgo(REINVITE_WINDOW_DAYS);
  const phones = ok.map((x) => x.phone).filter((p): p is string => !!p);
  const recent = new Set<string>();
  if (emails.length) {
    const { data } = await core.from("generic_invitations").select(
      "invitee_email",
    )
      .eq("inviter_id", user.id).gte("created_at", since).in(
        "invitee_email",
        emails,
      );
    for (const r of data ?? []) {
      if (r.invitee_email) recent.add(r.invitee_email);
    }
  }
  if (phones.length) {
    const { data } = await core.from("generic_invitations").select(
      "invitee_phone",
    )
      .eq("inviter_id", user.id).gte("created_at", since).in(
        "invitee_phone",
        phones,
      );
    for (const r of data ?? []) {
      if (r.invitee_phone) recent.add(r.invitee_phone);
    }
  }

  const { count: today } = await core.from("generic_invitations")
    .select("id", { count: "exact", head: true })
    .eq("inviter_id", user.id).gte("created_at", daysAgo(1));
  let remaining = DAILY_INVITE_LIMIT - (today ?? 0);

  const mailClient = nevarMailFromEnv();
  const mailUseCase = nevarMailUseCase("referral_invites");
  const mailer = mailClient && mailUseCase
    ? { client: mailClient, useCaseId: mailUseCase }
    : null;
  const baseUrl = resolveAppBaseUrl();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000)
    .toISOString();
  let emailBlocked: "send_limit" | null = null;

  for (const contact of ok) {
    // normalizeContacts guarantees one of the two.
    const key = contact.email ?? contact.phone ?? "";
    if (contact.email && contact.email === ownEmail) {
      results.push({ index: contact.index, status: "skipped", reason: "self" });
      continue;
    }
    if (contact.email && members.has(contact.email)) {
      results.push({
        index: contact.index,
        status: "skipped",
        reason: "member",
      });
      continue;
    }
    if (recent.has(key)) {
      results.push({
        index: contact.index,
        status: "skipped",
        reason: "recently_invited",
      });
      continue;
    }
    if (remaining <= 0) {
      results.push({
        index: contact.index,
        status: "skipped",
        reason: "daily_limit",
      });
      continue;
    }
    if (contact.email && !mailer) {
      results.push({
        index: contact.index,
        status: "failed",
        reason: "email_not_configured",
      });
      continue;
    }
    if (contact.email && emailBlocked) {
      results.push({
        index: contact.index,
        status: "failed",
        reason: emailBlocked,
      });
      continue;
    }

    // A code collision is ~1 in 10^17; one retry is plenty.
    let row: { id: string; referral_code: string } | null = null;
    for (let attempt = 0; attempt < 2 && !row; attempt++) {
      const { data, error } = await core.from("generic_invitations").insert({
        rule_id: rule?.id ?? null,
        inviter_id: user.id,
        invitee_email: contact.email,
        invitee_phone: contact.phone,
        invitee_name: contact.name,
        referral_code: generateInviteCode(),
        personal_message: body.message?.trim() || null,
        status: "pending",
        expires_at: expiresAt,
        is_referral: true,
        kind: "targeted",
        channel: contact.email ? "email" : "sms_self",
        source: body.source ?? "app",
      }).select("id, referral_code").single();
      if (!error) row = data;
      else if (error.code !== "23505") {
        console.error("[invites] insert failed:", error.message);
        break;
      }
    }
    if (!row) {
      results.push({
        index: contact.index,
        status: "failed",
        reason: "send_failed",
      });
      continue;
    }
    recent.add(key);
    const link = inviteLink(baseUrl, row.referral_code);

    if (contact.phone) {
      remaining--;
      const text = shareText(inviterName, link, body.message);
      results.push({
        index: contact.index,
        status: "ready",
        invitationId: row.id,
        phone: contact.phone,
        link,
        smsUrl: smsUrl(contact.phone, text),
        shareText: text,
      });
      continue;
    }

    const content = renderInviteEmail({
      inviterName: inviter.display_name?.trim() || inviterName,
      inviteeName: contact.name,
      link,
      message: body.message,
    });
    const to = contact.email;
    if (!to || !mailer) continue; // unreachable: phone handled above, mailer checked before insert
    try {
      const sent = await mailer.client.send({
        to,
        useCaseId: mailer.useCaseId,
        emailType: "marketing",
        subject: content.subject,
        html: wrapInBrandedTemplate({
          title: "Scaffald",
          body: content.bodyHtml,
        }),
        text: content.text,
        metadata: { invitationId: row.id, kind: "referral_invite" },
      });
      await core.from("generic_invitations").update({
        nevarmail_email_id: sent.id,
        email_sent_at: new Date().toISOString(),
      }).eq("id", row.id);
      remaining--;
      results.push({
        index: contact.index,
        status: "sent",
        invitationId: row.id,
        email: to,
      });
    } catch (e) {
      // Nothing was sent, so nothing should look invited.
      await core.from("generic_invitations").delete().eq("id", row.id);
      recent.delete(key);
      if (e instanceof NevarMailError && e.isSuppressed) {
        results.push({
          index: contact.index,
          status: "skipped",
          reason: "suppressed",
        });
      } else if (e instanceof NevarMailError && e.isDailyCap) {
        emailBlocked = "send_limit";
        results.push({
          index: contact.index,
          status: "failed",
          reason: "send_limit",
        });
      } else if (e instanceof NevarMailError && e.isTestModeBlocked) {
        results.push({
          index: contact.index,
          status: "failed",
          reason: "test_mode",
        });
      } else {
        console.error("[invites] send failed:", (e as Error).message);
        results.push({
          index: contact.index,
          status: "failed",
          reason: "send_failed",
        });
      }
    }
  }

  results.sort((a, b) => a.index - b.index);
  const summary = { sent: 0, ready: 0, skipped: 0, failed: 0 };
  for (const r of results) summary[r.status]++;
  return c.json({ results, summary });
});

// ---------------------------------------------------------------------------
// GET /v1/invites
// ---------------------------------------------------------------------------

app.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json(unauthorized(), 401);
  // The caller's own client: RLS (396) already limits both tables to their rows.
  const core = c.get("supabase").schema("core");

  const [{ data: invites, error }, { data: joined }] = await Promise.all([
    core.from("generic_invitations")
      .select(
        "id, kind, channel, invitee_name, invitee_email, invitee_phone, status, created_at, accepted_at, email_sent_at, email_opened_at, email_clicked_at, invitee_user_id",
      )
      .eq("inviter_id", user.id).order("created_at", { ascending: false })
      .limit(200),
    core.from("referral_attributions")
      .select("user_id, invitation_id, signed_up_at, onboarded_at")
      .eq("referrer_id", user.id),
  ]);
  if (error) {
    return c.json(
      { error: "Internal Server Error", message: error.message },
      500,
    );
  }

  const byInvite = new Map(
    (joined ?? []).filter((j) => j.invitation_id).map((
      j,
    ) => [j.invitation_id, j]),
  );
  const items = (invites ?? []).map((i) => {
    const a = byInvite.get(i.id);
    return {
      id: i.id,
      kind: i.kind,
      channel: i.channel,
      name: i.invitee_name,
      email: i.invitee_email,
      phone: i.invitee_phone,
      status: a?.onboarded_at
        ? "onboarded"
        : a || i.status === "accepted"
        ? "joined"
        : i.status,
      createdAt: i.created_at,
      emailSentAt: i.email_sent_at,
      emailOpenedAt: i.email_opened_at,
      emailClickedAt: i.email_clicked_at,
    };
  });
  return c.json({
    invites: items,
    counts: {
      invited: items.filter((i) => i.kind === "targeted").length,
      joined: (joined ?? []).length,
      onboarded: (joined ?? []).filter((j) => j.onboarded_at).length,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /v1/invites/link
// ---------------------------------------------------------------------------

app.get("/link", async (c) => {
  const user = c.get("user");
  if (!user) return c.json(unauthorized(), 401);
  const { data } = await serviceClient().schema("core").from("users")
    .select("display_name, referral_code").eq("id", user.id).maybeSingle();
  if (!data?.referral_code) {
    return c.json({
      error: "Not Found",
      message: "Finish setting up your profile first.",
    }, 404);
  }
  const link = inviteLink(resolveAppBaseUrl(), data.referral_code);
  return c.json({
    code: data.referral_code,
    link,
    shareText: shareText(firstName(data.display_name), link),
  });
});

// ---------------------------------------------------------------------------
// Code resolution (preview and claim)
// ---------------------------------------------------------------------------

type ResolvedCode =
  | { kind: "link"; referrerId: string }
  | {
    kind: "targeted";
    referrerId: string;
    invitationId: string;
    status: string;
    inviteeUserId: string | null;
  };

// deno-lint-ignore no-explicit-any
async function resolveCode(
  core: any,
  code: string,
): Promise<ResolvedCode | null> {
  if (!isPlausibleCode(code)) return null;
  const { data: owner } = await core.from("users").select("id").eq(
    "referral_code",
    code,
  ).maybeSingle();
  if (owner) return { kind: "link", referrerId: owner.id };

  const { data: inv } = await core.from("generic_invitations")
    .select("id, inviter_id, status, expires_at, invitee_user_id")
    .eq("referral_code", code).maybeSingle();
  if (!inv) return null;
  if (inv.status === "declined") return null;
  if (
    inv.status !== "accepted" && inv.expires_at &&
    new Date(inv.expires_at) < new Date()
  ) return null;
  return {
    kind: "targeted",
    referrerId: inv.inviter_id,
    invitationId: inv.id,
    status: inv.status,
    inviteeUserId: inv.invitee_user_id,
  };
}

// ---------------------------------------------------------------------------
// GET /v1/invites/:code/preview (public)
// ---------------------------------------------------------------------------

app.get("/:code/preview", async (c) => {
  const core = serviceClient().schema("core");
  const resolved = await resolveCode(core, c.req.param("code").toLowerCase());
  if (!resolved) {
    return c.json({
      error: "Not Found",
      message: "This invite link isn't valid.",
    }, 404);
  }
  const { data: inviter } = await core.from("users")
    .select("display_name, avatar_url").eq("id", resolved.referrerId)
    .maybeSingle();
  if (!inviter) {
    return c.json({
      error: "Not Found",
      message: "This invite link isn't valid.",
    }, 404);
  }
  // Deliberately nothing about the invitee, and only the inviter's first name.
  return c.json({
    kind: resolved.kind,
    inviter: {
      firstName: firstName(inviter.display_name),
      avatarUrl: inviter.avatar_url ?? null,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /v1/invites/claim
// ---------------------------------------------------------------------------

app.post(
  "/claim",
  zValidator(
    "json",
    z.object({
      code: z.string().min(1).max(64),
      landedAt: z.string().datetime().optional(),
    }),
  ),
  async (c) => {
    const user = c.get("user");
    if (!user) return c.json(unauthorized(), 401);
    const { code: rawCode, landedAt } = c.req.valid("json");
    const code = rawCode.trim().toLowerCase();
    const core = serviceClient().schema("core");

    const { data: existing } = await core.from("referral_attributions")
      .select("referrer_id").eq("user_id", user.id).maybeSingle();
    if (existing) {
      return c.json({ claimed: false, reason: "already_attributed" });
    }

    const resolved = await resolveCode(core, code);
    if (!resolved) {
      return c.json({
        error: "Not Found",
        message: "This invite link isn't valid.",
      }, 404);
    }
    if (resolved.referrerId === user.id) {
      return c.json({ claimed: false, reason: "self" });
    }
    if (
      resolved.kind === "targeted" &&
      (resolved.status === "accepted" || resolved.inviteeUserId) &&
      resolved.inviteeUserId !== user.id
    ) {
      return c.json({ claimed: false, reason: "already_used" });
    }

    // Attribution is for new accounts; an existing member opening a link
    // later must not credit whoever sent it.
    const { data: me } = await core.from("users").select("created_at").eq(
      "id",
      user.id,
    ).maybeSingle();
    if (!me || new Date(me.created_at) < new Date(daysAgo(CLAIM_WINDOW_DAYS))) {
      return c.json({ claimed: false, reason: "not_new" });
    }

    const { error: insertError } = await core.from("referral_attributions")
      .insert({
        user_id: user.id,
        referrer_id: resolved.referrerId,
        invitation_id: resolved.kind === "targeted"
          ? resolved.invitationId
          : null,
        referral_code: code,
        landed_at: landedAt ?? null,
      });
    if (insertError) {
      if (insertError.code === "23505") {
        return c.json({ claimed: false, reason: "already_attributed" });
      }
      console.error("[invites] claim insert failed:", insertError.message);
      return c.json({
        error: "Internal Server Error",
        message: "Could not record the invite.",
      }, 500);
    }

    if (resolved.kind === "targeted") {
      await core.from("generic_invitations").update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        invitee_user_id: user.id,
      }).eq("id", resolved.invitationId);
    }

    const { data: referrer } = await core.from("users").select("display_name")
      .eq("id", resolved.referrerId).maybeSingle();
    return c.json({
      claimed: true,
      referrer: { firstName: firstName(referrer?.display_name) },
    });
  },
);

export default app;
