const DEFAULT_TIMEOUT_MS = 15_000;
const SIGNATURE_HEADER = "x-nationsearch-signature";
const IDEMPOTENCY_HEADER = "Idempotency-Key";
const MAX_RETRIES = 2;
const OUTAGE_STATUS_CODES = new Set([502, 503, 504]);

const textEncoder = new TextEncoder();

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

type JsonRecord = Record<string, unknown>;

type QueueJob = () => Promise<unknown>;

const outageQueue: QueueJob[] = [];
let outageActive = false;
let drainingOutageQueue = false;
let certificateValidationPromise: Promise<void> | null = null;

export interface NationSearchClientOptions {
  baseUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  userAgent?: string;
}

export interface NationSearchRequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | JsonRecord;
  idempotencyKey?: string;
  retryCount?: number;
}

export interface InitiateCheckPayload extends JsonRecord {
  package_code: string;
  user: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    date_of_birth?: string;
    ssn_last4?: string;
  };
  organization?: {
    id: string;
    name?: string;
  };
  custom_configuration?: JsonRecord;
  documents?: Array<{
    document_type: string;
    file_url: string;
    file_name?: string;
  }>;
  metadata?: JsonRecord;
}

export interface InitiateCheckResponse {
  id: string;
  status: string;
  estimated_completion_date?: string | null;
  metadata?: JsonRecord;
}

export interface SubmitDocumentPayload extends JsonRecord {
  document_type: string;
  file_url: string;
  file_name?: string;
  metadata?: JsonRecord;
}

export interface CheckComponentStatus {
  code: string;
  status: string;
  completed_at?: string | null;
  findings?: JsonRecord | null;
}

export interface CheckStatusResponse {
  id: string;
  status: string;
  summary?: string | null;
  findings?: JsonRecord | null;
  completed_at?: string | null;
  expires_at?: string | null;
  updated_at?: string | null;
  estimated_completion_date?: string | null;
  components?: CheckComponentStatus[];
  metadata?: JsonRecord;
}

export interface NationSearchErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
}

export class NationSearchError extends Error {
  public readonly status: number;
  public readonly payload?: NationSearchErrorPayload;

  constructor(message: string, status: number, payload?: NationSearchErrorPayload) {
    super(message);
    this.status = status;
    this.payload = payload;
    this.name = "NationSearchError";
  }
}

export class NationSearchOutageError extends NationSearchError {
  constructor(message: string, payload?: NationSearchErrorPayload) {
    super(message, 503, payload);
    this.name = "NationSearchOutageError";
  }
}

export function isNationSearchOutageError(error: unknown): error is NationSearchOutageError {
  return error instanceof NationSearchOutageError;
}

