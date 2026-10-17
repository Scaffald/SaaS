import { describe, expect, it } from 'vitest'
import {
  canReject,
  countSuffix,
  formatAppliedAgo,
  initialsOf,
  nextStageFor,
} from '../candidate-actions'
import type { ApplicationStatus } from '../types'

describe('nextStageFor — §12 #1, the advance button', () => {
  it('advances New to Screening, not straight to Interview', () => {
    // The old header said "Advance to Interview" on every stage, which from
    // New would have skipped Screening entirely.
    expect(nextStageFor('new')).toEqual({ status: 'screen', label: 'Screening' })
  })

  it('walks the pipeline in order', () => {
    expect(nextStageFor('screen')?.status).toBe('interview')
    expect(nextStageFor('interview')?.status).toBe('offer')
    expect(nextStageFor('offer')?.status).toBe('hired')
  })

  it('rejoins at Interview from an inquiry', () => {
    expect(nextStageFor('inquired')?.status).toBe('interview')
  })

  it('offers nothing from a terminal stage', () => {
    for (const status of ['hired', 'rejected', 'withdrawn'] as ApplicationStatus[]) {
      expect(nextStageFor(status)).toBeNull()
    }
  })

  it('never advances a candidate into the stage they are already in', () => {
    const stages: ApplicationStatus[] = ['new', 'screen', 'inquired', 'interview', 'offer']
    for (const status of stages) {
      expect(nextStageFor(status)?.status).not.toBe(status)
    }
  })
})

describe('canReject', () => {
  it('allows rejection anywhere in the live pipeline', () => {
    for (const status of ['new', 'screen', 'inquired', 'interview', 'offer', 'hired'] as ApplicationStatus[]) {
      expect(canReject(status)).toBe(true)
    }
  })

  it('refuses to reject a candidate who already withdrew', () => {
    // Collapsing withdrawn into rejected is what breaks funnel conversion and
    // EEO adverse-impact counts (#533).
    expect(canReject('withdrawn')).toBe(false)
  })

  it('refuses to reject an already-rejected candidate', () => {
    expect(canReject('rejected')).toBe(false)
  })
})

describe('initialsOf — §12 #3, the avatar', () => {
  it('takes two initials from a full name', () => {
    expect(initialsOf('Alice Chen')).toBe('AC')
  })

  it('takes one from a single name', () => {
    expect(initialsOf('Cher')).toBe('C')
  })

  it('stops at two for a long name', () => {
    expect(initialsOf('Maria Elena Rodriguez Vasquez')).toBe('ME')
  })

  it('handles extra whitespace without producing empty initials', () => {
    expect(initialsOf('  Alice   Chen  ')).toBe('AC')
  })

  it('falls back to ? rather than rendering an empty circle', () => {
    expect(initialsOf('')).toBe('?')
    expect(initialsOf('   ')).toBe('?')
  })
})

describe('countSuffix — §12 #15, tab counts', () => {
  it('shows a real count', () => {
    expect(countSuffix(12)).toBe(' · 12')
  })

  it('stays empty while the count is unknown', () => {
    // Loading. A tab that flashes "· 0" then "· 12" is worse than one that
    // simply gains a count.
    expect(countSuffix(null)).toBe('')
    expect(countSuffix(undefined)).toBe('')
  })

  it('stays empty at zero — the absence already says it', () => {
    expect(countSuffix(0)).toBe('')
  })
})

describe('formatAppliedAgo (#1200)', () => {
  const NOW = new Date('2026-10-17T12:00:00Z').getTime()
  const ago = (days: number) => new Date(NOW - days * 86_400_000).toISOString()

  it('reads as a relative age', () => {
    expect(formatAppliedAgo(ago(0), NOW)).toBe('today')
    expect(formatAppliedAgo(ago(1), NOW)).toBe('1d ago')
    expect(formatAppliedAgo(ago(21), NOW)).toBe('3w ago')
    expect(formatAppliedAgo(ago(90), NOW)).toBe('3mo ago')
  })

  it('does not go negative on a clock-skewed future date', () => {
    expect(formatAppliedAgo(ago(-2), NOW)).toBe('today')
  })

  it('says nothing it cannot parse', () => {
    expect(formatAppliedAgo('not a date', NOW)).toBe('—')
  })
})
