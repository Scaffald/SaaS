import { describe, expect, it } from 'vitest'
import {
  openReportRows,
  type PreviewCheck,
  type PreviewReport,
  type PreviewVerification,
  screeningPreviewRows,
  violationTypeLabel,
} from '../office-overview-preview'

const NOW = new Date('2026-10-17T12:00:00Z').getTime()
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString()

const check = (id: string, status: string, age: number, name = `Worker ${id}`): PreviewCheck => ({
  id,
  status,
  created_at: daysAgo(age),
  updated_at: daysAgo(age),
  worker: { display_name: name },
  package: { display_name: 'Standard' },
  organization: { name: 'Acme' },
})

const verification = (id: string, age: number): PreviewVerification => ({
  membership_id: id,
  display_name: `Member ${id}`,
  email: null,
  community_name: 'Electricians',
  verification_data: { license_type: 'Journeyman', state: 'TX' },
  joined_at: daysAgo(age),
})

describe('screeningPreviewRows (#1201)', () => {
  it('puts the longest-waiting open checks first and leaves finished ones out', () => {
    const rows = screeningPreviewRows(
      [check('a', 'under_review', 1), check('b', 'completed_clear', 30), check('c', 'under_review', 9)],
      [],
      5,
      NOW
    )
    expect(rows.map((r) => r.key)).toEqual(['check-c', 'check-a'])
    expect(rows[0].detail).toBe('Standard · Acme')
    expect(rows[0].route).toBe('/office/ats/admin')
  })

  it('follows checks with community verifications, oldest first, and stops at the limit', () => {
    const rows = screeningPreviewRows(
      [check('a', 'under_review', 1)],
      [verification('v1', 1), verification('v2', 4)],
      2,
      NOW
    )
    expect(rows.map((r) => r.key)).toEqual(['check-a', 'verification-v2'])
    expect(rows[1].detail).toBe('Electricians · Journeyman · TX')
    expect(rows[1].route).toBe('/office/communities/verification')
  })

  it('names a worker by what is known about them', () => {
    const rows = screeningPreviewRows(
      [{ ...check('a', 'under_review', 1), worker: { email: 'w@example.com' } }],
      [],
      5,
      NOW
    )
    expect(rows[0].title).toBe('w@example.com')
  })
})

describe('openReportRows (#1201)', () => {
  const report = (id: string, status: string, age: number): PreviewReport => ({
    id,
    status,
    violationType: 'off_platform_hire',
    workerName: `Worker ${id}`,
    organizationName: 'Acme',
    createdAt: daysAgo(age),
  })

  it('shows open reports, newest first', () => {
    const rows = openReportRows(
      [report('old', 'pending', 5), report('done', 'resolved', 0), report('new', 'under_review', 1)],
      5
    )
    expect(rows.map((r) => r.key)).toEqual(['report-new', 'report-old'])
    expect(rows[0].tag).toBe('Off-platform hire')
    expect(rows[0].detail).toBe('Acme')
  })

  it('stops at the limit', () => {
    expect(openReportRows([report('a', 'pending', 1), report('b', 'pending', 2)], 1)).toHaveLength(1)
  })
})

describe('violationTypeLabel', () => {
  it.each([
    ['off_platform_hire', 'Off-platform hire'],
    ['off_platform_communication', 'Off-platform communication'],
    ['fee_avoidance', 'Fee avoidance'],
    ['other', 'Other'],
  ])('%s reads %s', (type, label) => {
    expect(violationTypeLabel(type)).toBe(label)
  })
})
