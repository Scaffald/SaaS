import { describe, expect, it } from 'vitest'
import { normalizeOrganizationSlug } from '../normalizeOrganizationSlug'

describe('normalizeOrganizationSlug', () => {
  it('lowercases and trims whitespace', () => {
    expect(normalizeOrganizationSlug('  Acme Builders  ')).toBe('acme-builders')
  })

  it('collapses consecutive separators', () => {
    expect(normalizeOrganizationSlug('Acme---Construction__Co')).toBe('acme-construction-co')
  })

  it('removes leading and trailing separators', () => {
    expect(normalizeOrganizationSlug('-Acme-Construction-')).toBe('acme-construction')
  })

  it('keeps alphanumeric characters intact', () => {
    expect(normalizeOrganizationSlug('Acme123')).toBe('acme123')
  })

  it('returns empty string for non-alphanumeric input', () => {
    expect(normalizeOrganizationSlug('!!!')).toBe('')
  })
})


