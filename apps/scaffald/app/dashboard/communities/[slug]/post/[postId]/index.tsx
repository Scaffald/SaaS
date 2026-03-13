import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { PostDetailPage } from '@scf/core/features/communities/PostDetailPage'
import { useLocalSearchParams } from 'expo-router'

export default function PostDetailScreen() {
  const { postId = '' } = useLocalSearchParams<{ postId: string }>()

  return (
    <DashboardPage
      leftContent={<PostDetailPage postId={postId} />}
      showBreadcrumb={false}
      rightContent={null}
    />
  )
}
