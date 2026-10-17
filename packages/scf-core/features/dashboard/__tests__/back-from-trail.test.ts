import { describe, expect, it } from 'vitest'
import { backFromTrail } from '../back-from-trail'

/** A drill-in's "← Parent" link, read off the trail it declares (#1163). */
describe('backFromTrail', () => {
  it('names the parent of a drill-in', () => {
    expect(
      backFromTrail([
        { label: 'Home', href: '/dashboard' },
        { label: 'Jobs', href: '/jobs/browse' },
        { label: 'Pipe Welder' },
      ])
    ).toEqual({ label: 'Jobs', href: '/jobs/browse' })
  })

  it('gives a top-level screen no back link — Dashboard and the page itself', () => {
    expect(backFromTrail([{ label: 'Home', href: '/dashboard' }, { label: 'Settings' }])).toBeNull()
    expect(backFromTrail(undefined)).toBeNull()
  })

  it('skips a parent crumb with no link and takes the nearest one that has one', () => {
    expect(
      backFromTrail([
        { label: 'Home', href: '/dashboard' },
        { label: 'Teams', href: '/employers/teams' },
        { label: 'Loading…' },
        { label: 'Members' },
      ])
    ).toEqual({ label: 'Teams', href: '/employers/teams' })
  })

  it('never offers Dashboard itself as the way back', () => {
    expect(
      backFromTrail([{ label: 'Home', href: '/dashboard' }, { label: 'Untitled' }, { label: 'Page' }])
    ).toBeNull()
  })
})
