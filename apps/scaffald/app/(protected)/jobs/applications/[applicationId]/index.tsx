import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { ApplicationDetailScreen } from '@scf/core/features/applications/components/ApplicationDetailScreen'
import { useLocalSearchParams } from 'expo-router'

export default function ApplicationDetailRoute() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>()

  const breadcrumbs = [
    { route: ROUTES.JOBS },
    { route: ROUTES.JOBS.APPLICATIONS },
    { label: 'Application Details' },
  ]

  return (
    <DashboardPage
      breadcrumbs={breadcrumbs}
      leftContent={<ApplicationDetailScreen applicationId={applicationId ?? ''} />}
    />
  )
}
