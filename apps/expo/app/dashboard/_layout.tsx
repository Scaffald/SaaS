import { useProtectedRoute } from '@app/core/utils/auth/useProtectedRoute'
import { DrawerLayout } from '@app/core/features/drawer/DrawerLayout'
import { Drawer } from 'expo-router/drawer'
import { YStack, Text } from 'tamagui'

function ProtectionWrapper() {
  const { isLoading } = useProtectedRoute()

  if (isLoading) {
    return (
      <YStack flex={1} justify="center" items="center">
        <Text>Loading...</Text>
      </YStack>
    )
  }

  return null
}

export default function Layout() {
  return (
    <DrawerLayout protectionComponent={<ProtectionWrapper />}>
      <Drawer.Screen name="index" options={{ title: 'Dashboard' }} />
      <Drawer.Screen name="discover/index" options={{ title: 'Discover' }} />
      <Drawer.Screen name="profile/general/index" options={{ title: 'General Information' }} />
      <Drawer.Screen name="profile/education/index" options={{ title: 'Education' }} />
      <Drawer.Screen name="profile/employment/index" options={{ title: 'Employment' }} />
      <Drawer.Screen name="profile/experience/index" options={{ title: 'Experience' }} />
      <Drawer.Screen name="profile/skills/index" options={{ title: 'Skills' }} />
      <Drawer.Screen name="profile/certifications/index" options={{ title: 'Certifications' }} />
    </DrawerLayout>
  )
}
