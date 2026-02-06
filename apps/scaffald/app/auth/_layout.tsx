import { useProtectedRoute } from '@scf/core/utils/auth/useProtectedRoute'
import {
  Box,
  Text,
  ThemeProvider,
  ToastContainer,
  ToastProvider,
} from '@unicornlove/beyond-ui'
import { Stack } from 'expo-router'

export default function Layout() {
  const { isLoading } = useProtectedRoute()

  if (isLoading) {
    return (
      <ThemeProvider>
        <Box flex={1} align="center" justify="center">
          <Text>Loading...</Text>
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <Stack.Screen options={{ headerShown: false }} />
        <Stack />
        <ToastContainer />
      </ToastProvider>
    </ThemeProvider>
  )
}
