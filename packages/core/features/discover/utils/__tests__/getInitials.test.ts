import { describe, expect, it } from 'vitest'

const { getInitials } = await import('../getInitials')

describe('getInitials', () => {
  it('extracts initials from multi-word names', () => {
    expect(getInitials('John Doe')).toBe('JD')
    expect(getInitials('Summit Electrical Company')).toBe('SE')
  })

  it('handles single word names', () => {
    expect(getInitials('Mary')).toBe('M')
  })

  it('returns placeholder when name is empty or invalid', () => {
    expect(getInitials('')).toBe('?')
    expect(getInitials('   ')).toBe('?')
    expect(getInitials(undefined as unknown as string)).toBe('?')
  })
})


