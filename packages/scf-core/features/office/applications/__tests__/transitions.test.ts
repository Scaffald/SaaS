/**
 * The stage-transition table, now that it is reachable.
 *
 * It used to live inside a useCallback inside a hook, so nothing could ask
 * "what is legal from here?" — which is why the board could not close illegal
 * drop targets during a drag (§12 #13) and why no keyboard or touch path could
 * offer a list of legal moves (§12 #12). Exporting it is the fix; these are the
 * tests that keep it honest.
 */
import { describe, expect, it } from 'vitest'
import {
  ALLOWED_TRANSITIONS,
  allowedTargetsFor,
  isValidStatusTransition,
} from '../hooks/useApplicationStatusChange'
import { nextStageFor } from '../candidate-actions'
import type { ApplicationStatus } from '../types'

const ALL: ApplicationStatus[] = [
  'new',
  'screen',
  'inquired',
  'interview',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
]

describe('ALLOWED_TRANSITIONS', () => {
  it('covers every status, so a lookup can never be undefined', () => {
    for (const status of ALL) {
      expect(ALLOWED_TRANSITIONS[status]).toBeDefined()
    }
  })

  it('treats hired, rejected and withdrawn as terminal', () => {
    for (const status of ['hired', 'rejected', 'withdrawn'] as ApplicationStatus[]) {
      expect(allowedTargetsFor(status)).toEqual([])
    }
  })

  it('never allows a move to the same stage', () => {
    for (const status of ALL) {
      expect(allowedTargetsFor(status)).not.toContain(status)
    }
  })

  it('never offers withdrawn as an employer move', () => {
    // Withdrawal is the candidate's, via POST /v1/applications/{id}/withdraw.
    for (const status of ALL) {
      expect(allowedTargetsFor(status)).not.toContain('withdrawn')
    }
  })

  it('lets every live stage reject', () => {
    for (const status of ['new', 'screen', 'inquired', 'interview', 'offer'] as ApplicationStatus[]) {
      expect(isValidStatusTransition(status, 'rejected')).toBe(true)
    }
  })

  it('only reaches hired from offer', () => {
    const canHire = ALL.filter((s) => isValidStatusTransition(s, 'hired'))
    expect(canHire).toEqual(['offer'])
  })

  it('refuses to skip from new straight to an offer', () => {
    expect(isValidStatusTransition('new', 'offer')).toBe(false)
    expect(isValidStatusTransition('new', 'hired')).toBe(false)
  })

  it('refuses to move backwards', () => {
    expect(isValidStatusTransition('interview', 'screen')).toBe(false)
    expect(isValidStatusTransition('offer', 'interview')).toBe(false)
  })
})

describe('isValidStatusTransition', () => {
  it('is false for an unknown source rather than throwing', () => {
    expect(isValidStatusTransition('nonsense' as ApplicationStatus, 'screen')).toBe(false)
  })

  it('agrees with allowedTargetsFor for every pair', () => {
    for (const from of ALL) {
      for (const to of ALL) {
        expect(isValidStatusTransition(from, to)).toBe(allowedTargetsFor(from).includes(to))
      }
    }
  })
})

describe('the advance button agrees with the table', () => {
  it('never proposes a move the transition table forbids', () => {
    // The candidate-detail header and the board read from two different
    // sources — NEXT_STAGE and ALLOWED_TRANSITIONS. If they drift, the header
    // offers a button that the guard silently refuses, which is exactly the
    // class of bug §12 #1 was.
    for (const from of ALL) {
      const next = nextStageFor(from)
      if (!next) continue
      expect(isValidStatusTransition(from, next.status)).toBe(true)
    }
  })

  it('offers an advance from every non-terminal stage', () => {
    for (const from of ['new', 'screen', 'inquired', 'interview', 'offer'] as ApplicationStatus[]) {
      expect(nextStageFor(from)).not.toBeNull()
    }
  })
})
