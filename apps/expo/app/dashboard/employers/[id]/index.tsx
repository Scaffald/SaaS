import { DiscoverEmployerDetailScreen } from '@app/core/features/discover/discover-employer-detail-screen'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'
import { useLocalSearchParams } from 'expo-router'

export default function EmployerDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>()

  if (!id) {
    return null
  }

  const { left, right } = DiscoverEmployerDetailScreen({ employerId: id })

  return (
    <DashboardLayout
      leftContent={left}
      rightContent={<QuickLinksSidebar>{right}</QuickLinksSidebar>}
    />
  )
}
