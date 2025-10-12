import { YStack, Spinner, Text } from 'tamagui'
import { ProfileCompletionWidget } from './completion'
import { PrerequisiteWidget } from '../prerequisites/PrerequisiteWidget'
import { useRouter } from 'expo-router'
import { api } from '@app/core/utils/api'

/**
 * Dashboard Index Left Component
 * Shows PrerequisiteWidget when prerequisites are incomplete,
 * otherwise shows ProfileCompletionWidget
 */
export function DashboardIndexLeft() {
  const router = useRouter()
  const { data: statusData, isLoading } = api.prerequisites.check.useQuery()

  const handleNavigate = (route: string) => {
    router.push(route)
  }

  // Show loading state while checking prerequisites
  if (isLoading) {
    return (
      <YStack gap="$3" items="center" py="$8">
        <Spinner size="large" />
        <Text color="$color11">Loading...</Text>
      </YStack>
    )
  }

  // Show PrerequisiteWidget if prerequisites are incomplete
  if (!statusData?.isComplete) {
    return <PrerequisiteWidget />
  }

  // Show ProfileCompletionWidget if prerequisites are complete
  return <ProfileCompletionWidget onNavigate={handleNavigate} />
}
