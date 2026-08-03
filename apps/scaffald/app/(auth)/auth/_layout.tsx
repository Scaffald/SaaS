import { useProtectedRoute } from '@scf/core/utils/auth/useProtectedRoute'
import { Box, colors, Text, ToastContainer, ToastProvider, useThemeContext } from '@scaffald/ui'
import { Stack } from 'expo-router'
import { View } from 'react-native'
// SC-49: hidden for MLP — restore when locale/theme are ready for end users.
// import { AuthFloatingToggles } from './FloatingToggles'

export default function Layout() {
  const { isLoading } = useProtectedRoute()
  const { theme } = useThemeContext()

  // The <Stack> must stay mounted even while the auth check is pending.
  // Returning a loading view *instead of* the navigator unmounts it during
  // hydration, so react-navigation resolves the focused route back to the
  // group's initial route and expo-router's history sync rewrites the URL to
  // /auth — destroying the OAuth tokens in the /auth/callback fragment before
  // supabase-js can read them. That was the entire "Google login silently
  // fails on prod" bug: the loading gate here ate the callback hash.
  return (
    <ToastProvider>
      <View style={{ flex: 1 }}>
        {/* <AuthFloatingToggles />  SC-49: see import comment */}
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
        {isLoading && (
          <Box
            align="center"
            justify="center"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: colors.bg[theme].default,
            }}
          >
            <Text>Loading...</Text>
          </Box>
        )}
      </View>
      <ToastContainer />
    </ToastProvider>
  )
}
