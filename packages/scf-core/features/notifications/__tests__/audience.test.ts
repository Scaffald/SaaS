import { describe, expect, it } from 'vitest'
import {
  describeFailureCount,
  filterNotificationsForMode,
  notificationAudience,
  notificationsKicker,
  summarizeOperationalAlerts,
} from '../audience'

const VAULT_ERROR = 'Service role key not configured. Set app.settings.service_role_key or app.service_role_key.'

describe('filterNotificationsForMode (#1178)', () => {
  const rows = [
    { id: 'cron', type: 'system.cron_failure' },
    { id: 'match', type: 'job.match' },
    { id: 'offer', type: 'offer.extended' },
    { id: 'team', type: 'team.assigned' },
    { id: 'inquiry', type: 'inquiry.sent' },
    { id: 'message', type: 'message.received' },
    { id: 'digest', type: 'system.digest_daily' },
    { id: 'legacy', type: 'info' },
    { id: 'untyped' },
  ]
  const ids = (mode: 'worker' | 'employer') =>
    filterNotificationsForMode(rows, mode).map((r) => r.id)

  it('never puts an operational alert in the personal inbox', () => {
    expect(ids('worker')).not.toContain('cron')
    expect(ids('employer')).not.toContain('cron')
  })

  it('shows worker types to workers and hiring types to employers', () => {
    expect(ids('worker')).toEqual(['match', 'offer', 'message', 'digest', 'legacy', 'untyped'])
    expect(ids('employer')).toEqual(['team', 'inquiry', 'message', 'digest', 'legacy', 'untyped'])
  })

  it('keeps unknown types in both modes rather than losing them', () => {
    expect(notificationAudience('something.new')).toBe('both')
    expect(notificationAudience(undefined)).toBe('both')
  })
})

describe('notificationsKicker', () => {
  it('names the employer view, as the prototype does', () => {
    expect(notificationsKicker('worker')).toBe('Everything that needs you')
    expect(notificationsKicker('employer')).toBe('Employer view — everything that needs you')
  })
})

describe('summarizeOperationalAlerts', () => {
  const failure = (id: string, job: string, at: string, error = VAULT_ERROR) => ({
    id,
    type: 'system.cron_failure',
    title: `Cron Job Failed: ${job}`,
    message: error,
    metadata: { job_name: job, error },
    created_at: at,
  })

  it('collapses repeated failures of one job into one row with a count', () => {
    const alerts = summarizeOperationalAlerts([
      failure('a', 'import-news-articles', '2026-10-10T06:00:00Z'),
      failure('b', 'import-news-articles', '2026-10-08T06:00:00Z'),
      failure('c', 'import-news-articles', '2026-10-09T06:00:00Z'),
      failure('d', 'expire-jobs', '2026-10-11T06:00:00Z', 'relation "x" does not exist'),
      { id: 'e', type: 'job.match', title: 'New match', created_at: '2026-10-12T00:00:00Z' },
    ])

    expect(alerts.map((a) => [a.jobName, a.count])).toEqual([
      ['expire-jobs', 1],
      ['import-news-articles', 3],
    ])
    const news = alerts[1]
    expect(news.firstAt).toBe('2026-10-08T06:00:00Z')
    expect(news.lastAt).toBe('2026-10-10T06:00:00Z')
    expect(describeFailureCount(news)).toBe('Failed 3 times since Oct 8')
    expect(describeFailureCount(alerts[0])).toBe('Failed once')
  })

  it('says what is wrong in plain language instead of the raw config text', () => {
    const [alert] = summarizeOperationalAlerts([
      failure('a', 'import-news-articles', '2026-10-10T06:00:00Z'),
    ])
    expect(alert.summary).toBe(
      'The scheduled job “import-news-articles” can’t run: the database has no service role key to call the API with.'
    )
    expect(alert.summary).not.toContain('app.settings')
    expect(alert.lastError).toBe(VAULT_ERROR)
  })

  it('falls back to a generic sentence for an error it does not recognise', () => {
    const [alert] = summarizeOperationalAlerts([
      failure('a', 'expire-jobs', '2026-10-10T06:00:00Z', 'boom'),
    ])
    expect(alert.summary).toBe('The scheduled job “expire-jobs” is failing.')
  })
})
