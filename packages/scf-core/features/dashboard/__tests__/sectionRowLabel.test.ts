import { describe, expect, it } from 'vitest'
import { sectionRowLabel } from '../completion/sectionRowLabel'

describe('sectionRowLabel (#1418)', () => {
  it('counts a section that completes at more than one item', () => {
    expect(
      sectionRowLabel({ title: 'Core Skills', progress: { current: 1, required: 3 } })
    ).toBe('Core Skills · 1 of 3')
  })

  it('leaves a one-item section and a section without a count as its title', () => {
    expect(
      sectionRowLabel({ title: 'Certifications', progress: { current: 0, required: 1 } })
    ).toBe('Certifications')
    expect(sectionRowLabel({ title: 'Education' })).toBe('Education')
  })
})
