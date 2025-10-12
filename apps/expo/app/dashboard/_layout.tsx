import { useProtectedRoute } from '@app/core/utils/auth/useProtectedRoute'
import { DrawerLayout } from '@app/core/features/drawer/DrawerLayout'
import { Drawer } from 'expo-router/drawer'
import { YStack, Text, Spinner } from 'tamagui'
import { useRouter } from 'expo-router'
import { usePathname } from '@app/core/utils/usePathname'
import { useEffect } from 'react'
import { api } from '@app/core/utils/api'

export default function Layout() {
  const { isLoading } = useProtectedRoute()
  const router = useRouter()
  const pathname = usePathname()

  // Check prerequisites status
  const { data: statusData, isLoading: isCheckingPrereqs } = api.prerequisites.check.useQuery()

  // Redirect to /dashboard if prerequisites incomplete and not already there
  useEffect(() => {
    if (!isCheckingPrereqs && statusData && !statusData.isComplete) {
      if (pathname !== '/dashboard' && !pathname?.startsWith('/dashboard/index')) {
        router.replace('/dashboard')
      }
    }
  }, [statusData, isCheckingPrereqs, pathname, router])

  // Show loading state BEFORE rendering the drawer
  if (isLoading || isCheckingPrereqs) {
    return (
      <YStack flex={1} justify="center" items="center" bg="$background">
        <Spinner size="large" />
        <Text mt="$4">Loading...</Text>
      </YStack>
    )
  }

  // Only render drawer once auth is confirmed
  return (
    <DrawerLayout protectionComponent={null} hideDrawer={!statusData?.isComplete}>
      <Drawer.Screen name="index" options={{ title: 'Dashboard' }} />
      <Drawer.Screen name="discover/map/index" options={{ title: 'Map Search' }} />
      <Drawer.Screen name="discover/workers/index" options={{ title: 'Search Workers' }} />
      <Drawer.Screen name="discover/employers/index" options={{ title: 'Search Employers' }} />
      <Drawer.Screen name="discover/jobs/index" options={{ title: 'Search Jobs' }} />
      <Drawer.Screen name="profile/general/index" options={{ title: 'General Information' }} />
      <Drawer.Screen name="profile/education/index" options={{ title: 'Education' }} />
      <Drawer.Screen name="profile/employment/index" options={{ title: 'Employment' }} />
      <Drawer.Screen name="profile/experience/index" options={{ title: 'Experience' }} />
      <Drawer.Screen name="profile/skills/index" options={{ title: 'Skills' }} />
      <Drawer.Screen name="profile/certifications/index" options={{ title: 'Certifications' }} />
    </DrawerLayout>
  )
}
