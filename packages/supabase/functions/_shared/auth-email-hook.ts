/**
 * Supabase Auth "Send Email" hook → NevarMail.
 *
 * With the hook enabled, Supabase stops sending auth mail itself (its SMTP on
 * dev and preview could not send at all, 2026-11-17) and POSTs each email's
 * token here instead. We render the same branded template Supabase's own
 * mailer would (generated from email-templates/ + config.toml) and send it
 * through NevarMail as the "Scaffald sign-in" use case, from
 * signin@mail.scaffald.com.
 *
 * The pure parts live here so they can be tested without a network.
 */
import {
  AUTH_EMAIL_TEMPLATES,
  type AuthEmailKind,
} from "./auth-email-templates.ts";

export interface HookPayload {
  user: { id?: string; email?: string; new_email?: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to?: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Standard Webhooks signature (what Supabase signs hooks with)
// ---------------------------------------------------------------------------

const TOLERANCE_SECONDS = 5 * 60;

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: ArrayBuffer): string {
  let bin = "";
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verifies a Standard Webhooks request. `secret` is the value Supabase shows
 * when the hook is created: `v1,whsec_<base64>`. Returns false (never throws)
 * on anything malformed, stale or unsigned.
 */
export async function verifyHookSignature(
  secret: string,
  headers: {
    id: string | null;
    timestamp: string | null;
    signature: string | null;
  },
  body: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  const { id, timestamp, signature } = headers;
  if (!id || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > TOLERANCE_SECONDS) {
    return false;
  }

  const raw = secret.replace(/^v1,/, "").replace(/^whsec_/, "");
  let keyBytes: Uint8Array<ArrayBuffer>;
  try {
    keyBytes = b64ToBytes(raw);
  } catch {
    return false;
  }
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${body}`),
  );
  const expected = bytesToB64(mac);

  // The header may carry several space-separated "v1,<sig>" entries.
  return signature.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    return version === "v1" && !!sig && timingSafeEqual(sig, expected);
  });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const ACTION_TO_TEMPLATE: Record<string, AuthEmailKind> = {
  signup: "confirmation",
  invite: "invite",
  magiclink: "magic_link",
  recovery: "recovery",
  email_change: "email_change",
  // Supabase sends OTP sign-in for an existing user as `email`.
  email: "magic_link",
};

export function renderTemplate(
  kind: AuthEmailKind,
  vars: {
    siteUrl: string;
    token: string;
    tokenHash: string;
    newEmail?: string;
  },
): { subject: string; html: string } {
  const t = AUTH_EMAIL_TEMPLATES[kind];
  const siteUrl = vars.siteUrl.replace(/\/+$/, "");
  const html = t.html
    .replaceAll("{{ .SiteURL }}", siteUrl)
    .replaceAll("{{ .TokenHash }}", encodeURIComponent(vars.tokenHash))
    .replaceAll("{{ .Token }}", vars.token)
    .replaceAll("{{ .NewEmail }}", vars.newEmail ?? "");
  return { subject: t.subject, html };
}

/** A plain-text part, so the mail is not HTML-only (a spam signal). */
function textFor(kind: AuthEmailKind, link: string, token: string): string {
  const lead: Record<AuthEmailKind, string> = {
    magic_link: "Use this link to sign in to Scaffald",
    confirmation: "Confirm your Scaffald account",
    invite: "You've been invited to Scaffald. Accept the invitation",
    recovery: "Reset your Scaffald password",
    email_change: "Confirm your new email address",
  };
  return `${
    lead[kind]
  }:\n\n${link}\n\nOr enter this code: ${token}\n\nIf you didn't ask for this, you can ignore this email.\n`;
}

function confirmLink(siteUrl: string, tokenHash: string, type: string): string {
  return `${siteUrl.replace(/\/+$/, "")}/auth/confirm?token_hash=${
    encodeURIComponent(tokenHash)
  }&type=${type}`;
}

const LINK_TYPE: Record<AuthEmailKind, string> = {
  magic_link: "email",
  confirmation: "signup",
  invite: "invite",
  recovery: "recovery",
  email_change: "email_change",
};

/**
 * The emails one hook call should produce. Usually one; a secure email change
 * (both addresses must confirm) produces two. `reauthentication` is a bare
 * code with no template of ours.
 */
/**
 * Where the email's link should land: the app, not the auth server.
 *
 * The hook payload's `site_url` is the auth server's own URL
 * (https://<ref>.supabase.co/auth/v1), not the project's Site URL that
 * Supabase's built-in mailer fills into {{ .SiteURL }}. Using it sent every
 * link to <ref>.supabase.co/auth/v1/auth/confirm, which 404s (seen on dev
 * 2026-11-18). So: the environment's AUTH_SITE_URL first, then the origin of
 * an http(s) `redirect_to`, and `site_url` only as a last resort.
 */
export function resolveSiteUrl(
  payload: HookPayload,
  configured?: string,
): string {
  if (configured && /^https?:\/\//.test(configured)) {
    return configured.replace(/\/+$/, "");
  }
  const redirect = payload.email_data.redirect_to;
  if (redirect && /^https?:\/\//.test(redirect)) {
    try {
      return new URL(redirect).origin;
    } catch {
      // fall through
    }
  }
  return payload.email_data.site_url.replace(/\/+$/, "");
}

export function buildEmails(
  payload: HookPayload,
  opts: { siteUrl?: string } = {},
): OutgoingEmail[] {
  const { user, email_data: d } = payload;
  const siteUrl = resolveSiteUrl(payload, opts.siteUrl);
  const action = d.email_action_type;

  if (action === "reauthentication") {
    if (!user.email) return [];
    return [{
      to: user.email,
      subject: "Your Scaffald verification code",
      html:
        `<p>Your Scaffald verification code is <strong>${d.token}</strong>.</p>`,
      text: `Your Scaffald verification code is ${d.token}.\n`,
    }];
  }

  const kind = ACTION_TO_TEMPLATE[action];
  if (!kind) throw new Error(`unsupported email_action_type: ${action}`);

  const one = (to: string, token: string, tokenHash: string): OutgoingEmail => {
    const { subject, html } = renderTemplate(kind, {
      siteUrl,
      token,
      tokenHash,
      newEmail: user.new_email,
    });
    const link = confirmLink(siteUrl, tokenHash, LINK_TYPE[kind]);
    return { to, subject, html, text: textFor(kind, link, token) };
  };

  if (kind === "email_change") {
    // Supabase's documented pairing: token_hash goes to the NEW address and
    // token_hash_new to the CURRENT one (secure email change sends both).
    const out: OutgoingEmail[] = [];
    if (user.new_email) out.push(one(user.new_email, d.token, d.token_hash));
    if (user.email && d.token_hash_new) {
      out.push(one(user.email, d.token_new ?? "", d.token_hash_new));
    }
    return out;
  }

  if (!user.email) throw new Error("hook payload has no user email");
  return [one(user.email, d.token, d.token_hash)];
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

export interface NevarMailConfig {
  apiKey: string;
  useCaseId: string;
  baseUrl?: string;
}

export async function sendViaNevarMail(
  cfg: NevarMailConfig,
  email: OutgoingEmail,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const base = (cfg.baseUrl ?? "https://app.nevarmail.com").replace(/\/+$/, "");
  const res = await fetchImpl(`${base}/api/v1/email/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      use_case_id: cfg.useCaseId,
      emailType: "transactional",
    }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`NevarMail send failed (${res.status}): ${detail}`);
  }
}
