import { Stack } from 'expo-router'
import { useProtectedRoute } from '@app/core/utils/auth/useProtectedRoute'
import { Text, View } from 'tamagui'

export default function Layout() {
  const { isLoading } = useProtectedRoute()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <View flex={1} justify="center" items="center">
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Stack />
    </>
  )
}
