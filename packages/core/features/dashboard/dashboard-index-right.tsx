import { ScrollView } from 'tamagui'
import { ProfileCompletionWidget } from '@app/core/features/dashboard/completion'
import { NewsWidget } from '@app/core/features/news'
import { useRouter } from 'expo-router'

export function DashboardIndexRight() {
  const router = useRouter()

  const handleNavigate = (route: string) => {
    router.push(route)
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <ProfileCompletionWidget onNavigate={handleNavigate} />

      {/* News Widget - replaces the hardcoded news cards */}
      <NewsWidget industry="construction" maxItems={5} showFeedSelector={true} />
    </ScrollView>
  )
}
