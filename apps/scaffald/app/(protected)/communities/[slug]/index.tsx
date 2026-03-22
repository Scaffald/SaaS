import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { CommunityFeedPage } from '@scf/core/features/communities/CommunityFeedPage'
import { useLocalSearchParams } from 'expo-router'

export default function CommunityDetailPage() {
  const { slug = '' } = useLocalSearchParams<{ slug: string }>()

  return (
    <DashboardPage
      leftContent={<CommunityFeedPage slug={slug} />}
      showBreadcrumb={false}
      rightContent={null}
    />
  )
}
