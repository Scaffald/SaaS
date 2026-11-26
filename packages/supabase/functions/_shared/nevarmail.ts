/**
 * NevarMail client for edge functions: the one way Scaffald sends email.
 *
 * Covers the v1 surface we use (docs: NVS-Mail docs/api-reference.md):
 *   send            POST /api/v1/email/send
 *   sendToList      POST /api/v1/email/send-to-list
 *   upsertContacts  POST /api/v1/contacts                 (≤1000 per call; chunked here)
 *   addToList       POST /api/v1/lists/{id}/contacts      (≤1000 per call; chunked here)
 *   checkSuppression GET /api/v1/suppressions/check
 *   get/setPreferences GET|PUT /api/v1/preferences
 * and verifies NevarMail's outbound webhooks.
 *
 * NevarMail enforces suppression on every send, adds the CAN-SPAM footer and
 * List-Unsubscribe headers to marketing sends, and answers `{ data, requestId }`
 * on success and `{ error, code?, requestId? }` on failure.
 *
 * Configuration (function secrets):
 *   NEVARMAIL_API_KEY            org API key (nvm_api_live_… / nvm_api_test_…)
 *   NEVARMAIL_BASE_URL           optional, defaults to https://app.nevarmail.com
 *   NEVARMAIL_USE_CASE_<PURPOSE> one use case id per sending purpose, e.g.
 *                                NEVARMAIL_USE_CASE_NOTIFICATIONS
 *   NEVARMAIL_WEBHOOK_SECRET     the endpoint's whsec_… secret
 *
 * A test-mode key only delivers to the org's test allow-list, so local runs
 * and CI cannot mail real people.
 */
import {
  verifyStandardWebhook,
  type WebhookSignatureHeaders,
} from "./webhook-signature.ts";

export const NEVARMAIL_DEFAULT_BASE_URL = "https://app.nevarmail.com";

/** NevarMail's per-call ceiling for contact and list writes. */
export const NEVARMAIL_BATCH_LIMIT = 1000;

/** Each purpose is its own NevarMail use case (and sender). */
export type NevarMailPurpose =
  | "signin"
  | "notifications"
  | "team_invites"
  | "contact"
  | "referral_invites"
  | "newsletter";

export type NevarMailEmailType = "transactional" | "marketing";

export interface NevarMailConfig {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
}

export interface SendEmailInput {
  to: string;
  useCaseId: string;
  subject?: string;
  html?: string;
  text?: string;
  templateId?: string;
  variables?: Record<string, unknown>;
  /** Defaults to "transactional". Invites and the newsletter are "marketing". */
  emailType?: NevarMailEmailType;
  /** A bare address on a domain of the use case's project; omit to use its sender. */
  from?: string;
  fromName?: string;
  /** Where replies go (bare address), e.g. a contact form's submitter. */
  replyTo?: string;
  replyToName?: string;
  metadata?: Record<string, unknown>;
}

export interface SendEmailResult {
  /** What NevarMail's webhooks call `email_id`; store it to match events. */
  id: string;
  messageId: string | null;
  status: "sent" | "failed";
  provider: string | null;
  sentAt: string | null;
}

export interface SendToListInput {
  listId: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  tags?: string[];
}

export interface SendToListResult {
  id: string;
  status: "sent" | "failed";
  sentCount: number;
  listId: string;
}

export interface NevarMailContact {
  email: string;
  firstName?: string;
  lastName?: string;
  customFields?: Record<string, string>;
  listIds?: string[];
}

export type NevarMailSubscriber = Omit<NevarMailContact, "listIds">;

export interface SuppressionCheck {
  suppressed: boolean;
  /** Can differ from !suppressed: an opt-out does not block a non-suppressable use case. */
  canSend: boolean;
  reason: string | null;
}

export interface Preferences {
  email: string;
  senderName: string;
  deliverable: boolean;
  unsubscribedAll: boolean;
  lists: Array<{
    listId: string;
    name: string;
    description: string | null;
    subscribed: boolean;
    blocked: boolean;
  }>;
}

