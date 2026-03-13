import { useMemo } from 'react'
import { useOrganizations } from './useOrganizations'

/**
 * Resolve org slug to organization id and name using the user's org memberships.
 * Use in org-scoped routes to get org context.
 */
export function useOrgBySlug(slug: string | undefined) {
  const { data: memberships, isLoading, error } = useOrganizations()
  const org = useMemo(() => {
    if (!slug || !memberships?.length) return null
    const m = memberships.find((x) => x.organization_slug === slug)
    return m
      ? { organizationId: m.organization_id, organizationName: m.organization_name, slug: m.organization_slug }
      : null
  }, [slug, memberships])
  return { org, isLoading, error, isForbidden: !!slug && !isLoading && !error && !org }
}
