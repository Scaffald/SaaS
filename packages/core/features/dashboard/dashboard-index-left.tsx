import { ScrollView, Text, YStack } from 'tamagui'
import { ProfileCompletionWidget } from './completion'
import { useRouter } from 'expo-router'

/**
 * Dashboard Index Left Component
 * Simplified placeholder for future dashboard content
 */
export function DashboardIndexLeft() {
  const router = useRouter()

  const handleNavigate = (route: string) => {
    router.push(route)
  }

  return <ProfileCompletionWidget onNavigate={handleNavigate} />
}
