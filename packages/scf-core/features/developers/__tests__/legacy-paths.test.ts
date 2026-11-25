import { describe, expect, it } from 'vitest'
import { isLegacyDevelopersPath, legacyDevelopersTarget } from '../legacy-paths'

describe('legacy developers paths (#1440)', () => {
  it('recognises the old API keys and webhooks pages and their children', () => {
    expect(isLegacyDevelopersPath('/office/api-keys')).toBe(true)
    expect(isLegacyDevelopersPath('/office/webhooks')).toBe(true)
    expect(isLegacyDevelopersPath('/office/webhooks/create')).toBe(true)
    expect(isLegacyDevelopersPath('/office/webhooks/abc')).toBe(true)
  })

  it('leaves the rest of Office gated', () => {
    expect(isLegacyDevelopersPath('/office')).toBe(false)
    expect(isLegacyDevelopersPath('/office/oauth-apps')).toBe(false)
    expect(isLegacyDevelopersPath('/office/api-keys-report')).toBe(false)
    expect(isLegacyDevelopersPath('/office/webhooksx')).toBe(false)
    expect(isLegacyDevelopersPath('/office/applications')).toBe(false)
    expect(isLegacyDevelopersPath('')).toBe(false)
    expect(isLegacyDevelopersPath(null)).toBe(false)
  })

  it('takes a member of one organization to the same screen on it', () => {
    const one = ['acme']
    expect(legacyDevelopersTarget('/office/api-keys', one)).toBe(
      '/employers/org/acme/developers/api-keys'
    )
    expect(legacyDevelopersTarget('/office/webhooks', one)).toBe(
      '/employers/org/acme/developers/webhooks'
    )
    expect(legacyDevelopersTarget('/office/webhooks/', one)).toBe(
      '/employers/org/acme/developers/webhooks'
    )
    expect(legacyDevelopersTarget('/office/webhooks/create', one)).toBe(
      '/employers/org/acme/developers/webhooks/create'
    )
    expect(legacyDevelopersTarget('/office/webhooks/abc', one)).toBe(
      '/employers/org/acme/developers/webhooks/abc'
    )
    expect(legacyDevelopersTarget('/office/webhooks/abc/deliveries', one)).toBe(
      '/employers/org/acme/developers/webhooks'
    )
  })

  it('counts an organization once however many ways the person belongs to it', () => {
    expect(legacyDevelopersTarget('/office/api-keys', ['acme', 'acme'])).toBe(
      '/employers/org/acme/developers/api-keys'
    )
  })

  it('sends a member of several organizations, or none, to My Organizations', () => {
    expect(legacyDevelopersTarget('/office/api-keys', ['acme', 'globex'])).toBe('/employers/org')
    expect(legacyDevelopersTarget('/office/webhooks/abc', ['acme', 'globex'])).toBe(
      '/employers/org'
    )
    expect(legacyDevelopersTarget('/office/webhooks', [])).toBe('/employers/org')
  })

  it('has no target for a path that is not a legacy one', () => {
    expect(legacyDevelopersTarget('/office/oauth-apps', ['acme'])).toBeNull()
    expect(legacyDevelopersTarget(undefined, ['acme'])).toBeNull()
  })
})
