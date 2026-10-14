import { describe, expect, it } from 'vitest'
import { findActiveOfficeSection } from '../office-sections'

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
