import { describe, expect, it } from 'vitest'
import {
  apiKeyStatus,
  apiKeyTierLabel,
  maskApiKey,
  matchesApiKeySearch,
  partitionApiKeys,
  visibleScopes,
  type ApiKeyRowInput,
} from '../api-key-rows'

const key = (overrides: Partial<ApiKeyRowInput> = {}): ApiKeyRowInput => ({
  name: 'Payroll sync',
  key_prefix: 'sk_live_ab12',
  scopes: ['read:jobs'],
  rate_limit_tier: 'free',
  is_active: true,
  expires_at: null,
  ...overrides,
})

const now = new Date('2026-10-17T12:00:00Z')

describe('apiKeyStatus (#1207)', () => {
  it('reads a revoked key as revoked, whatever its expiry', () => {
    expect(apiKeyStatus(key({ is_active: false, expires_at: '2020-01-01' }), now)).toBe('revoked')
  })

  it('reads a live key past its expiry as expired', () => {
    expect(apiKeyStatus(key({ expires_at: '2026-10-16T00:00:00Z' }), now)).toBe('expired')
  })

  it('reads a live key with a future or no expiry as active', () => {
    expect(apiKeyStatus(key({ expires_at: '2027-01-01T00:00:00Z' }), now)).toBe('active')
    expect(apiKeyStatus(key(), now)).toBe('active')
  })

  it('ignores an unparseable expiry rather than calling the key expired', () => {
    expect(apiKeyStatus(key({ expires_at: 'not a date' }), now)).toBe('active')
  })
})

describe('partitionApiKeys (#1207)', () => {
  it('puts revoked keys on their own tab and keeps expired-but-live keys active', () => {
    const live = key({ name: 'live' })
    const expired = key({ name: 'expired', expires_at: '2020-01-01' })
    const revoked = key({ name: 'revoked', is_active: false })
    const { active, revoked: gone } = partitionApiKeys([live, revoked, expired])
    expect(active.map((k) => k.name)).toEqual(['live', 'expired'])
    expect(gone.map((k) => k.name)).toEqual(['revoked'])
  })
})

describe('apiKeyTierLabel', () => {
  it('names the tier with its limit', () => {
    expect(apiKeyTierLabel('free')).toBe('Free · 100/min')
    expect(apiKeyTierLabel('enterprise')).toBe('Enterprise · 10,000/min')
  })

  it('does not invent a limit for an unknown tier', () => {
    expect(apiKeyTierLabel('beta')).toBe('Beta')
  })
})

describe('maskApiKey / visibleScopes / matchesApiKeySearch', () => {
  it('masks after the stored prefix', () => {
    expect(maskApiKey('sk_live_ab12')).toBe('sk_live_ab12••••••••')
  })

  it('shows two scopes and counts the rest', () => {
    expect(visibleScopes(['a', 'b'])).toEqual({ shown: ['a', 'b'], hidden: 0 })
    expect(visibleScopes(['a', 'b', 'c', 'd'])).toEqual({ shown: ['a', 'b'], hidden: 2 })
  })

  it('matches on name or prefix, case-insensitively', () => {
    expect(matchesApiKeySearch(key(), 'PAYROLL')).toBe(true)
    expect(matchesApiKeySearch(key(), 'ab12')).toBe(true)
    expect(matchesApiKeySearch(key(), 'zzz')).toBe(false)
    expect(matchesApiKeySearch(key(), '  ')).toBe(true)
  })
})
