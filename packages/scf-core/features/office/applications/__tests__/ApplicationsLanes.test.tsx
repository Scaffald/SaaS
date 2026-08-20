/**
 * Asserts the §12 debts the Lanes view claims to close, not its styling.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@scaffald/ui'
import { ApplicationsLanes } from '../components/ApplicationsLanes'
import type { ApplicationStatus, ATSApplication } from '../types'

const NOW = new Date('2026-08-19T12:00:00Z').getTime()
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString()

const makeApp = (over: Partial<ATSApplication> & { id: string }): ATSApplication =>
  ({
    organizationId: 'org-1',
    workerUserId: 'u-1',
    candidate: {
      id: 'c-1',
      name: 'Alice Chen',
      location: 'Portland, OR',
      photo: '',
      title: 'Journeyman Electrician',
      yearsExperience: 7,
    },
    job: { id: 'j-1', title: 'Site Electrical Lead', location: 'Portland, OR', payRange: '$52-58' },
    status: 'new' as ApplicationStatus,
    appliedAt: daysAgo(1),
    updatedAt: daysAgo(1),
    score: 88,
    screeningAnswers: {
      currentLocation: '',
      willingToRelocate: false,
      yearsExperience: 7,
      isAuthorizedToWork: true,
      earliestStartDate: '',
    },
    customAnswers: [],
    attachments: {},
    stageHistory: [],
    ...over,
  }) as ATSApplication

const renderLanes = (apps: ATSApplication[]) =>
  render(
    <ThemeProvider>
      <ApplicationsLanes applications={apps} now={NOW} />
    </ThemeProvider>,
  )

describe('ApplicationsLanes — §12 #7, days in stage', () => {
  it('shows days in the current stage, not days since applying', () => {
    renderLanes([
      makeApp({
        id: 'a',
        status: 'interview',
        appliedAt: daysAgo(30),
        stageHistory: [
          { fromStage: 'screen', toStage: 'interview', changedBy: 'u', changedAt: daysAgo(2) },
        ],
      }),
    ])
    expect(screen.getByText('2d')).toBeTruthy()
    expect(screen.queryByText('30d')).toBeNull()
  })

  it('sorts the stalest row to the top of its stage', () => {
    const { container } = renderLanes([
      makeApp({ id: 'fresh', appliedAt: daysAgo(1) }),
      makeApp({ id: 'stale', appliedAt: daysAgo(9) }),
    ])
    const text = container.textContent ?? ''
    expect(text.indexOf('9d')).toBeLessThan(text.indexOf('1d'))
  })
})

describe('ApplicationsLanes — §12 #8, the reasons to pick one row over another', () => {
  it('puts score, source, union status and assignment on the row', () => {
    renderLanes([
      makeApp({
        id: 'a',
        score: 88,
        source: 'referral',
        unionStatus: {
          isUnionMember: true,
          unionName: 'IBEW 48',
          journeymanStatus: 'journeyman',
        },
        team: { id: 't', assignedUserId: 'user-9' },
      }),
    ])
    expect(screen.getByText('88')).toBeTruthy()
    expect(screen.getByText('Referral')).toBeTruthy()
    expect(screen.getByText(/IBEW 48/)).toBeTruthy()
    expect(screen.getByText('Assigned')).toBeTruthy()
  })

  it('says Unassigned rather than leaving the cell blank', () => {
    renderLanes([makeApp({ id: 'a' })])
    expect(screen.getByText('Unassigned')).toBeTruthy()
  })
})

describe('ApplicationsLanes — §12 #9, empty states', () => {
  it('gives each empty stage its own guidance instead of one repeated string', () => {
    const { container } = renderLanes([])
    const text = container.textContent ?? ''
    expect(text).toContain('Nothing waiting on a first response')
    expect(text).toContain('Move a candidate from New to start screening')
    // The failure mode being fixed: the same sentence seven times over.
    expect(text.match(/No applications/g)).toBeNull()
  })

  it('shows rows instead of the empty state once a stage has any', () => {
    renderLanes([makeApp({ id: 'a', status: 'new' })])
    expect(screen.queryByText(/Nothing waiting on a first response/)).toBeNull()
    expect(screen.getByText('Alice Chen')).toBeTruthy()
  })
})

describe('ApplicationsLanes — §12 #17, withdrawn is not rejected', () => {
  it('distinguishes the two inside the shared Closed lane', () => {
    renderLanes([
      makeApp({ id: 'w', status: 'withdrawn' }),
      makeApp({ id: 'r', status: 'rejected' }),
    ])
    expect(screen.getByText('Withdrawn by candidate')).toBeTruthy()
    expect(screen.getByText('Not moved forward')).toBeTruthy()
  })

  it('never marks a terminal row overdue however old it is', () => {
    renderLanes([makeApp({ id: 'w', status: 'withdrawn', appliedAt: daysAgo(400) })])
    expect(screen.queryByText(/Overdue/)).toBeNull()
  })
})

describe('ApplicationsLanes — overdue signalling', () => {
  it('names what is late rather than only flagging that something is', () => {
    renderLanes([makeApp({ id: 'a', status: 'screen', appliedAt: daysAgo(20) })])
    expect(screen.getByText('Overdue — screening decision')).toBeTruthy()
  })

  it('stays quiet inside the promise', () => {
    renderLanes([makeApp({ id: 'a', status: 'screen', appliedAt: daysAgo(1) })])
    expect(screen.queryByText(/Overdue/)).toBeNull()
  })
})

describe('ApplicationsLanes — selection', () => {
  it('reports the row that was pressed', () => {
    const onSelect = vi.fn()
    render(
      <ThemeProvider>
        <ApplicationsLanes
          applications={[makeApp({ id: 'a' })]}
          onSelect={onSelect}
          now={NOW}
        />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByText('Alice Chen'))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0][0].id).toBe('a')
  })
})