export interface SetPreferencesInput {
  email: string;
  projectId?: string;
  /** The COMPLETE set of shown lists to stay on; any shown list left out is opted out. */
  subscribedListIds: string[];
  unsubscribeAll?: boolean;
}

/** A failed NevarMail call. `code` is NevarMail's (e.g. DAILY_RAMP_CAP). */
export class NevarMailError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null = null,
    readonly requestId: string | null = null,
  ) {
    super(message);
    this.name = "NevarMailError";
  }

  /** A warming-up account has no sends left today; nothing was sent. */
  get isDailyCap(): boolean {
    return this.code === "DAILY_RAMP_CAP";
  }

  /** The recipient is suppressed (bounce, complaint, unsubscribe, manual). */
  get isSuppressed(): boolean {
    return this.code === "RECIPIENT_SUPPRESSED";
  }

  /** A test-mode key or org tried to mail someone off the allow-list. */
  get isTestModeBlocked(): boolean {
    return this.code === "TEST_MODE_RECIPIENT_NOT_ALLOWED";
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

export function createNevarMailClient(cfg: NevarMailConfig) {
  if (!cfg.apiKey) throw new Error("NevarMail API key is required");
  const base = (cfg.baseUrl ?? NEVARMAIL_DEFAULT_BASE_URL).replace(/\/+$/, "");
  const doFetch = cfg.fetch ?? fetch;

  async function call<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await doFetch(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const raw = await res.text();
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }
    if (!res.ok) {
      const message = typeof parsed?.error === "string"
        ? parsed.error
        : raw.slice(0, 300) || res.statusText;
      throw new NevarMailError(
        `NevarMail ${method} ${path} failed (${res.status}): ${message}`,
        res.status,
        typeof parsed?.code === "string" ? parsed.code : null,
        typeof parsed?.requestId === "string"
          ? parsed.requestId
          : res.headers.get("x-request-id"),
      );
    }
    // v1 wraps the payload in `data`; tolerate a bare body too.
    return (parsed && "data" in parsed ? parsed.data : parsed) as T;
  }

  return {
    // async so bad input rejects like every other failure instead of throwing.
    async send(input: SendEmailInput): Promise<SendEmailResult> {
      if (!input.html && !input.text && !input.templateId) {
        throw new Error("NevarMail send needs html, text or templateId");
      }
      if (!input.subject && !input.templateId) {
        throw new Error(
          "NevarMail send needs a subject unless templateId is set",
        );
      }
      return call<SendEmailResult>("POST", "/api/v1/email/send", {
        to: input.to,
        use_case_id: input.useCaseId,
        emailType: input.emailType ?? "transactional",
        ...(input.subject ? { subject: input.subject } : {}),
        ...(input.html ? { html: input.html } : {}),
        ...(input.text ? { text: input.text } : {}),
        ...(input.templateId ? { templateId: input.templateId } : {}),
        ...(input.variables ? { variables: input.variables } : {}),
        ...(input.from ? { from: input.from } : {}),
        ...(input.fromName ? { fromName: input.fromName } : {}),
        ...(input.replyTo ? { replyTo: input.replyTo } : {}),
        ...(input.replyToName ? { replyToName: input.replyToName } : {}),
        ...(input.metadata ? { metadata: input.metadata } : {}),
      });
    },

    sendToList(input: SendToListInput): Promise<SendToListResult> {
      return call<SendToListResult>(
        "POST",
        "/api/v1/email/send-to-list",
        input,
      );
    },

    /** Creates or updates contacts; arrays over 1000 go out in several calls. */
    async upsertContacts(
      contacts: NevarMailContact[],
    ): Promise<Array<Record<string, unknown>>> {
      const results: Array<Record<string, unknown>> = [];
      for (const part of chunk(contacts, NEVARMAIL_BATCH_LIMIT)) {
        results.push(await call("POST", "/api/v1/contacts", part));
      }
      return results;
    },

    /** Adds subscribers to a list (idempotent); arrays over 1000 are chunked. */
    async addToList(
      listId: string,
      subscribers: NevarMailSubscriber[],
    ): Promise<Array<Record<string, unknown>>> {
      const results: Array<Record<string, unknown>> = [];
      for (const part of chunk(subscribers, NEVARMAIL_BATCH_LIMIT)) {
        results.push(
          await call(
            "POST",
            `/api/v1/lists/${encodeURIComponent(listId)}/contacts`,
            part,
          ),
        );
      }
      return results;
    },

    checkSuppression(
      email: string,
      opts: { projectId?: string; useCaseId?: string } = {},
    ): Promise<SuppressionCheck> {
      const q = new URLSearchParams({ email });
      if (opts.projectId) q.set("project_id", opts.projectId);
      if (opts.useCaseId) q.set("use_case_id", opts.useCaseId);
      return call<SuppressionCheck>("GET", `/api/v1/suppressions/check?${q}`);
    },

    getPreferences(email: string, projectId?: string): Promise<Preferences> {
      const q = new URLSearchParams({ email });
      if (projectId) q.set("project_id", projectId);
      return call<Preferences>("GET", `/api/v1/preferences?${q}`);
    },

    setPreferences(input: SetPreferencesInput): Promise<Preferences> {
      return call<Preferences>("PUT", "/api/v1/preferences", {
        email: input.email,
        ...(input.projectId ? { project_id: input.projectId } : {}),
        subscribed_list_ids: input.subscribedListIds,
        unsubscribe_all: input.unsubscribeAll ?? false,
      });
    },
  };
}

