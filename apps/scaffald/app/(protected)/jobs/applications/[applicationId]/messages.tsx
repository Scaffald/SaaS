import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { WorkerMessagesScreen } from '@scf/core/features/applications/WorkerMessagesScreen'
import { useLocalSearchParams } from 'expo-router'

export default function ApplicationMessagesRoute() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>()

  const breadcrumbs = [
    { route: ROUTES.JOBS },
    { route: ROUTES.JOBS.APPLICATIONS },
    { label: 'Messages' },
  ]

  return (
    <DashboardPage
      breadcrumbs={breadcrumbs}
      pageTitle="Messages"
      leftContent={<WorkerMessagesScreen applicationId={applicationId ?? ''} />}
    />
  )
}
