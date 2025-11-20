import { DashboardPage } from '@app/core/features/dashboard/DashboardPage'
import { DiscoverJobDetailScreen } from '@app/core/features/discover/discover-job-detail-screen'
import { useLocalSearchParams } from 'expo-router'

export default function JobDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return null
  }

  const { left, right } = DiscoverJobDetailScreen({ jobId: id })
  return <DashboardPage leftContent={left} rightContent={right} />
}
