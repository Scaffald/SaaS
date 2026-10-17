import type { EngagementEvent, ProfileView } from '@scaffald/sdk'
import { formatRelativeDate } from '@scf/core/utils/relative-date'

/**
 * Rows for Home's "Who viewed your profile" and "Recent activity" bands.
 *
 * Kept apart from the widgets so the wording can be tested without React
 * Native in the loop.
 */

export interface ProfileViewerRow {
  id: string
  /** Who looked: the viewer's name, or an anonymised description. */
  who: string
  /** What we know about them, beyond the name. Null when nothing. */
  detail: string | null
  /** "Today", "Yesterday", "3 days ago". */
  when: string
}

const ROLE_LABELS: Record<string, string> = {
  worker: 'Worker',
  employer: 'Employer',
  customer: 'Customer',
}

function roleLabel(role: string | null | undefined): string | null {
  if (!role) return null
  return ROLE_LABELS[role] ?? role.charAt(0).toUpperCase() + role.slice(1)
}

function withArticle(noun: string): string {
  return `${/^[aeiou]/.test(noun) ? 'An' : 'A'} ${noun}`
}

/**
 * One profile view as a row.
 *
 * The prototype's table reads ORGANIZATION / LOOKING FOR / WHEN. A view
 * carries the viewer's profile (when there is one), their role type and
 * industry, but no organisation and no "looking for", so the row says only
 * what the view records rather than filling those columns in (#1172). A
 * view with no viewer profile is described by role and industry, never by
 * a made-up name.
 */
export function toProfileViewerRow(view: ProfileView): ProfileViewerRow {
  const name = view.viewer?.display_name?.trim() || view.viewer?.username?.trim() || null
  const role = roleLabel(view.viewer_role_type)
  const industry = view.viewer_industry?.name ?? view.viewer?.industries?.name ?? null

  let who: string
  let detail: string | null
  if (name) {
    who = name
    detail = view.viewer?.headline?.trim() || [role, industry].filter(Boolean).join(' · ') || null
  } else {
    const someone = role ? withArticle(role.toLowerCase()) : 'Someone'
    who = industry ? `${someone} in ${industry}` : someone
    detail = null
  }

  return { id: view.id, who, detail, when: formatRelativeDate(view.viewed_at) }
}

/**
 * The worker's own engagement events, as sentences.
 *
 * These are things the worker did (the activity feed is filtered to their
 * own user id), so each reads "You …". They used to print as the raw event
 * type with underscores swapped for spaces ("Job view", "Occupation.searched").
 * `filter_change` is noise, not activity, and is dropped.
 */
const EVENT_SENTENCES: Record<string, string | null> = {
  profile_view: 'You viewed a profile',
  job_view: 'You viewed a job',
  job_click: 'You opened a job listing',
  application_start: 'You started an application',
  application_complete: 'You submitted an application',
  search: 'You ran a search',
  filter_change: null,
  'occupation.searched': 'You searched occupations',
  review_viewed: 'You read a review',
  'review.viewed': 'You read a review',
  'review.submitted': 'You wrote a review',
}

export function describeActivityEvent(eventType: string): string | null {
  if (eventType in EVENT_SENTENCES) return EVENT_SENTENCES[eventType]
  const words = eventType.replace(/[._]/g, ' ').trim()
  if (!words) return null
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export interface ActivityRow {
  id: string
  text: string
  when: string
}

export function toActivityRows(events: EngagementEvent[], limit = 3): ActivityRow[] {
  const rows: ActivityRow[] = []
  for (const event of events) {
    const text = describeActivityEvent(event.event_type)
    if (!text) continue
    rows.push({
      id: event.id,
      text,
      when: formatRelativeDate(event.occurred_at ?? event.created_at),
    })
    if (rows.length >= limit) break
  }
  return rows
}
