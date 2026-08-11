import { describe, expect, it } from 'vitest'

import type { ATSApplication } from '../../types'
import { hiredAtFrom, timeToHireDays } from '../ATSMetricsDashboard'

/**
 * Time-to-hire measured `appliedAt -> updatedAt`, which is not the hire date.
 * `updatedAt` moves on any edit — a note, an assignment, a screening tweak —
 * so it drifted further from the truth the longer a record lived.
 *
 * It also read from `stageHistory`, which the office transform hardcoded to
 * `[]`, so the metric was structurally zero regardless of the pipeline (#531).
 */

type StageChange = ATSApplication['stageHistory'][number]

function change(toStage: string, changedAt: string): StageChange {
  return {
    fromStage: null,
    toStage: toStage as StageChange['toStage'],
    changedBy: '',
    changedAt,
  }
}

function application(overrides: Partial<ATSApplication>): ATSApplication {
  return {
    appliedAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    stageHistory: [],
    ...overrides,
  } as ATSApplication
}

describe('hiredAtFrom', () => {
  it('returns the moment the hire was recorded', () => {
    expect(
      hiredAtFrom([
        change('screen', '2026-01-03T00:00:00Z'),
        change('hired', '2026-01-21T00:00:00Z'),
      ])
    ).toBe('2026-01-21T00:00:00Z')
  })

  it('ignores transitions that are not a hire', () => {
    expect(
      hiredAtFrom([
        change('screen', '2026-01-03T00:00:00Z'),
        change('offer', '2026-01-10T00:00:00Z'),
      ])
    ).toBeNull()
  })

  it('takes the latest hire when there is more than one', () => {
    // A hire after a reversal is the hire that counts.
    expect(
      hiredAtFrom([
        change('hired', '2026-01-10T00:00:00Z'),
        change('rejected', '2026-01-12T00:00:00Z'),
        change('hired', '2026-02-01T00:00:00Z'),
      ])
    ).toBe('2026-02-01T00:00:00Z')
  })

  it('does not depend on the array being ordered', () => {
    expect(
      hiredAtFrom([
        change('hired', '2026-02-01T00:00:00Z'),
        change('hired', '2026-01-10T00:00:00Z'),
      ])
    ).toBe('2026-02-01T00:00:00Z')
  })

  it('returns null rather than a plausible wrong date when empty', () => {
    expect(hiredAtFrom([])).toBeNull()
    expect(hiredAtFrom(undefined)).toBeNull()
  })
})

describe('timeToHireDays', () => {
  it('measures application to hire', () => {
    const app = application({
      appliedAt: '2026-01-01T00:00:00Z',
      stageHistory: [change('hired', '2026-01-21T00:00:00Z')],
    })

    expect(timeToHireDays(app)).toBe(20)
  })

  it('ignores updatedAt entirely', () => {
    // The regression: updatedAt sits five months after the hire, and the old
    // calculation would have reported 151 days instead of 20.
    const app = application({
      appliedAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
      stageHistory: [change('hired', '2026-01-21T00:00:00Z')],
    })

    expect(timeToHireDays(app)).toBe(20)
    expect(timeToHireDays(app)).not.toBe(151)
  })

  it('returns null when the hire is not in the history', () => {
    // The caller decides whether to fall back; this does not guess.
    expect(timeToHireDays(application({ stageHistory: [] }))).toBeNull()
  })

  it('never reports a negative duration', () => {
    const app = application({
      appliedAt: '2026-03-01T00:00:00Z',
      stageHistory: [change('hired', '2026-01-01T00:00:00Z')],
    })

    expect(timeToHireDays(app)).toBe(0)
  })
})
