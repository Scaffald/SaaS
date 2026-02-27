import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { getVersionDebugPayload } from '@scf/core/constants/appVersion'
import { loadThemePromise, Provider } from '@scf/core/provider'
import { initSentry } from '@scf/core/utils/sentry'
import { supabase } from '@scf/core/utils/supabase/client'
import { logger } from '@scf/core'
import { ThemeProvider } from '@scaffald/ui'
import { RobotoSerif_400Regular, useFonts } from '@expo-google-fonts/roboto-serif'
import type { Session } from '@supabase/auth-js'
import { SplashScreen, Stack, useSegments } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

// Initialize Sentry as early as possible (before any other initialization)
initSentry()

SplashScreen.preventAutoHideAsync()

export default function DashboardLayout() {
  const segments = useSegments()
  const [fontLoaded] = useFonts({
    RobotoSerif_400Regular,
  })

  const [themeLoaded, setThemeLoaded] = useState(false)
  const [sessionLoadAttempted, setSessionLoadAttempted] = useState(false)
  const [initialSession, setInitialSession] = useState<Session | null>(null)
  useEffect(() => {
    if (__DEV__) {
      logger.info('App initialized', getVersionDebugPayload())
    }
  }, [])
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (data) {
          setInitialSession(data.session)
        }
      })
      .finally(() => {
        setSessionLoadAttempted(true)
      })
  }, [])

  useEffect(() => {
    loadThemePromise.then(() => {
      setThemeLoaded(true)
    })
  }, [])

  const onLayoutRootView = useCallback(async () => {
    if (fontLoaded && sessionLoadAttempted && themeLoaded) {
      await SplashScreen.hideAsync()
    }
  }, [fontLoaded, sessionLoadAttempted, themeLoaded])

  if (!themeLoaded || !fontLoaded || !sessionLoadAttempted) {
    return null
  }

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <Provider initialSession={initialSession}>
            <ErrorBoundary
              context={{
                environment: process.env.APP_ENV,
                route: segments.join('/') || '/',
              }}
            >
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Stack.Screen
                  name="auth"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="dashboard"
                  options={{
                    headerShown: false,
                  }}
                />
              </Stack>
            </ErrorBoundary>
          </Provider>
        </View>
      </GestureHandlerRootView>
    </ThemeProvider>
  )
}
