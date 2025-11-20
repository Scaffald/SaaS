import { ROUTES } from '@app/core/constants/routes'
import { DiscoverEmployerDetailScreen } from '@app/core/features/discover/discover-employer-detail-screen'
import { usePageTitle } from '@app/core/hooks/usePageTitle'
import { api } from '@app/core/utils/api'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'
import { useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'

export default function EmployerDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: employer, isLoading } = api.employers.getEmployerById.useQuery(
    { id: id || '' },
    {
      enabled: Boolean(id),
      staleTime: 5 * 60 * 1000,
    }
  )

  usePageTitle({
    title: () => {
      if (!id) {
        return null
      }

      if (isLoading || !employer) {
        return 'Employer Profile'
      }

      return employer.name || 'Employer Profile'
    },
    deps: [id, employer?.name, isLoading],
  })

  const breadcrumbItems = useMemo(
    () => [
      { label: 'Dashboard', href: ROUTES.DASHBOARD.path },
      { label: 'Employers', href: ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.path },
      {
        label: employer?.name || 'Employer Profile',
        isActive: true,
      },
    ],
    [employer?.name]
  )

  if (!id) {
    return null
  }

  const { left, right } = DiscoverEmployerDetailScreen({ employerId: id })

  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      leftContent={left}
      rightContent={<QuickLinksSidebar>{right}</QuickLinksSidebar>}
    />
  )
}
