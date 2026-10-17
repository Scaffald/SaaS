/**
 * Who a notification is for: the personal inbox in worker or employer mode, or
 * Office's operations panel (#1178).
 *
 * The inbox used to show every row for the user in every mode, and for a
 * super-admin it was mostly `system.cron_failure` — one row per failed run,
 * each carrying the cron's raw error ("Set app.settings.service_role_key…").
 * That is an operations signal, not something that needs *you*: the `api`
 * function now leaves those types out of the personal list and unread count,
 * and Office reads them with `scope=operations`, collapsed one row per job.
 *
 * Mode filtering is client-side because the list endpoint cannot filter by
 * audience. A type is only hidden from a mode when it clearly belongs to the
 * other one; anything shared or unrecognised shows in both, so a new type can
 * never silently vanish from the inbox.
 */
import type { AppMode } from '@scf/core/utils/useAppMode'

/**
 * Notification types that report on the platform rather than to a person.
 * Kept in step with `OPERATIONAL_NOTIFICATION_TYPES` in the `api` function's
 * notifications route. `system.digest_*` is deliberately absent: a digest is a
 * personal summary, it just happens to share the prefix.
 */
export const OPERATIONAL_NOTIFICATION_TYPES = ['system.cron_failure'] as const

export function isOperationalNotification(type: string | undefined): boolean {
  return (OPERATIONAL_NOTIFICATION_TYPES as readonly string[]).includes(type ?? '')
}

export type NotificationAudience = AppMode | 'both'

/**
 * Types that only make sense to someone looking for work: matches, the state
 * of *their* applications, interviews and offers made to them, their profile.
 */
const WORKER_TYPES = new Set([
  'job.match',
  'app.status_changed',
  'interview.scheduled',
  'offer.extended',
  'profile.viewed',
  'profile.unlocked',
  'profile.reminder',
  'profile.completion_reminder',
  'skill.endorse',
  'bgcheck.completed',
])

/**
 * Prefixes that only exist on the hiring side: hiring-team activity, the
 * org-to-org inquiry workflow, and the organisation's billing.
 */
const EMPLOYER_PREFIXES = ['team.', 'inquiry.', 'payment.', 'sub.']

export function notificationAudience(type: string | undefined): NotificationAudience {
  if (!type) return 'both'
  if (WORKER_TYPES.has(type)) return 'worker'
  if (EMPLOYER_PREFIXES.some((prefix) => type.startsWith(prefix))) return 'employer'
  return 'both'
}

/** Rows for the personal inbox in this mode: no operational rows, nothing for the other side. */
export function filterNotificationsForMode<T extends { type?: string }>(
  items: T[],
  mode: AppMode
): T[] {
  return items.filter((item) => {
    if (isOperationalNotification(item.type)) return false
    const audience = notificationAudience(item.type)
    return audience === 'both' || audience === mode
  })
}

/** The prototype's kicker for each mode (worker-notifications, employer-notifications). */
export function notificationsKicker(mode: AppMode): string {
  return mode === 'employer'
    ? 'Employer view — everything that needs you'
    : 'Everything that needs you'
}

// ---------------------------------------------------------------------------
// Operations panel
// ---------------------------------------------------------------------------

type RawOperationalRow = {
  id?: unknown
  type?: unknown
  title?: unknown
  message?: unknown
  metadata?: unknown
  created_at?: unknown
}

export type OperationalAlert = {
  /** The failing job, or the row's title when the row names no job. */
  key: string
  jobName: string | null
  count: number
  firstAt: string
  lastAt: string
  /** One plain sentence: what is wrong, in words an operator can act on. */
  summary: string
  /** The newest raw error, for whoever goes to fix it. */
  lastError: string | null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}

/**
 * Turn a raw cron error into a sentence. The one every environment has hit so
 * far is the missing service-role key (#805, #1075); anything else is quoted
 * as-is under the summary rather than guessed at.
 */
function explain(jobName: string | null, error: string | null): string {
  const job = jobName ? `The scheduled job “${jobName}”` : 'A scheduled job'
  if (error && /service_role_key|service role key/i.test(error)) {
    return `${job} can’t run: the database has no service role key to call the API with.`
  }
  return `${job} is failing.`
}

/**
 * Collapse operational rows into one alert per job, newest first. Each failure
 * writes a row per admin, but this reads only the caller's own rows, so the
 * count is the number of failed runs.
 */
export function summarizeOperationalAlerts(
  rows: RawOperationalRow[] | undefined
): OperationalAlert[] {
  const byKey = new Map<string, OperationalAlert>()

  for (const row of rows ?? []) {
    if (!isOperationalNotification(asString(row.type) ?? undefined)) continue
    const metadata = (row.metadata ?? {}) as { job_name?: unknown; error?: unknown }
    const jobName = asString(metadata.job_name)
    const error = asString(metadata.error) ?? asString(row.message)
    const createdAt = asString(row.created_at) ?? ''
    const key = jobName ?? asString(row.title) ?? 'unknown'

    const existing = byKey.get(key)
    if (!existing) {
      byKey.set(key, {
        key,
        jobName,
        count: 1,
        firstAt: createdAt,
        lastAt: createdAt,
        summary: explain(jobName, error),
        lastError: error,
      })
      continue
    }

    existing.count += 1
    if (createdAt && createdAt < existing.firstAt) existing.firstAt = createdAt
    if (createdAt > existing.lastAt) {
      existing.lastAt = createdAt
      existing.lastError = error
      existing.summary = explain(jobName, error)
    }
  }

  return [...byKey.values()].sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1))
}

/** "Failed once" / "Failed 7 times since Oct 8". */
export function describeFailureCount(alert: Pick<OperationalAlert, 'count' | 'firstAt'>): string {
  if (alert.count === 1) return 'Failed once'
  const since = alert.firstAt
    ? new Date(alert.firstAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    : null
  return since ? `Failed ${alert.count} times since ${since}` : `Failed ${alert.count} times`
}
