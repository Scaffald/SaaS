import { ROUTES } from '@scf/core/constants/routes'
import { usePathname } from '@scf/core/utils/usePathname'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { movedToAdminTarget } from './moved-paths'

/**
 * What is left at each /office path that moved to Admin (#1439): a redirect
 * to the same screen under /admin, keeping the query string — the Office
 * home links to notifications with `?status=failed`.
 */
export function MovedToAdminRedirect() {
  const pathname = usePathname()
  // A dynamic segment is already in the path; everything else is query.
  const { id: _id, ...query } = useLocalSearchParams<Record<string, string>>()
  const target = movedToAdminTarget(pathname) ?? ROUTES.ADMIN.path

  return <Redirect href={{ pathname: target, params: query }} />
}
