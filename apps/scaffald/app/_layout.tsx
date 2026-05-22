import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { getVersionDebugPayload } from '@scf/core/constants/appVersion'
import { loadThemePromise, Provider, UniversalThemeProvider, useThemeSetting, ThemeContext } from '@scf/core/provider'
import { initSentry } from '@scf/core/utils/sentry'
import { supabase } from '@scf/core/utils/supabase/client'
import { logger } from '@scf/core'
import { ThemeProvider } from '@scaffald/ui'
import type { ResolvedThemeMode } from '@scaffald/ui'
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  useFonts,
} from '@expo-google-fonts/roboto'
import { RobotoSerif_400Regular } from '@expo-google-fonts/roboto-serif'
import type { Session } from '@supabase/auth-js'
import { SplashScreen, Stack, useSegments } from 'expo-router'
import type { ReactNode } from 'react'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

/** Bridges UniversalThemeProvider (scf-core) to scaffald-ui ThemeProvider so one source drives both. */
function ThemeBridge({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useThemeSetting()
  // Use the stable onChangeTheme from context directly (memoized in UniversalThemeProvider)
  // rather than the new function created by useThemeSetting() on every call.
  const ctx = useContext(ThemeContext)
  const onChangeThemeRef = useRef(ctx?.onChangeTheme)
  onChangeThemeRef.current = ctx?.onChangeTheme
  const handleThemeChange = useCallback((theme: string) => {
    onChangeThemeRef.current?.(theme)
  }, [])
  // Scaffald-ui tokens only have colors.bg.light / colors.bg.dark; never pass 'system' or undefined
  const themeForUI: ResolvedThemeMode = resolvedTheme === 'dark' ? 'dark' : 'light'
  return (
    <ThemeProvider theme={themeForUI} onThemeChange={handleThemeChange}>
      {children}
    </ThemeProvider>
  )
}

// Initialize Sentry as early as possible (before any other initialization)
initSentry()

SplashScreen.preventAutoHideAsync()

export default function DashboardLayout() {
  const segments = useSegments()
  const [fontLoaded] = useFonts({
    Roboto: Roboto_400Regular,
    'Roboto-Medium': Roboto_500Medium,
    'Roboto-Bold': Roboto_700Bold,
    'Roboto Serif': RobotoSerif_400Regular,
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
    <SafeAreaProvider>
      <UniversalThemeProvider>
        <ThemeBridge>
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
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(public)" options={{ headerShown: false }} />
                    <Stack.Screen name="(protected)" options={{ headerShown: false }} />
                    <Stack.Screen name="(admin)" options={{ headerShown: false }} />
                  </Stack>
                </ErrorBoundary>
              </Provider>
            </View>
          </GestureHandlerRootView>
        </ThemeBridge>
      </UniversalThemeProvider>
    </SafeAreaProvider>
  )
}
