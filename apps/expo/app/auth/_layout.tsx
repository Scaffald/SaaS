import { Stack } from 'expo-router'
import { useProtectedRoute } from '@app/core/utils/auth/useProtectedRoute'
import { View, Text } from 'react-native'

export default function Layout() {
  const { isLoading } = useProtectedRoute()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
