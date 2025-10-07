import { useRoleProtectedRoute } from '@app/core/utils/auth/useRoleProtectedRoute'
import { DrawerLayout } from '@app/core/features/drawer/DrawerLayout'
import { Drawer } from 'expo-router/drawer'
import { YStack, Text, Spinner } from 'tamagui'

function ProtectionWrapper() {
  const { isAuthorized, isLoading } = useRoleProtectedRoute(['super_admin'])

  if (isLoading) {
    return (
      <YStack flex={1} justify="center" items="center">
        <Spinner size="large" />
        <Text mt="$4">Loading...</Text>
      </YStack>
    )
  }

  if (!isAuthorized) return null

  return null
}

export default function OfficeLayout() {
  return (
    <DrawerLayout protectionComponent={<ProtectionWrapper />}>
      <Drawer.Screen name="index" options={{ title: 'Office' }} />
      <Drawer.Screen name="users/index" options={{ title: 'Manage Users' }} />
      <Drawer.Screen name="jobs/index" options={{ title: 'Manage Jobs' }} />
      <Drawer.Screen name="jobs/create" options={{ title: 'Create Job' }} />
      <Drawer.Screen name="jobs/[id]/edit" options={{ title: 'Edit Job' }} />
    </DrawerLayout>
  )
}
