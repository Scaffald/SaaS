import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { DiscoverEmployerDetailScreen } from '@scf/core/features/discover/discover-employer-detail-screen'
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
      { route: ROUTES.DASHBOARD.DISCOVER.EMPLOYERS },
      { isActive: true, label: employer?.name || 'Employer Profile' },
    ],
    [employer?.name]
  )

  if (!id) {
    return null
  }

  const { left, right } = DiscoverEmployerDetailScreen({ employerId: id })

  return (
    <DashboardPage
      breadcrumbs={breadcrumbs}
      pageTitle={() => {
        if (isLoading || !employer) {
          return 'Employer Profile'
        }

        return employer.name || 'Employer Profile'
      }}
      pageTitleDeps={[employer?.name, isLoading]}
      leftContent={left}
      rightContent={right}
    />
  )
}
