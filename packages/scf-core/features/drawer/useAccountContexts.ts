import { ROUTES } from '@scf/core/constants/routes'
import { useUserRoles } from '@scf/core/utils/auth/useUserRoles'
import { useAppMode, type AppMode } from '@scf/core/utils/useAppMode'
import { useOrganizations } from '@scf/core/utils/useOrganizations'
import { useRouter } from 'expo-router'
import { useCallback, useMemo } from 'react'

/** One row under "Using Scaffald as". */
export interface AccountContext {
  mode: AppMode
  label: string
  /** Where picking this row lands you. */
  href: string
  /** Slug to remember alongside employer mode. */
  slug?: string | null
}

/**
 * The contexts a person can use Scaffald in, and the switch between them.
 *
 * Shared by the phone's account sheet and the desktop drawer's account row so
 * the two never disagree about who gets an Employer row. The gate is the one
 * the old ModeSelector used: an office role, or membership of at least one
 * organisation. Without either there is no employer context to switch into.
 *
 * The prototype lists five contexts; we have two, and a list that offered
 * rows going nowhere would be worse than a short one. A third context becomes
 * a third row when it becomes real.
 */
export function useAccountContexts() {
  const router = useRouter()
  const { mode, orgSlug, setAppMode } = useAppMode()
  const { data: organizations } = useOrganizations()
  const { hasOfficeRole } = useUserRoles()

  const memberships = useMemo(() => organizations ?? [], [organizations])

  const contexts = useMemo<AccountContext[]>(() => {
    const rows: AccountContext[] = [
      { mode: 'worker', label: 'Worker', href: ROUTES.DASHBOARD.path },
    ]
    if (hasOfficeRole || memberships.length > 0) {
      const slug =
        memberships.find((m) => m.organization_slug === orgSlug)?.organization_slug ??
        memberships[0]?.organization_slug ??
        null
      rows.push({
        mode: 'employer',
        label: 'Employer',
        slug,
        href: slug
          ? ROUTES.EMPLOYERS.ORG.DETAIL.path.replace(':slug', slug)
          : ROUTES.EMPLOYERS.CREATE.path,
      })
    }
    return rows
  }, [hasOfficeRole, memberships, orgSlug])

  const current = contexts.find((row) => row.mode === mode) ?? contexts[0]

  const pick = useCallback(
    (row: AccountContext) => {
      void setAppMode(row.mode, row.slug ?? undefined)
      router.push(row.href as never)
    },
    [setAppMode, router]
  )

  return { mode, contexts, current, pick }
}
