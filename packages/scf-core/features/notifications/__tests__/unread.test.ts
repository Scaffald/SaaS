import { describe, expect, it } from 'vitest'
import { countUnreadForMode, formatUnreadBadge } from '../unread'

const page = (types: Array<string | undefined>, total = types.length) => ({
  data: types.map((type) => ({ type, read: false })),
  pagination: { total },
})

describe('countUnreadForMode (#1250)', () => {
  const mixed = page(['job.match', 'offer.extended', 'team.assigned', 'inquiry.sent', 'message.received'])

  it('counts only what the worker inbox shows in worker mode', () => {
    // job.match, offer.extended, message.received — not the two hiring-side rows.
    expect(countUnreadForMode(mixed, 'worker')).toEqual({ value: 3, overflow: false })
  })

  it('counts only what the employer inbox shows in employer mode', () => {
    // team.assigned, inquiry.sent, message.received.
    expect(countUnreadForMode(mixed, 'employer')).toEqual({ value: 3, overflow: false })
  })

  it('an employer-only unread row does not light the worker badge', () => {
    expect(countUnreadForMode(page(['team.assigned']), 'worker')).toEqual({
      value: 0,
      overflow: false,
    })
  })

  it('never counts an operational alert', () => {
    expect(countUnreadForMode(page(['system.cron_failure']), 'worker')?.value).toBe(0)
    expect(countUnreadForMode(page(['system.cron_failure']), 'employer')?.value).toBe(0)
  })

  it('drops a row already marked read in the cache', () => {
    const optimistic = {
      data: [
        { type: 'job.match', read: true },
        { type: 'job.match', read: false },
      ],
      pagination: { total: 2 },
    }
    expect(countUnreadForMode(optimistic, 'worker')?.value).toBe(1)
  })

  it('is a floor when more unread rows exist than were fetched', () => {
    expect(countUnreadForMode(page(['job.match'], 250), 'worker')).toEqual({
      value: 1,
      overflow: true,
    })
  })

  it('is unknown before the page loads', () => {
    expect(countUnreadForMode(undefined, 'worker')).toBeNull()
    expect(countUnreadForMode({ data: null }, 'worker')).toBeNull()
  })
})

describe('formatUnreadBadge', () => {
  it('reads the number, a floor, or 99+', () => {
    expect(formatUnreadBadge({ value: 3, overflow: false })).toBe('3')
    expect(formatUnreadBadge({ value: 12, overflow: true })).toBe('12+')
    expect(formatUnreadBadge({ value: 140, overflow: false })).toBe('99+')
    expect(formatUnreadBadge({ value: 140, overflow: true })).toBe('99+')
  })
})
