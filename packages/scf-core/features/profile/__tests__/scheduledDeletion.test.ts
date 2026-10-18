import { describe, expect, it } from 'vitest'

import { describeScheduledDeletion } from '../utils/scheduledDeletion'

const NOW = new Date('2026-10-18T12:00:00Z')

describe('describeScheduledDeletion (#1313)', () => {
  it('says nothing without an open request', () => {
    expect(describeScheduledDeletion(null, NOW)).toBeNull()
    expect(
      describeScheduledDeletion(
        { status: 'cancelled', scheduledFor: '2026-11-01T12:00:00Z', canCancel: false },
        NOW
      )
    ).toBeNull()
    expect(
      describeScheduledDeletion(
        { status: 'completed', scheduledFor: '2026-10-01T12:00:00Z', canCancel: false },
        NOW
      )
    ).toBeNull()
  })

  it('names the date and offers Cancel during the grace period', () => {
    const copy = describeScheduledDeletion(
      { status: 'pending', scheduledFor: '2026-11-01T12:00:00Z', canCancel: true },
      NOW,
      'en-US'
    )
    expect(copy?.title).toBe('Your account is scheduled for deletion on November 1, 2026')
    expect(copy?.canCancel).toBe(true)
  })

  it('does not name a date that has passed', () => {
    const copy = describeScheduledDeletion(
      { status: 'pending', scheduledFor: '2026-10-17T12:00:00Z', canCancel: true },
      NOW,
      'en-US'
    )
    expect(copy?.title).toBe('Your account is being deleted')
    expect(copy?.canCancel).toBe(true)
  })

  it('offers no Cancel once deletion has started', () => {
    const copy = describeScheduledDeletion(
      { status: 'in_progress', scheduledFor: '2026-10-17T12:00:00Z', canCancel: false },
      NOW
    )
    expect(copy?.canCancel).toBe(false)
    expect(copy?.message).toMatch(/started/)
  })
})
