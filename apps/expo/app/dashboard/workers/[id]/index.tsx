import { DiscoverWorkerProfileScreen } from '@app/core/features/discover/discover-worker-profile-screen'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'
import { useLocalSearchParams } from 'expo-router'

export default function DiscoverWorkerProfilePage() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { left, right, breadcrumbItems } = DiscoverWorkerProfileScreen({ userId: id })

  return (
    <DashboardLayout
      leftContent={left}
      rightContent={<QuickLinksSidebar>{right}</QuickLinksSidebar>}
      breadcrumbItems={breadcrumbItems}
    />
  )
}