async function hmacSha256(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeFingerprint(value: string): string {
  return value.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
}

async function verifyCertificateFingerprint(baseUrl: string): Promise<void> {
  const expectedFingerprint = Deno.env.get("NATIONSEARCH_CERT_FINGERPRINT");
  if (!expectedFingerprint) {
    return;
  }

  try {
    const url = new URL(baseUrl);
    const hostname = url.hostname;
    const port = Number(url.port) || 443;

    const denoGlobal = (globalThis as { Deno?: { connectTls?: (options: { hostname: string; port: number }) => Promise<unknown> } }).Deno;
    if (typeof denoGlobal?.connectTls !== "function") {
      console.warn("[nationsearch] TLS validation unavailable in this runtime; skipping pin verification");
      return;
    }

    const conn = await denoGlobal.connectTls({ hostname, port });
    try {
      const tlsConn = conn as { getCertificate?: () => { rawDER?: Uint8Array } | null };
      const certificate = typeof tlsConn.getCertificate === "function" ? tlsConn.getCertificate() : null;

      if (!certificate?.rawDER) {
        console.warn("[nationsearch] TLS certificate information unavailable; skipping pin verification");
        return;
      }

      const digest = await crypto.subtle.digest("SHA-256", certificate.rawDER);
      const actualFingerprint = normalizeFingerprint(
        Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      );
      const expected = normalizeFingerprint(expectedFingerprint);

      if (actualFingerprint !== expected) {
        throw new Error(
          `NationSearch certificate fingerprint mismatch. Expected ${expected}, received ${actualFingerprint}`,
        );
      }
    } finally {
      (conn as { close?: () => void }).close?.();
    }
  } catch (error) {
    console.error("[nationsearch] Certificate pinning failure", error);
    throw error;
  }
}

async function ensureCertificateValidated(baseUrl: string): Promise<void> {
  if (!certificateValidationPromise) {
    certificateValidationPromise = verifyCertificateFingerprint(baseUrl).catch((error) => {
      certificateValidationPromise = null;
      throw error;
    });
  }
  await certificateValidationPromise;
}

function queueOutageRequest(job: QueueJob) {
  outageActive = true;
  outageQueue.push(job);
}

async function flushOutageQueue() {
  if (drainingOutageQueue || outageQueue.length === 0) {
    return;
  }

  drainingOutageQueue = true;
  try {
    while (outageQueue.length > 0) {
      const job = outageQueue.shift();
      if (!job) continue;
      try {
        await job();
      } catch (error) {
        console.error("[nationsearch] Queued request failed", error);
      }
    }
    outageActive = false;
  } finally {
    drainingOutageQueue = false;
  }
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof NationSearchError) {
    if (OUTAGE_STATUS_CODES.has(error.status)) return false;
    return error.status >= 500 || error.status === 429;
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }
  return false;
}

interface RequestContext {
  fetchImpl: FetchLike;
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  path: string;
  init: NationSearchRequestOptions;
  timeoutMs: number;
  userAgent?: string;
  attempt: number;
  skipQueue?: boolean;
}

