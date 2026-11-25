import { ROUTES } from '@scf/core/constants/routes'
import type { TranslationKey } from '@scf/core/locales'

type AdminPage = { href: string; titleKey: TranslationKey }

/**
 * The Admin tabs that hold more than one page, and those pages in order. The
 * section's folder tabs say which group you are in; this is the row beneath
 * that moves between a group's pages (Billing's Stripe settings, Payments and
 * Transactions). General and Developer platform have one page each, so they
 * have no row.
 */
const GROUPS: ReadonlyArray<{ path: string; pages: AdminPage[] }> = [
  {
    path: ROUTES.ADMIN.BILLING.path,
    pages: [
      ROUTES.ADMIN.BILLING.PAYMENTS,
      ROUTES.ADMIN.BILLING.TRANSACTIONS,
      ROUTES.ADMIN.BILLING.STRIPE,
    ].map(({ path, titleKey }) => ({ href: path, titleKey })),
  },
  {
    path: ROUTES.ADMIN.INTEGRATIONS.path,
    pages: [ROUTES.ADMIN.INTEGRATIONS.BACKGROUND_CHECKS, ROUTES.ADMIN.INTEGRATIONS.HRIS].map(
      ({ path, titleKey }) => ({ href: path, titleKey })
    ),
  },
  {
    path: ROUTES.ADMIN.SYSTEM.path,
    pages: [ROUTES.ADMIN.SYSTEM.NOTIFICATIONS, ROUTES.ADMIN.SYSTEM.STORAGE].map(
      ({ path, titleKey }) => ({ href: path, titleKey })
    ),
  },
]

/** The pages of the Admin group `pathname` sits in, and which one it is. */
export function adminGroupPages(
  pathname: string | null | undefined
): { pages: AdminPage[]; activeHref: string | null } | null {
  if (!pathname) return null
  const group = GROUPS.find((g) => pathname === g.path || pathname.startsWith(`${g.path}/`))
  if (!group) return null
  const active = group.pages.find(
    (p) => pathname === p.href || pathname.startsWith(`${p.href}/`)
  )
  return { pages: group.pages, activeHref: active?.href ?? null }
}

/** Where each Admin tab lands. */
export const ADMIN_LANDING = {
  general: ROUTES.ADMIN.GENERAL.GEOGRAPHIC.path,
  billing: ROUTES.ADMIN.BILLING.PAYMENTS.path,
  integrations: ROUTES.ADMIN.INTEGRATIONS.BACKGROUND_CHECKS.path,
  developer: ROUTES.ADMIN.OAUTH_APPS.path,
  system: ROUTES.ADMIN.SYSTEM.NOTIFICATIONS.path,
} as const
