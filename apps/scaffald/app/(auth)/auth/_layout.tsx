import { useProtectedRoute } from '@scf/core/utils/auth/useProtectedRoute'
import { Box, Text, ToastContainer, ToastProvider } from '@scaffald/ui'
import { Stack } from 'expo-router'
import { View } from 'react-native'
import { AuthFloatingToggles } from './FloatingToggles'

export default function Layout() {
  const { isLoading } = useProtectedRoute()

  if (isLoading) {
    return (
      <Box align="center" justify="center">
        <Text>Loading...</Text>
      </Box>
    )
  }

  return (
    <ToastProvider>
      <View style={{ flex: 1 }}>
        <AuthFloatingToggles />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </View>
      <ToastContainer />
    </ToastProvider>
  )
}
