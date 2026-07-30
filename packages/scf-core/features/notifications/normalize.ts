/**
 * Shared shape + normalizer for notification lists.
 *
 * Both the drawer feed and the notifications centre had their own copy of this
 * mapping, and both read the wrong field: `.data.items` with a fallback to
 * `.items`. The list endpoint returns neither — `NotificationsListResponse` is
 * `{ data: Notification[], pagination }` — so both surfaces rendered "You're
 * all caught up" no matter what came back, while the unread badge counted the
 * same rows correctly (#382).
 *
 * Two things kept that alive. The `as { data?: { items?: unknown[] } }` casts
 * asserted a shape the SDK type would otherwise have rejected, and a comment
 * in the centre screen stated the endpoint "returns either { data: { items } }
 * or { items } — handle both", documenting a belief that was never true. One
 * normalizer, typed against the SDK response, means a future change to the
 * envelope breaks the build instead of silently emptying the UI.
 */

export type NotificationSeverity = 'critical' | 'important' | 'info'

export type NotificationListItem = {
  id: string
  title: string
  preview: string
  createdAt: string
  read: boolean
  severity: NotificationSeverity
  ctaUrl?: string
}

/** Row shape as it arrives from the API, before normalizing. */
type RawNotification = {
  id?: unknown
  title?: unknown
  body?: unknown
  preview?: unknown
  message?: unknown
  created_at?: unknown
  read?: unknown
  severity?: unknown
  cta_url?: unknown
}

/**
 * Best available one-line summary.
 *
 * `body.preview` is what notify-publish writes; `preview` and `message` are the
 * older column-level fields, still populated on rows created before it.
 */
function pickPreview(n: RawNotification): string {
  const bodyPreview = (n.body as { preview?: unknown } | null | undefined)?.preview
  if (typeof bodyPreview === 'string' && bodyPreview) return bodyPreview
  if (typeof n.preview === 'string' && n.preview) return n.preview
  if (typeof n.message === 'string' && n.message) return n.message
  return ''
}

const SEVERITIES: NotificationSeverity[] = ['critical', 'important', 'info']

function toSeverity(value: unknown): NotificationSeverity {
  return SEVERITIES.includes(value as NotificationSeverity)
    ? (value as NotificationSeverity)
    : 'info'
}

/**
 * Turn a notifications list response into display items.
 *
 * Accepts the response object rather than an already-extracted array, so the
 * envelope is only unwrapped in one place.
 */
export function toNotificationItems(
  response: { data?: RawNotification[] } | undefined
): NotificationListItem[] {
  return (response?.data ?? []).map((n) => ({
    id: String(n.id ?? ''),
    title: String(n.title ?? ''),
    preview: pickPreview(n),
    createdAt: String(n.created_at ?? ''),
    read: Boolean(n.read),
    severity: toSeverity(n.severity),
    ctaUrl: typeof n.cta_url === 'string' ? n.cta_url : undefined,
  }))
}
