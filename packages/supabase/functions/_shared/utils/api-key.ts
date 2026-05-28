/**
 * API Key Utilities
 * Handles API key generation, hashing, and validation for third-party API access
 */

/**
 * Generate a cryptographically secure random API key
 *
 * Format: sk_{env}_{random32chars}
 * - sk = "secret key"
 * - env = "test" or "live"
 * - random32chars = base62 encoded random bytes
 *
 * @param environment - 'test' or 'live'
 * @returns Full API key (only shown once to user)
 *
 * @example
 * const apiKey = generateApiKey('live')
 * // Returns: "sk_live_A1b2C3d4E5f6G7h8I9j0K1l2M3n4"
 */
export function generateApiKey(environment: 'test' | 'live' = 'live'): string {
  const prefix = `sk_${environment}`

  // Generate 24 random bytes (192 bits)
  const randomBytes = new Uint8Array(24)
  crypto.getRandomValues(randomBytes)

  // Convert to base62 (alphanumeric only, URL-safe). base62Encode pads to a
  // 32-char minimum, but 24 bytes can encode to 33 chars (~64% of the time),
  // which fails validateApiKeyFormat's exact-32 check and makes the key unusable
  // for api-key auth. Keep the low 32 digits so the result is always exactly 32.
  const randomPart = base62Encode(randomBytes).slice(-32)

  return `${prefix}_${randomPart}`
}

/**
 * Extract the key prefix for display purposes
 * Shows only the prefix and first 4 characters of the random part
 *
 * @param apiKey - Full API key
 * @returns Masked key for display (e.g., "sk_live_A1b2...")
 *
 * @example
 * const display = getKeyPrefix('sk_live_A1b2C3d4E5f6G7h8I9j0K1l2M3n4')
 * // Returns: "sk_live_A1b2..."
 */
export function getKeyPrefix(apiKey: string): string {
  const parts = apiKey.split('_')
  if (parts.length !== 3) {
    throw new Error('Invalid API key format')
  }

  const [sk, env, random] = parts
  return `${sk}_${env}_${random.substring(0, 4)}...`
}

/**
 * Hash API key using SHA-256
 * Used for secure storage in database
 *
 * @param apiKey - Full API key to hash
 * @returns Hex-encoded SHA-256 hash
 *
 * @example
 * const hash = await hashApiKey('sk_live_A1b2C3d4E5f6G7h8I9j0K1l2M3n4')
 * // Returns: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(apiKey)

  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  // Convert to hex string
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate API key format
 *
 * @param apiKey - API key to validate
 * @returns true if valid format
 *
 * @example
 * validateApiKeyFormat('sk_live_A1b2C3d4E5f6G7h8I9j0K1l2M3n4') // true
 * validateApiKeyFormat('invalid_key') // false
 */
export function validateApiKeyFormat(apiKey: string): boolean {
  // Format: sk_{test|live}_{32 base62 chars}
  const pattern = /^sk_(test|live)_[A-Za-z0-9]{32}$/
  return pattern.test(apiKey)
}

/**
 * Base62 encode bytes (alphanumeric only)
 * Uses charset: 0-9, A-Z, a-z (62 characters)
 *
 * @param bytes - Bytes to encode
 * @returns Base62 encoded string
 */
function base62Encode(bytes: Uint8Array): string {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

  // Convert bytes to big integer
  let num = 0n
  for (const byte of bytes) {
    num = num * 256n + BigInt(byte)
  }

  // Convert to base62
  const result: string[] = []
  while (num > 0n) {
    const remainder = Number(num % 62n)
    result.unshift(charset[remainder])
    num = num / 62n
  }

  // Pad to 32 characters for consistency
  while (result.length < 32) {
    result.unshift('0')
  }

  return result.join('')
}

/**
 * Get environment from API key
 *
 * @param apiKey - Full API key
 * @returns 'test' or 'live'
 */
export function getKeyEnvironment(apiKey: string): 'test' | 'live' {
  const parts = apiKey.split('_')
  if (parts.length !== 3 || (parts[1] !== 'test' && parts[1] !== 'live')) {
    throw new Error('Invalid API key format')
  }

  return parts[1] as 'test' | 'live'
}

/**
 * Rate limit configuration by tier
 */
export const RATE_LIMITS = {
  free: {
    requestsPerMinute: 100,
    requestsPerHour: 5000,
    requestsPerDay: 100000,
  },
  pro: {
    requestsPerMinute: 1000,
    requestsPerHour: 50000,
    requestsPerDay: 1000000,
  },
  enterprise: {
    requestsPerMinute: 10000,
    requestsPerHour: 500000,
    requestsPerDay: 10000000,
  },
} as const

/**
 * Get rate limit for tier
 *
 * @param tier - Rate limit tier
 * @returns Rate limit configuration
 */
export function getRateLimit(tier: 'free' | 'pro' | 'enterprise') {
  return RATE_LIMITS[tier]
}
