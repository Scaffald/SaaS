import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { CommunityMembersPage } from '@scf/core/features/communities/CommunityMembersPage'
import { useLocalSearchParams } from 'expo-router'

export default function CommunityMembersScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()

  return (
    <DashboardPage
      leftContent={<CommunityMembersPage slug={slug!} />}
      showBreadcrumb={false}
      rightContent={null}
    />
  )
}
