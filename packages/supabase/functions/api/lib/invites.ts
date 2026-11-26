/**
 * Worker invites (#1393): the pure parts of /v1/invites, kept here so they
 * can be tested without a database or a network.
 *
 * Phone invites are never sent by us. Under TCPA a text we send to a number
 * someone imported needs that person's prior written consent, which a contact
 * list does not give. So for a phone contact we hand back an `sms:` link and
 * the text, and the inviter sends it from their own phone.
 */

/** Contacts per POST /v1/invites. */
export const MAX_CONTACTS_PER_REQUEST = 50;
/** Invites a user may create per rolling 24 hours (all channels). */
export const DAILY_INVITE_LIMIT = 200;
/** An inviter cannot re-invite the same address or number within this window. */
export const REINVITE_WINDOW_DAYS = 14;
/** Targeted invites expire after this many days. */
export const INVITE_TTL_DAYS = 30;
/** A user can claim an invite only this soon after their account was created. */
export const CLAIM_WINDOW_DAYS = 14;

/** Same alphabet as core.generate_referral_code(): no 0/o, 1/l/i. */
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
/** Personal codes are 8 characters; per-invite codes are 12, so they never collide. */
export const INVITE_CODE_LENGTH = 12;

export function generateInviteCode(length = INVITE_CODE_LENGTH): string {
  // Rejection sampling keeps every character equally likely.
  const limit = 256 - (256 % CODE_ALPHABET.length);
  let out = "";
  while (out.length < length) {
    for (const b of crypto.getRandomValues(new Uint8Array(length * 2))) {
      if (b < limit && out.length < length) {
        out += CODE_ALPHABET[b % CODE_ALPHABET.length];
      }
    }
  }
  return out;
}

export function isPlausibleCode(code: string): boolean {
  return /^[a-z0-9]{6,32}$/.test(code);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: string | null | undefined): string | null {
  const email = raw?.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return null;
  return email;
}

/**
 * E.164, defaulting to the US (+1) for 10-digit numbers. Returns null for
 * anything it cannot place; we would rather drop a contact than text a guess.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  let e164: string;
  if (trimmed.startsWith("+")) e164 = `+${digits}`;
  else if (trimmed.startsWith("00")) e164 = `+${digits.slice(2)}`;
  else if (digits.length === 10) e164 = `+1${digits}`;
  else if (digits.length === 11 && digits.startsWith("1")) e164 = `+${digits}`;
  else return null;
  return /^\+[1-9][0-9]{6,14}$/.test(e164) ? e164 : null;
}

export function firstName(displayName: string | null | undefined): string {
  const first = displayName?.trim().split(/\s+/)[0];
  return first && first.length > 0 ? first : "A friend";
}

export function inviteLink(appBaseUrl: string, code: string): string {
  return `${appBaseUrl.replace(/\/+$/, "")}/i/${encodeURIComponent(code)}`;
}

export function shareText(
  inviterFirstName: string,
  link: string,
  message?: string | null,
): string {
  const note = message?.trim();
  return [
    note
      ? note
      : `${inviterFirstName} invited you to Scaffald, where construction workers find their next job.`,
    `Join here: ${link}`,
  ].join("\n\n");
}

/**
 * `sms:` link that opens the inviter's messaging app with the text filled in.
 * `?&body=` is the form both iOS and Android accept.
 */
export function smsUrl(phone: string, text: string): string {
  return `sms:${phone}?&body=${encodeURIComponent(text)}`;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}

export interface InviteEmailContent {
  subject: string;
  /** Body HTML for the branded wrapper. */
  bodyHtml: string;
  /**
   * Footer for the branded wrapper. Its default ("Manage your notification
   * preferences in your account settings") is for members; an invitee has
   * no account, so this says why they got the email instead. NevarMail adds
   * the postal address and the unsubscribe link below it.
   */
  footerHtml: string;
  text: string;
}

/**
 * The invite email. NevarMail sends it as `marketing`, so it adds the
 * unsubscribe footer, the List-Unsubscribe header and the postal address; we
 * add none of those here.
 */
