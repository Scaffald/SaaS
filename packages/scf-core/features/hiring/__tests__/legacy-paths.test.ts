import { describe, expect, it } from 'vitest'
import { isLegacyHiringPath, legacyHiringTarget } from '../legacy-paths'

describe('legacy hiring paths (#1312)', () => {
  it('recognises the old pipeline and its children', () => {
    expect(isLegacyHiringPath('/office/applications')).toBe(true)
    expect(isLegacyHiringPath('/office/applications/abc')).toBe(true)
    expect(isLegacyHiringPath('/office/applications/abc/inquiry')).toBe(true)
    expect(isLegacyHiringPath('/office/applications/abc/hire')).toBe(true)
  })

  it('leaves the rest of Office gated', () => {
    expect(isLegacyHiringPath('/office')).toBe(false)
    expect(isLegacyHiringPath('/office/ats')).toBe(false)
    expect(isLegacyHiringPath('/office/applications-report')).toBe(false)
    expect(isLegacyHiringPath('/office/cms/jobs')).toBe(false)
    expect(isLegacyHiringPath('')).toBe(false)
    expect(isLegacyHiringPath(null)).toBe(false)
  })

  it('maps each old path onto the same screen under /hiring', () => {
    expect(legacyHiringTarget('/office/applications')).toBe('/hiring/applications')
    expect(legacyHiringTarget('/office/applications/abc')).toBe('/hiring/applications/abc')
    expect(legacyHiringTarget('/office/applications/abc/inquiry')).toBe(
      '/hiring/applications/abc/inquiry'
    )
    expect(legacyHiringTarget('/office/applications/abc/hire')).toBe(
      '/hiring/applications/abc/hire'
    )
  })

  it('has no target for a path that is not a legacy one', () => {
    expect(legacyHiringTarget('/office/ats')).toBeNull()
    expect(legacyHiringTarget('/hiring/applications')).toBeNull()
    expect(legacyHiringTarget(undefined)).toBeNull()
  })
})