export type NevarMailClient = ReturnType<typeof createNevarMailClient>;

type EnvReader = (name: string) => string | undefined;
const denoEnv: EnvReader = (name) => Deno.env.get(name);

/** The client configured from function secrets, or null when no key is set. */
export function nevarMailFromEnv(
  env: EnvReader = denoEnv,
  fetchImpl?: typeof fetch,
): NevarMailClient | null {
  const apiKey = env("NEVARMAIL_API_KEY");
  if (!apiKey) return null;
  return createNevarMailClient({
    apiKey,
    baseUrl: env("NEVARMAIL_BASE_URL") || undefined,
    fetch: fetchImpl,
  });
}

/**
 * The use case id for a purpose, from NEVARMAIL_USE_CASE_<PURPOSE>. Sign-in
 * also accepts NEVARMAIL_USE_CASE_ID, the name the auth hook shipped with.
 */
export function nevarMailUseCase(
  purpose: NevarMailPurpose,
  env: EnvReader = denoEnv,
): string | null {
  const own = env(`NEVARMAIL_USE_CASE_${purpose.toUpperCase()}`);
  if (own) return own;
  if (purpose === "signin") return env("NEVARMAIL_USE_CASE_ID") ?? null;
  return null;
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export type NevarMailWebhookType =
  | "email.sent"
  | "email.delivered"
  | "email.bounced"
  | "email.deferred"
  | "email.dropped"
  | "email.opened"
  | "email.clicked"
  | "email.complained"
  | "email.unsubscribed"
  | "contact.suppressed"
  | "domain.verified"
  | "domain.failed";

/** The `email.*` payload. `email_id` is the `id` that `send` returned. */
export interface NevarMailEmailEvent {
  type: Exclude<NevarMailWebhookType, `contact.${string}` | `domain.${string}`>;
  occurred_at: string;
  project_id: string;
  email_id: string | null;
  campaign_send_id: string | null;
  recipient: string | null;
  send_mode: string;
  url?: string;
  reason?: string;
}

/** Reads NevarMail's signature headers off a request. */
export function nevarMailWebhookHeaders(
  headers: Headers,
): WebhookSignatureHeaders {
  return {
    id: headers.get("x-webhook-id"),
    timestamp: headers.get("x-webhook-timestamp"),
    signature: headers.get("x-webhook-signature"),
  };
}

/**
 * True only for a fresh, correctly signed NevarMail delivery. `body` must be
 * the raw request text, read before any JSON parsing.
 */
export function verifyNevarMailWebhook(
  secret: string,
  headers: WebhookSignatureHeaders,
  body: string,
  nowSeconds?: number,
): Promise<boolean> {
  return verifyStandardWebhook(secret, headers, body, {
    keyEncoding: "utf8",
    nowSeconds,
  });
}
