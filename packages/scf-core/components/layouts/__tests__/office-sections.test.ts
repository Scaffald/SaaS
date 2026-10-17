import { describe, expect, it } from 'vitest'
import { findActiveOfficeSection, findActiveSubTab } from '../office-sections'

describe('findActiveSubTab', () => {
  const tabs = [
    { href: '/office/ats/checks', owns: ['/office/ats/request', '/office/ats/admin'] },
    { href: '/office/ats/id-verifications' },
    { href: '/office/ats/metrics' },
  ]

  it('lights a tab on its own page', () => {
    expect(findActiveSubTab('/office/ats/metrics', tabs)?.href).toBe('/office/ats/metrics')
  })

  // #1202: request and admin are Background Checks' children in the route
  // tree, but sit beside its path rather than under it.
  it('lights a tab on a child page that lives at a sibling path', () => {
    expect(findActiveSubTab('/office/ats/request', tabs)?.href).toBe('/office/ats/checks')
    expect(findActiveSubTab('/office/ats/admin', tabs)?.href).toBe('/office/ats/checks')
  })

  it('lights nothing for a page no tab owns', () => {
    expect(findActiveSubTab('/office/ats/scheduling', tabs)).toBeUndefined()
    expect(findActiveSubTab('/office/ats/checksum', tabs)).toBeUndefined()
  })
})

const sections = [{ path: '/office/cms' }, { path: '/office/ats' }, { path: '/office/applications' }]

describe('findActiveOfficeSection', () => {
  it('finds the section a page is inside', () => {
    expect(findActiveOfficeSection('/office/cms/workers', sections)?.path).toBe('/office/cms')
    expect(findActiveOfficeSection('/office/ats', sections)?.path).toBe('/office/ats')
  })

  // It fell back to the first section, so pages outside every section drew
  // CMS's sub-tabs with "Workers" underlined (#1098).
  it('returns nothing for a page outside every section, rather than the first one', () => {
    expect(findActiveOfficeSection('/office/settings/geographic', sections)).toBeUndefined()
    expect(findActiveOfficeSection('/office/oauth-apps', sections)).toBeUndefined()
  })

  it('does not match a section by a shared prefix', () => {
    expect(findActiveOfficeSection('/office/cmsx', sections)).toBeUndefined()
  })
})
