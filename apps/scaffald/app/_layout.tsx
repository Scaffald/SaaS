import '../global.css'
import { ErrorBoundary } from '@scf/core/components/ErrorBoundary'
import { getVersionDebugPayload } from '@scf/core/constants/appVersion'
import {
  loadThemePromise,
  Provider,
  UniversalThemeProvider,
  useThemeSetting,
  ThemeContext,
} from '@scf/core/provider'
import { supabase } from '@scf/core/utils/supabase/client'
import { logger } from '@scf/core'
import { ServerViewportProvider, ThemeProvider } from '@scaffald/ui'
import type { ResolvedThemeMode } from '@scaffald/ui'
import { useAppFonts } from '../utils/useAppFonts'
import { useServerViewportHint } from '../utils/use-server-viewport-hint'
import type { Session } from '@supabase/auth-js'
import { SplashScreen, Stack, useSegments } from 'expo-router'
import type { ReactNode } from 'react'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Platform, View } from 'react-native'
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

SplashScreen.preventAutoHideAsync()

export default function DashboardLayout() {
  const segments = useSegments()
  const [fontLoaded] = useAppFonts()
  // The device class the route loader inferred from the request, so the
  // server (and the hydration render) lay the page out for a phone when the
  // visitor is on one (#782). Undefined when no loader supplied a hint, in
  // which case the provider keeps the 1280×900 default.
  const serverViewport = useServerViewportHint()

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

  // The readiness gate is native-only. Branching on `typeof window` looks like
  // a server check but is also false during client hydration, so the client's
  // first pass returned null against a fully server-rendered document — a
  // hydration mismatch (React #418) that made React discard the SSR payload on
  // every route. Web needs no gate regardless: fonts come from CSS
  // (useAppFonts.web) and theme/session both render from server-safe defaults.
  if (Platform.OS !== 'web' && (!themeLoaded || !fontLoaded || !sessionLoadAttempted)) {
    return null
  }

  return (
    <SafeAreaProvider>
      <ServerViewportProvider viewport={serverViewport}>
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
      </ServerViewportProvider>
    </SafeAreaProvider>
  )
}
