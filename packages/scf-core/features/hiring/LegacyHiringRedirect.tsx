import { ROUTES } from '@scf/core/constants/routes'
import { usePathname } from '@scf/core/utils/usePathname'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { legacyHiringTarget } from './legacy-paths'

/**
 * What is left at each old /office/applications path (#1312): a redirect to
 * the same screen under /hiring/applications, keeping the query string — My
 * Listings' `?job=` filter rode on it.
 *
 * The office layout skips its role gate for these paths (isLegacyHiringPath),
 * which is what lets an employer without the office role get here at all.
 */
export function LegacyHiringRedirect() {
  const pathname = usePathname()
  // The route's own segment is already in the path; everything else is query.
  const { applicationId: _applicationId, ...query } = useLocalSearchParams<Record<string, string>>()
  const target = legacyHiringTarget(pathname) ?? ROUTES.HIRING.APPLICATIONS.path

  return <Redirect href={{ pathname: target, params: query }} />
}