export function renderInviteEmail(opts: {
  inviterName: string;
  inviteeName?: string | null;
  link: string;
  message?: string | null;
  /** The one follow-up a few days later (#1397): different subject and opener. */
  reminder?: boolean;
}): InviteEmailContent {
  const inviter = opts.inviterName.trim() || "A friend";
  // First name only: "Hi Sam," not "Hi Sam Ortiz,".
  const invitee = opts.inviteeName?.trim().split(/\s+/)[0];
  const greeting = invitee ? `Hi ${invitee},` : "Hi,";
  const note = opts.message?.trim();
  const subject = opts.reminder
    ? `Reminder: ${inviter} invited you to Scaffald`
    : `${inviter} invited you to Scaffald`;
  const opener = opts.reminder
    ? `Just a reminder: ${inviter} invited you to Scaffald a few days ago, where construction workers find their next job and get hired on their skills.`
    : `${inviter} thinks you should be on Scaffald, where construction workers find their next job and get hired on their skills.`;

  const bodyHtml = [
    `<p style="margin:0 0 16px">${escapeHtml(greeting)}</p>`,
    `<p style="margin:0 0 16px">${escapeHtml(opener)}</p>`,
    note
      ? `<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #c8a96a;background:#faf6ee">${
        escapeHtml(note).replace(/\n/g, "<br>")
      }</blockquote>`
      : "",
    `<p style="margin:24px 0"><a href="${
      escapeHtml(opts.link)
    }" style="display:inline-block;padding:12px 20px;border-radius:6px;background:#1f2a2e;color:#ffffff;text-decoration:none;font-weight:600">Join ${
      escapeHtml(inviter)
    } on Scaffald</a></p>`,
    `<p style="margin:0;color:#6b6b6b;font-size:13px">Or paste this link into your browser: ${
      escapeHtml(opts.link)
    }</p>`,
  ].join("\n");

  const text = [
    greeting,
    opener,
    note ? `"${note}"` : "",
    `Join here: ${opts.link}`,
  ].filter(Boolean).join("\n\n");

  const footerHtml = `<p style="margin:0;">You're getting this because ${
    escapeHtml(inviter)
  } invited you to join Scaffald. You don't have an account with us; the unsubscribe link below stops further invitations.</p>`;

  return { subject, bodyHtml, footerHtml, text };
}

export type ContactSkipReason =
  | "invalid"
  | "self"
  | "member"
  | "recently_invited"
  | "duplicate"
  | "daily_limit";

export interface NormalizedContact {
  index: number;
  name: string | null;
  email: string | null;
  phone: string | null;
}

/**
 * Normalises a request's contacts and drops the ones we can decide on without
 * the database: unusable, or the same person twice in one request. An email
 * wins over a phone when both are given, since only email is sent by us.
 */
export function normalizeContacts(
  contacts: Array<
    { name?: string | null; email?: string | null; phone?: string | null }
  >,
): {
  ok: NormalizedContact[];
  skipped: Array<{ index: number; reason: ContactSkipReason }>;
} {
  const ok: NormalizedContact[] = [];
  const skipped: Array<{ index: number; reason: ContactSkipReason }> = [];
  const seen = new Set<string>();
  contacts.forEach((c, index) => {
    const email = normalizeEmail(c.email);
    const phone = normalizePhone(c.phone);
    const key = email ?? phone;
    if (!key) {
      skipped.push({ index, reason: "invalid" });
      return;
    }
    if (seen.has(key)) {
      skipped.push({ index, reason: "duplicate" });
      return;
    }
    seen.add(key);
    ok.push({
      index,
      name: c.name?.trim().slice(0, 120) || null,
      email,
      phone: email ? null : phone,
    });
  });
  return { ok, skipped };
}

/** `app`, `onboarding`, or `script:<file>` for scripts/invite-list.ts. */
export const SOURCE_RE = /^(app|onboarding|share|script:[A-Za-z0-9._-]{1,80})$/;
