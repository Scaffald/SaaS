import { useLocalSearchParams } from 'expo-router'
import { DiscoverJobDetailScreen } from '@app/core/features/discover/discover-job-detail-screen'
import { DashboardLayout } from '@app/ui'

export default function JobDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return null
  }

  const { left, right } = DiscoverJobDetailScreen({ jobId: id })
  return <DashboardLayout leftContent={left} rightContent={right} />
}
