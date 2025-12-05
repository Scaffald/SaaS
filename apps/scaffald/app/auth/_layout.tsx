import { useProtectedRoute } from '@scf/core/utils/auth/useProtectedRoute'
import { Stack } from 'expo-router'
import { Text, View } from '@unicornlove/ui'

export default function Layout() {
  const { isLoading } = useProtectedRoute()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
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
