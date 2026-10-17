import { describe, expect, it } from 'vitest'
import type { EngagementEvent, ProfileView } from '@scaffald/sdk'
import { describeActivityEvent, toActivityRows, toProfileViewerRow } from './home-activity-rows'

const now = new Date().toISOString()
const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

function view(overrides: Partial<ProfileView> = {}): ProfileView {
  return {
    id: 'v1',
    viewed_at: now,
    viewer: null,
    viewer_role_type: null,
    viewer_industry: null,
    ...overrides,
  }
}

const viewer = {
  id: 'u1',
  display_name: 'Dana Ortiz',
  username: 'dana',
  avatar_url: null,
  headline: 'Superintendent at Halvorsen Build',
  industry_id: null,
}

describe('toProfileViewerRow (#1172)', () => {
  it('names a viewer with a profile and uses their headline', () => {
    const row = toProfileViewerRow(view({ viewer, viewer_role_type: 'employer' }))
    expect(row).toEqual({
      id: 'v1',
      who: 'Dana Ortiz',
      detail: 'Superintendent at Halvorsen Build',
      when: 'Today',
    })
  })

  it('falls back to role and industry when the viewer has no headline', () => {
    const row = toProfileViewerRow(
      view({
        viewer: { ...viewer, headline: null },
        viewer_role_type: 'employer',
        viewer_industry: { id: 'i1', name: 'Construction' },
      })
    )
    expect(row.detail).toBe('Employer · Construction')
  })

  it('describes an anonymous viewer by role and industry, never a name', () => {
    expect(
      toProfileViewerRow(
        view({ viewer_role_type: 'employer', viewer_industry: { id: 'i1', name: 'Construction' } })
      ).who
    ).toBe('An employer in Construction')
    expect(toProfileViewerRow(view({ viewer_role_type: 'worker' })).who).toBe('A worker')
    expect(toProfileViewerRow(view()).who).toBe('Someone')
  })

  it('reports when as a relative date', () => {
    expect(toProfileViewerRow(view({ viewed_at: twoDaysAgo })).when).toBe('2 days ago')
  })
})

describe('describeActivityEvent', () => {
  it('turns known event types into sentences about the worker', () => {
    expect(describeActivityEvent('job_view')).toBe('You viewed a job')
    expect(describeActivityEvent('occupation.searched')).toBe('You searched occupations')
  })

  it('drops filter changes', () => {
    expect(describeActivityEvent('filter_change')).toBeNull()
  })

  it('humanises an unknown type rather than printing the raw key', () => {
    expect(describeActivityEvent('badge.earned')).toBe('Badge earned')
  })
})

describe('toActivityRows', () => {
  function event(id: string, event_type: string): EngagementEvent {
    return {
      id,
      user_id: 'u1',
      event_type: event_type as EngagementEvent['event_type'],
      occurred_at: now,
      created_at: now,
    }
  }

  it('skips dropped events and stops at the limit', () => {
    const rows = toActivityRows(
      [
        event('a', 'filter_change'),
        event('b', 'job_view'),
        event('c', 'search'),
        event('d', 'application_start'),
        event('e', 'application_complete'),
      ],
      3
    )
    expect(rows.map((r) => r.id)).toEqual(['b', 'c', 'd'])
    expect(rows[0]).toEqual({ id: 'b', text: 'You viewed a job', when: 'Today' })
  })
})
