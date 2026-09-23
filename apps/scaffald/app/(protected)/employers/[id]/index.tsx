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
      { route: ROUTES.EMPLOYERS },
      { isActive: true, label: employer?.name || 'Employer Profile' },
    ],
    [employer?.name]
  )

  if (!id) {
    return null
  }

  const title = isLoading || !employer ? null : (employer.name ?? null)

  // Trade · location, above the name — the posting's context, the way every
  // other screen states its own (#828).
  const kicker = [employer?.industry, employer?.location].filter(Boolean).join(' · ') || undefined

  const { left, right } = DiscoverEmployerDetailScreen({ employerId: id })

  return (
    <DashboardPage
      breadcrumbs={breadcrumbs}
      pageTitle={() => title ?? 'Employer Profile'}
      pageTitleDeps={[employer?.name, isLoading]}
      screenTitle={title}
      screenKicker={kicker}
      leftContent={left}
      rightContent={right}
    />
  )
}
