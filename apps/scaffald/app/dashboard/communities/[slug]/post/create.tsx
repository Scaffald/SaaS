import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import { PostComposer } from '@scf/core/features/communities/components/PostComposer'
import { useLocalSearchParams } from 'expo-router'

export default function CreatePostScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()

  return (
    <DashboardPage
      leftContent={<PostComposer communitySlug={slug!} />}
      showBreadcrumb={false}
      rightContent={null}
    />
  )
}
