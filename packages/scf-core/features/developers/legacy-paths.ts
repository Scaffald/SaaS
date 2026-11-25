import { ROUTES, RouteBuilder } from '@scf/core/constants/routes'

/**
 * API keys and webhooks moved from /office/api-keys and /office/webhooks to
 * each organization's Developers tab (#1440). The people following the old
 * links are organization admins, mostly *without* the office role, so the
 * redirect cannot sit behind the office gate: the office layout asks this
 * module whether the path is one of these and, if so, skips its role checks
 * and lets the redirect route run — as it does for the hiring paths (#1312).
 */

const API_KEYS = ROUTES.OFFICE.API_KEYS.path
const WEBHOOKS = ROUTES.OFFICE.WEBHOOKS.path

const under = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`)

/** Whether `pathname` is an old Office API-keys or webhooks path. */
export function isLegacyDevelopersPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return under(pathname, API_KEYS) || under(pathname, WEBHOOKS)
}

/**
 * Where an old path goes, given the slugs of the organizations the person
 * belongs to. With exactly one, straight to the same screen on that
 * organization; with several or none there is no way to know which one was
 * meant, so to My Organizations, where every one of theirs is a tap away.
 * Null for anything that is not a legacy path.
 */
export function legacyDevelopersTarget(
  pathname: string | null | undefined,
  orgSlugs: ReadonlyArray<string>
): string | null {
  if (!pathname || !isLegacyDevelopersPath(pathname)) return null
  const slugs = [...new Set(orgSlugs.filter(Boolean))]
  if (slugs.length !== 1) return ROUTES.EMPLOYERS.ORG.path
  const [slug] = slugs

  if (under(pathname, API_KEYS)) return RouteBuilder.orgApiKeys(slug)

  const rest = pathname.slice(WEBHOOKS.length).replace(/^\/+|\/+$/g, '')
  if (!rest) return RouteBuilder.orgWebhooks(slug)
  if (rest === 'create') return RouteBuilder.orgWebhookCreate(slug)
  // `/office/webhooks/:id` — the detail route the list pushed to and that never
  // existed. Anything deeper than one segment has no screen of its own.
  if (!rest.includes('/')) return RouteBuilder.orgWebhookDetail(slug, rest)
  return RouteBuilder.orgWebhooks(slug)
}
