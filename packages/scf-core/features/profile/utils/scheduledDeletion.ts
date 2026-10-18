/**
 * What to tell a user whose account is scheduled for deletion (#1313).
 *
 * A request waits 14 days (the grace period, set in the database) and is then
 * carried out by a daily job, so it always completes inside the 30 days the
 * privacy policy and FAQ promise. During the wait the user can sign in as
 * normal and cancel.
 */

export interface ScheduledDeletion {
  status: string
  scheduledFor: string
  canCancel: boolean
}

export interface ScheduledDeletionCopy {
  title: string
  message: string
  canCancel: boolean
}

/** "November 1, 2026" in the reader's locale and time zone. */
export function formatDeletionDate(iso: string, locale?: string): string {
  return new Date(iso).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Copy for a deletion request, or null when there is nothing to say.
 *
 * Before the date: the date and the way out. On or after it, the job may not
 * have run yet (it runs once a day), so the copy says it is under way rather
 * than naming a date that has passed. `failed` before anything was deleted
 * still reads as scheduled: from the user's side nothing has happened, and the
 * team is finishing it.
 */
export function describeScheduledDeletion(
  request: ScheduledDeletion | null | undefined,
  now: Date = new Date(),
  locale?: string
): ScheduledDeletionCopy | null {
  if (!request) return null
  if (request.status === 'completed' || request.status === 'cancelled') return null

  const due = Date.parse(request.scheduledFor)
  if (Number.isFinite(due) && due > now.getTime()) {
    return {
      title: `Your account is scheduled for deletion on ${formatDeletionDate(request.scheduledFor, locale)}`,
      message: request.canCancel
        ? 'Until then you can use Scaffald as normal. Cancel if you want to keep your account.'
        : 'Your account and its data will be removed on that date.',
      canCancel: request.canCancel,
    }
  }

  return {
    title: 'Your account is being deleted',
    message: request.canCancel
      ? 'Deletion will finish within a day or two. Cancel now if you want to keep your account.'
      : 'Deletion has started and will finish shortly.',
    canCancel: request.canCancel,
  }
}
