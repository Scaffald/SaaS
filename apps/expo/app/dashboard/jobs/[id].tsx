import { DiscoverJobDetailScreen } from '@app/core/features/discover/discover-job-detail-screen'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'
import { useLocalSearchParams } from 'expo-router'

export default function JobDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return null
  }

  const { left, right } = DiscoverJobDetailScreen({ jobId: id })
  return (
    <DashboardLayout
      leftContent={left}
      rightContent={<QuickLinksSidebar>{right}</QuickLinksSidebar>}
    />
  )
}
