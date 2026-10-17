/**
 * What the API keys table shows for a key, kept apart from the component so
 * it can be tested without React Native (#1207).
 *
 * The list used to be one 300px card per key with revoked keys interleaved at
 * the same weight. It is now a ruled table behind an Active / Revoked folder
 * tab, so which partition a key belongs to, and what its status tag says,
 * have to be decided in exactly one place.
 */

export type ApiKeyTab = 'active' | 'revoked'

export type ApiKeyStatus = 'active' | 'expired' | 'revoked'

export interface ApiKeyRowInput {
  name: string
  key_prefix: string
  scopes: string[]
  rate_limit_tier: string
  is_active: boolean
  expires_at: string | null
}

/**
 * Revoked is a fact recorded on the key; expired is a fact about the clock.
 * An expired key that was never revoked still sits on the Active tab — it is
 * the operator's to revoke or replace — but its tag says it no longer works.
 */
export function apiKeyStatus(key: ApiKeyRowInput, now: Date = new Date()): ApiKeyStatus {
  if (!key.is_active) return 'revoked'
  if (key.expires_at) {
    const expires = new Date(key.expires_at)
    if (!Number.isNaN(expires.getTime()) && expires.getTime() <= now.getTime()) return 'expired'
  }
  return 'active'
}

export function apiKeyTab(key: ApiKeyRowInput): ApiKeyTab {
  return key.is_active ? 'active' : 'revoked'
}

export function partitionApiKeys<T extends ApiKeyRowInput>(keys: T[]): Record<ApiKeyTab, T[]> {
  const result: Record<ApiKeyTab, T[]> = { active: [], revoked: [] }
  for (const key of keys) result[apiKeyTab(key)].push(key)
  return result
}

const TIER_LIMITS: Record<string, string> = {
  free: '100/min',
  pro: '1,000/min',
  enterprise: '10,000/min',
}

/** "Free · 100/min". An unknown tier prints its name and no invented limit. */
export function apiKeyTierLabel(tier: string): string {
  const name = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Unknown'
  const limit = TIER_LIMITS[tier]
  return limit ? `${name} · ${limit}` : name
}

/**
 * The stored prefix is all we have — the secret is shown once, at creation.
 * The dots say "there is more to this key" without pretending to know it.
 */
export function maskApiKey(prefix: string): string {
  return `${prefix}••••••••`
}

/** The first `max` scopes as chips and a count of the rest, so a row stays one line. */
export function visibleScopes(scopes: string[], max = 2): { shown: string[]; hidden: number } {
  if (scopes.length <= max) return { shown: scopes, hidden: 0 }
  return { shown: scopes.slice(0, max), hidden: scopes.length - max }
}

/** Case-insensitive match on the name or the key prefix. */
export function matchesApiKeySearch(key: ApiKeyRowInput, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return key.name.toLowerCase().includes(q) || key.key_prefix.toLowerCase().includes(q)
}
