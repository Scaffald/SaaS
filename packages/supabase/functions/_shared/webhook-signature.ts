/**
 * Standard Webhooks signature check (`webhook-id`, `webhook-timestamp`,
 * `webhook-signature: v1,<base64 HMAC-SHA256 of "{id}.{timestamp}.{body}">`).
 *
 * Two senders use it with one difference in how the secret becomes a key:
 *
 * - Supabase Auth hooks (`v1,whsec_<base64>`): the part after `whsec_` is
 *   base64 and is DECODED to get the key bytes (`keyEncoding: "base64"`).
 * - NevarMail webhook endpoints (`whsec_<base64url>`): the part after `whsec_`
 *   is used AS-IS, its UTF-8 bytes are the key (`keyEncoding: "utf8"`); see
 *   NVS-Mail src/lib/webhooks/sign.ts, which passes the string to createHmac.
 *
 * Returns false (never throws) on anything malformed, stale or unsigned.
 */

const TOLERANCE_SECONDS = 5 * 60;

export interface WebhookSignatureHeaders {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
}

export type WebhookKeyEncoding = "base64" | "utf8";

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

export async function verifyStandardWebhook(
  secret: string,
  headers: WebhookSignatureHeaders,
  body: string,
  opts: { keyEncoding: WebhookKeyEncoding; nowSeconds?: number },
): Promise<boolean> {
  const { id, timestamp, signature } = headers;
  if (!secret || !id || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > TOLERANCE_SECONDS) {
    return false;
  }

  const raw = secret.replace(/^v1,/, "").replace(/^whsec_/, "");
  if (!raw) return false;
  let keyBytes: Uint8Array<ArrayBuffer>;
  try {
    keyBytes = opts.keyEncoding === "base64"
      ? b64ToBytes(raw)
      : new TextEncoder().encode(raw) as Uint8Array<ArrayBuffer>;
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
