import { ROUTES } from '@scf/core/constants/routes'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useUserRoles } from './useUserRoles'

/**
 * Gates the office/employer experience by ROLE (not viewport) so it's reachable
 * on mobile (v1.12.0 / SC-136). Users without the `office` role are redirected
 * to their dashboard. `isTabletOrAbove` is kept as an alias for `isAllowed` so
 * existing consumers (the office layout) work unchanged.
 */
export const useOfficeRouteProtection = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const router = useRouter()
  const { hasOfficeRole, isLoading } = useUserRoles()
  const isAllowed = hasOfficeRole

  // `enabled: false` lets the office layout pass the old pipeline URLs through
  // to their redirects for people without the role (#1312).
  useEffect(() => {
    if (enabled && !isLoading && !isAllowed) {
      router.replace(ROUTES.DASHBOARD.path as Parameters<typeof router.replace>[0])
    }
  }, [enabled, isAllowed, isLoading, router])

  return { isAllowed, isLoading, isTabletOrAbove: isAllowed }
}
