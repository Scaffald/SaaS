import { ScaffaldLogo } from '@scf/core/assets'
import { useProtectedRoute } from '@scf/core/utils/auth/useProtectedRoute'
import { Box, Text, ThemeProvider, ToastContainer, ToastProvider } from '@scaffald/ui'
import { Stack } from 'expo-router'

export default function Layout() {
  const { isLoading } = useProtectedRoute()

  if (isLoading) {
    return (
      <ThemeProvider>
        <Box align="center" justify="center">
          <Text>Loading...</Text>
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <Stack
          screenOptions={{
            headerTitle: () => <ScaffaldLogo width={140} height={23} />,
            headerTitleAlign: 'center',
          }}
        />
        <ToastContainer />
      </ToastProvider>
    </ThemeProvider>
  )
}
