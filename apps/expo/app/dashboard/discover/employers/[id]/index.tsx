import { useLocalSearchParams } from 'expo-router'
import { DashboardLayout } from '@app/ui'
import { DiscoverEmployerDetailScreen } from '@app/core/features/discover/discover-employer-detail-screen'

export default function EmployerDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return null
  }

  const { left, right } = DiscoverEmployerDetailScreen({ employerId: id })

  return <DashboardLayout leftContent={left} rightContent={right} />
}
