import '../tamagui-web.css'

import { ErrorBoundary } from '@app/core/components/ErrorBoundary'
import { getVersionDebugPayload } from '@app/core/constants/appVersion'
import { loadThemePromise, Provider } from '@app/core/provider'
import { supabase } from '@app/core/utils/supabase/client'
import type { Session } from '@supabase/auth-js'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack, useSegments } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

SplashScreen.preventAutoHideAsync()

export default function DashboardLayout() {
  const segments = useSegments()
  const [fontLoaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })

  const [themeLoaded, setThemeLoaded] = useState(false)
  const [sessionLoadAttempted, setSessionLoadAttempted] = useState(false)
  const [initialSession, setInitialSession] = useState<Session | null>(null)
  useEffect(() => {
    console.info('[app version]', getVersionDebugPayload())
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <Provider initialSession={initialSession}>
          <ErrorBoundary
            context={{
              route: segments.join('/') || '/',
              environment: process.env.APP_ENV,
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
  )
}
