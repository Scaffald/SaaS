import { useProtectedRoute } from '@scf/core/utils/auth/useProtectedRoute'
import { Box, Text, ToastContainer, ToastProvider } from '@scaffald/ui'
import { Stack } from 'expo-router'
import { View } from 'react-native'
<<<<<<< HEAD
import { AuthFloatingToggles } from './_FloatingToggles'
=======
import { AuthFloatingToggles } from './FloatingToggles'
>>>>>>> 06c695fa7 (feat(design): earth tones theme, glassmorphism auth card, and WCAG contrast fixes)

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
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
        <AuthFloatingToggles />
      </View>
      <ToastContainer />
    </ToastProvider>
  )
}
