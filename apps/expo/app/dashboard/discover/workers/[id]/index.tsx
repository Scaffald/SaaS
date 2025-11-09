import { useLocalSearchParams } from 'expo-router'
import { DashboardLayout } from '@app/ui'
import { DiscoverWorkerProfileScreen } from '@app/core/features/discover/discover-worker-profile-screen'

export default function DiscoverWorkerProfilePage() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { left, right, breadcrumbItems } = DiscoverWorkerProfileScreen({ userId: id })

  return (
    <DashboardLayout leftContent={left} rightContent={right} breadcrumbItems={breadcrumbItems} />
  )
}
