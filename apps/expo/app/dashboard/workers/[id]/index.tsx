import { DashboardPage } from '@app/core/features/dashboard/DashboardPage'
import { DiscoverWorkerProfileScreen } from '@app/core/features/discover/discover-worker-profile-screen'
import { useLocalSearchParams } from 'expo-router'

export default function DiscoverWorkerProfilePage() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { left, right, breadcrumbItems } = DiscoverWorkerProfileScreen({ userId: id })

  return <DashboardPage leftContent={left} rightContent={right} breadcrumbItems={breadcrumbItems} />
}
