import { Text, YStack } from 'tamagui'
import { ProfileCompletionWidget } from '@app/core/features/dashboard/completion'
import { useRouter } from 'expo-router'

export function DashboardIndexRight() {
  const router = useRouter()

  const handleNavigate = (route: string) => {
    router.push(route)
  }

  return (
    <YStack gap="$4">
      <ProfileCompletionWidget onNavigate={handleNavigate} />
    </YStack>
  )
}
