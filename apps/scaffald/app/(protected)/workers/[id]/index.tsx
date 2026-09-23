import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { DiscoverWorkerProfileScreen } from '@scf/core/features/discover/discover-worker-profile-screen'
import { useLocalSearchParams } from 'expo-router'

export default function DiscoverWorkerProfilePage() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { content, screenTitle, screenKicker, breadcrumbItems } = DiscoverWorkerProfileScreen({
    userId: id,
  })

  return (
    <DashboardPage
      leftContent={content}
      screenTitle={screenTitle}
      screenKicker={screenKicker}
      breadcrumbItems={breadcrumbItems}
    />
  )
}