async function requestWithRetry(ctx: RequestContext): Promise<unknown> {
  const {
    fetchImpl,
    baseUrl,
    apiKey,
    apiSecret,
    path,
    init,
    timeoutMs,
    userAgent,
    attempt,
    skipQueue = false,
  } = ctx;

  await ensureCertificateValidated(baseUrl);

  const url = `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const {
    method: initMethod,
    body,
    headers: initHeaders,
    idempotencyKey,
    retryCount: _retryCount,
    ...restInit
  } = init;

  const method = initMethod ?? (body ? "POST" : "GET");
  const bodyString = body
    ? typeof body === "string"
      ? body
      : JSON.stringify(body)
    : undefined;

  const headers = new Headers(initHeaders ?? {});
  headers.set("Authorization", `Bearer ${apiKey}`);
  headers.set("Content-Type", "application/json");
  if (userAgent) headers.set("User-Agent", userAgent);
  if (idempotencyKey) headers.set(IDEMPOTENCY_HEADER, idempotencyKey);

  if (bodyString) {
    const signature = await hmacSha256(apiSecret, bodyString);
    headers.set(SIGNATURE_HEADER, signature);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      ...restInit,
      method,
      body: bodyString,
      headers,
      signal: controller.signal,
    });

    const text = await response.text();
    const json = text ? JSON.parse(text) : undefined;

    if (!response.ok) {
      const payload = json as NationSearchErrorPayload | undefined;
      const message = payload?.message ?? `NationSearch request failed with status ${response.status}`;
      const error = new NationSearchError(message, response.status, payload);

      if (!skipQueue && OUTAGE_STATUS_CODES.has(response.status)) {
        queueOutageRequest(() => requestWithRetry({ ...ctx, attempt: 0, skipQueue: true }));
        throw new NationSearchOutageError(message, payload);
      }

      throw error;
    }

    if (outageActive) {
      await flushOutageQueue();
    }

    return json;
  } catch (error) {
    if (attempt < MAX_RETRIES && shouldRetry(error)) {
      const backoffMs = timeoutMs * Math.pow(2, attempt);
      await delay(Math.min(backoffMs, 60_000));
      return requestWithRetry({ ...ctx, attempt: attempt + 1 });
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function getBaseConfig(): Required<Pick<NationSearchClientOptions, "apiKey" | "apiSecret" | "baseUrl">> {
  const apiKey = Deno.env.get("NATIONSEARCH_API_KEY") ?? "";
  const apiSecret = Deno.env.get("NATIONSEARCH_API_SECRET") ?? "";
  const baseUrl = Deno.env.get("NATIONSEARCH_BASE_URL") ?? "https://api.nationsearch.com/v1";

  if (!apiKey || !apiSecret) {
    throw new Error(
      "NationSearch credentials are not configured. Set NATIONSEARCH_API_KEY and NATIONSEARCH_API_SECRET.",
    );
  }

  return { apiKey, apiSecret, baseUrl };
}

export function createNationSearchClient(options: NationSearchClientOptions = {}) {
  const { apiKey, apiSecret, baseUrl } = getBaseConfig();
  const resolvedBaseUrl = options.baseUrl ?? baseUrl;
  const resolvedApiKey = options.apiKey ?? apiKey;
  const resolvedApiSecret = options.apiSecret ?? apiSecret;
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const userAgent =
    options.userAgent ??
    `nationsearch-client/1.1 (runtime=deno; commit=${Deno.env.get("RELEASE_VERSION") ?? "dev"})`;

  return {
    async initiateCheck(payload: InitiateCheckPayload, idempotencyKey = crypto.randomUUID()): Promise<InitiateCheckResponse> {
      const response = await requestWithRetry({
        fetchImpl,
        baseUrl: resolvedBaseUrl,
        apiKey: resolvedApiKey,
        apiSecret: resolvedApiSecret,
        path: "/checks",
        init: {
          method: "POST",
          body: payload,
          idempotencyKey,
        },
        timeoutMs,
        userAgent,
        attempt: 0,
      });

      return response as InitiateCheckResponse;
    },

    async fetchCheckStatus(checkId: string): Promise<CheckStatusResponse> {
      const response = await requestWithRetry({
        fetchImpl,
        baseUrl: resolvedBaseUrl,
        apiKey: resolvedApiKey,
        apiSecret: resolvedApiSecret,
        path: `/checks/${checkId}`,
        init: { method: "GET" },
        timeoutMs,
        userAgent,
        attempt: 0,
      });

      return response as CheckStatusResponse;
    },

    async submitDocument(checkId: string, payload: SubmitDocumentPayload): Promise<JsonRecord | undefined> {
      const response = await requestWithRetry({
        fetchImpl,
        baseUrl: resolvedBaseUrl,
        apiKey: resolvedApiKey,
        apiSecret: resolvedApiSecret,
        path: `/checks/${checkId}/documents`,
        init: {
          method: "POST",
          body: payload,
        },
        timeoutMs,
        userAgent,
        attempt: 0,
      });

      return response as JsonRecord | undefined;
    },

    async cancelCheck(checkId: string, reason?: string): Promise<JsonRecord | undefined> {
      const response = await requestWithRetry({
        fetchImpl,
        baseUrl: resolvedBaseUrl,
        apiKey: resolvedApiKey,
        apiSecret: resolvedApiSecret,
        path: `/checks/${checkId}`,
        init: {
          method: "DELETE",
          body: reason ? { reason } : undefined,
        },
        timeoutMs,
        userAgent,
        attempt: 0,
      });

      return response as JsonRecord | undefined;
    },

    async verifyWebhookSignature(signature: string, rawBody: string): Promise<boolean> {
      const expected = await hmacSha256(resolvedApiSecret, rawBody);
      const a = textEncoder.encode(signature);
      const b = textEncoder.encode(expected);
      if (a.length !== b.length) return false;
      let result = 0;
      for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i];
      }
      return result === 0;
    },

    async retryQueuedRequests(): Promise<void> {
      await flushOutageQueue();
    },

    getQueuedRequestCount(): number {
      return outageQueue.length;
    },

    isOutageActive(): boolean {
      return outageActive;
    },
  };
}

export type NationSearchClient = ReturnType<typeof createNationSearchClient>;