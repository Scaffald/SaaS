import { describe, expect, it } from 'vitest'
import { EMPLOYER_MOBILE_SECTIONS, MOBILE_SECTIONS, type MobileSection } from '../config'

/**
 * The phone bar mirrors the role you are in. Two things have gone wrong here
 * before and both are cheap to assert:
 *
 *   1. A tab lit up on a route it does not own (#385 — Home stayed highlighted
 *      on employer screens, because those routes were listed under Home).
 *   2. Employer mode had no bar at all, because hiding it was the fix for (1).
 *
 * These tests pin the shape of both sets rather than the rendering, so they do
 * not need react-native.
 */

/** Mirrors getActiveSectionIndex in MobileBottomNav. */
const activeIndex = (pathname: string, sections: MobileSection[]): number =>
  sections.findIndex((s) =>
    s.matchPrefixes.some((p) => pathname === p || pathname.startsWith(p))
  )

const sets: Array<[string, MobileSection[]]> = [
  ['worker', MOBILE_SECTIONS],
  ['employer', EMPLOYER_MOBILE_SECTIONS],
]

describe.each(sets)('%s tab set', (_name, sections) => {
  it('has between 3 and 5 tabs', () => {
    // Below 3 is not a bar; above 5 is where the prototype adds "More".
    expect(sections.length).toBeGreaterThanOrEqual(3)
    expect(sections.length).toBeLessThanOrEqual(5)
  })

  it('gives every tab a unique key', () => {
    expect(new Set(sections.map((s) => s.key)).size).toBe(sections.length)
  })

  it('lights the tab you land on when you tap it', () => {
    // A tab whose own route does not match its prefixes navigates somewhere
    // that leaves the bar showing nothing selected.
    for (const s of sections) {
      expect(activeIndex(s.route, sections), `${s.key} -> ${s.route}`).toBe(
        sections.indexOf(s)
      )
    }
  })

  it('never lets two tabs claim the same route', () => {
    for (const s of sections) {
      const claimants = sections.filter((o) =>
        o.matchPrefixes.some((p) => s.route === p || s.route.startsWith(p))
      )
      expect(claimants.map((c) => c.key)).toEqual([s.key])
    }
  })
})

describe('the two sets stay out of each other’s routes', () => {
  it('does not light a worker tab on an employer route', () => {
    for (const s of EMPLOYER_MOBILE_SECTIONS) {
      expect(activeIndex(s.route, MOBILE_SECTIONS), s.route).toBe(-1)
    }
  })

  it('does not light an employer tab on a worker route', () => {
    for (const s of MOBILE_SECTIONS) {
      expect(activeIndex(s.route, EMPLOYER_MOBILE_SECTIONS), s.route).toBe(-1)
    }
  })

  it('returns -1 for a route no tab owns, rather than falling back to Home', () => {
    // The #385 regression: settings and profile lit up Home.
    for (const [, sections] of sets) {
      expect(activeIndex('/settings', sections)).toBe(-1)
      expect(activeIndex('/profile', sections)).toBe(-1)
    }
  })
})

describe('employer tabs point at surfaces that exist', () => {
  it('routes to real screens, not a placeholder Recruiting tab', () => {
    // The prototype's bar is Talent/Apps/Jobs/Recruiting/More. Recruiting is
    // omitted on purpose until that surface exists — assert it stays omitted so
    // nobody adds a tab that navigates nowhere.
    expect(EMPLOYER_MOBILE_SECTIONS.map((s) => s.key)).toEqual([
      'talent',
      'applications',
      'office-jobs',
      'screening',
    ])
  })

  it('keeps the whole ATS cluster under Screening', () => {
    const i = EMPLOYER_MOBILE_SECTIONS.findIndex((s) => s.key === 'screening')
    for (const p of ['/office/ats/checks', '/office/ats/admin', '/office/ats/metrics']) {
      expect(activeIndex(p, EMPLOYER_MOBILE_SECTIONS), p).toBe(i)
    }
  })
})
