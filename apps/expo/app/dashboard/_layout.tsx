import { useProtectedRoute } from '@app/core/utils/auth/useProtectedRoute'
import { DrawerLayout } from '@app/core/features/drawer/DrawerLayout'
import { Drawer } from 'expo-router/drawer'
import { YStack, Text, Spinner } from 'tamagui'

export default function Layout() {
  const { isLoading } = useProtectedRoute()

  // Show loading state BEFORE rendering the drawer
  if (isLoading) {
    return (
      <YStack flex={1} justify="center" items="center" bg="$background">
        <Spinner size="large" />
        <Text mt="$4">Loading...</Text>
      </YStack>
    )
  }

  // Only render drawer once auth is confirmed
  return (
    <DrawerLayout protectionComponent={null}>
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
