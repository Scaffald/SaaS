import { describe, expect, it } from 'vitest'
import { canReject, countSuffix, initialsOf, nextStageFor } from '../candidate-actions'
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
