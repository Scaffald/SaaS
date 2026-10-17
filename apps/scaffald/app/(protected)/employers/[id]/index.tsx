import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { FollowEmployerButton } from '@scf/core/features/discover/components/FollowEmployerButton'
import { DiscoverEmployerDetailScreen } from '@scf/core/features/discover/discover-employer-detail-screen'
import {
  type EmployerAddress,
  employerDescriptor,
} from '@scf/core/features/discover/utils/employerFacts'
import { useEmployer } from '@scf/core/utils/employers-sdk-hooks'
import type { DashboardBreadcrumbSegment } from '@scf/core/utils/navigation/buildDashboardBreadcrumbs'
import { useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'

export default function EmployerDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: employer, isLoading } = useEmployer(
    { id: id || '' },
    {
      enabled: Boolean(id),
      staleTime: 5 * 60 * 1000,
    }
  )

  const breadcrumbs = useMemo<DashboardBreadcrumbSegment[]>(
    () => [
      { route: ROUTES.EMPLOYERS },
      { isActive: true, label: employer?.name || 'Employer Profile' },
    ],
    [employer?.name]
  )

  if (!id) {
    return null
  }

  const title = isLoading || !employer ? null : (employer.name ?? null)

  // The kicker was built from `industry` and `location`, neither of which
  // core.organizations has, so it was always empty and the header was just
  // the name. A constant kicker, and the facts as a descriptor line under the
  // name: industry · City, ST · on Scaffald since <year> (#1186). The
  // industry name and address come from the api's embed, which the SDK's
  // Employer type does not declare yet.
  const record = employer as
    | (typeof employer & {
        industries?: { name?: string | null } | null
        address?: EmployerAddress | null
      })
    | undefined
  const descriptor = record
    ? employerDescriptor({
        industryName: record.industries?.name,
        address: record.address,
        createdAt: record.created_at,
      }) || undefined
    : undefined

  const { left, right } = DiscoverEmployerDetailScreen({ employerId: id })

  return (
    <DashboardPage
      breadcrumbs={breadcrumbs}
      pageTitle={() => title ?? 'Employer Profile'}
      pageTitleDeps={[employer?.name, isLoading]}
      screenTitle={title}
      screenKicker="Employer"
      screenTip={descriptor}
      screenActions={<FollowEmployerButton employerId={id} />}
      leftContent={left}
      rightContent={right}
    />
  )
}
