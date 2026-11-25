import { ROUTES } from '@scf/core/constants/routes'

/**
 * Platform setup moved from Office to Admin (#1439). Each old /office path is
 * still a route that only redirects, so bookmarks, the Office Overview cards
 * of an older build and links in sent notifications keep working. Everyone
 * following them already holds the office role, so unlike the hiring
 * redirects (#1312) these stay behind the Office gate.
 *
 * Old prefix → new prefix. A child segment rides along:
 * `/office/oauth-apps/<id>` becomes `/admin/oauth-apps/<id>`.
 */
const MOVES: ReadonlyArray<readonly [from: string, to: string]> = [
  [ROUTES.OFFICE.SETTINGS.GEOGRAPHIC.path, ROUTES.ADMIN.GENERAL.GEOGRAPHIC.path],
  [ROUTES.OFFICE.SETTINGS.STRIPE.path, ROUTES.ADMIN.BILLING.STRIPE.path],
  [ROUTES.OFFICE.PAYMENTS.path, ROUTES.ADMIN.BILLING.PAYMENTS.path],
  [ROUTES.OFFICE.TRANSACTIONS.path, ROUTES.ADMIN.BILLING.TRANSACTIONS.path],
  [ROUTES.OFFICE.INTEGRATIONS.path, ROUTES.ADMIN.INTEGRATIONS.path],
  [ROUTES.OFFICE.OAUTH_APPS.path, ROUTES.ADMIN.OAUTH_APPS.path],
  [ROUTES.OFFICE.NOTIFICATIONS.path, ROUTES.ADMIN.SYSTEM.NOTIFICATIONS.path],
  [ROUTES.OFFICE.STORAGE.path, ROUTES.ADMIN.SYSTEM.STORAGE.path],
]

/**
 * The Admin home of a moved Office path, child segments kept. Null for any
 * path that did not move.
 */
export function movedToAdminTarget(pathname: string | null | undefined): string | null {
  if (!pathname) return null
  const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname
  for (const [from, to] of MOVES) {
    if (path === from || path.startsWith(`${from}/`)) {
      return `${to}${path.slice(from.length)}`
    }
  }
  return null
}
