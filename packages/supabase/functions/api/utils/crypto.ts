/**
 * Cryptographic utilities for API key generation and hashing
 */

const BASE62_CHARSET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Generate a cryptographically secure random string using Base62 encoding
 */
function generateSecureToken(length: number): string {
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);

  let result = "";
  for (let i = 0; i < length; i++) {
    result += BASE62_CHARSET[randomBytes[i] % BASE62_CHARSET.length];
  }

  return result;
}

/**
 * Generate a new API key in the format: sk_live_<32_chars>
 */
export function generateApiKey(environment: "test" | "live" = "live"): string {
  const prefix = environment === "test" ? "sk_test" : "sk_live";
  const randomPart = generateSecureToken(32);
  return `${prefix}_${randomPart}`;
}

/**
 * Hash an API key using SHA-256
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return hashHex;
}

/**
 * Extract the prefix from an API key (e.g., 'sk_live_abc...' -> 'sk_live_abc...')
 * Returns the first 16 characters for display
 */
export function getApiKeyPrefix(apiKey: string): string {
  // Return first 16 characters of the key for display
  // Format: sk_live_abcdefgh...
  return `${apiKey.substring(0, 16)}...`;
}

/**
 * Verify an API key against its hash
 */
export async function verifyApiKey(
  apiKey: string,
  hash: string,
): Promise<boolean> {
  const computedHash = await hashApiKey(apiKey);
  return computedHash === hash;
}

/**
 * Generate a HMAC-SHA256 signature for webhook verification
 */
export async function generateWebhookSignature(
  payload: string,
  secret: string,
): Promise<string> {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");

  return signatureHex;
}

/**
 * Verify a webhook signature
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const computedSignature = await generateWebhookSignature(payload, secret);

  // Timing-safe comparison
  if (signature.length !== computedSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ computedSignature.charCodeAt(i);
  }

  return result === 0;
}
