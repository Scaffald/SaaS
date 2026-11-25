import { Redirect } from 'expo-router'
import { Spinner, Stack } from '@scaffald/ui'
import { ROUTES } from '@scf/core/constants/routes'
import { usePathname } from '@scf/core/utils/usePathname'
import { useOrganizations } from '@scf/core/utils/useOrganizations'
import { legacyDevelopersTarget } from './legacy-paths'

/**
 * What is left at /office/api-keys and /office/webhooks/* (#1440): a redirect
 * to the same screen on the person's organization's Developers tab, or to My
 * Organizations when they belong to several or none.
 *
 * The office layout skips its role gate for these paths
 * (isLegacyDevelopersPath), which is what lets an organization admin without
 * the office role get here at all.
 */
export function LegacyDevelopersRedirect() {
  const pathname = usePathname()
  // isPending, not isLoading: the query is disabled until the user resolves,
  // and a disabled query reports isLoading false with no data — which read as
  // "in no organization" and sent everyone to My Organizations.
  const { data: memberships, isPending, isError } = useOrganizations()

  if (isPending && !isError) {
    return (
      <Stack flex={1} padding="xl" align="center" justify="center">
        <Spinner size="lg" />
      </Stack>
    )
  }

  const slugs = isError ? [] : (memberships ?? []).map((m) => m.organization_slug)
  const target = legacyDevelopersTarget(pathname, slugs) ?? ROUTES.EMPLOYERS.ORG.path
  return <Redirect href={target} />
}
