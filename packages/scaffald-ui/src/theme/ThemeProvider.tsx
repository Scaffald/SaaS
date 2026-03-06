/**
 * Theme Provider for managing light/dark mode
 * Provides theme context and persistence via localStorage (Web) or AsyncStorage (Native).
 * Also listens to system appearance changes.
 */

import type React from 'react'
import { createContext, useState, useEffect, useCallback, useContext } from 'react'
import { View, StyleSheet, Platform, Appearance, type ColorSchemeName } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ThemeMode, ResolvedThemeMode } from '../tokens/colors'
import { colors } from '../tokens/colors'

// Re-export ThemeMode and ResolvedThemeMode for convenience
export type { ThemeMode, ResolvedThemeMode } from '../tokens/colors'

export interface ThemeContextValue {
  theme: ResolvedThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

const DEFAULT_THEME_VALUE: ThemeContextValue = {
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(
        '[beyond-ui] useThemeContext was used outside a ThemeProvider. Wrap your app (or the component tree that uses theme) with <ThemeProvider> from @scaffald/ui.'
      )
    }
    return DEFAULT_THEME_VALUE
  }
  return context
}

const THEME_STORAGE_KEY = 'beyond-ui-theme'

export interface ThemeProviderProps {
  children: React.ReactNode
  /** Uncontrolled: initial theme. Ignored when theme + onThemeChange are provided. */
  initialTheme?: ThemeMode
  /** Controlled: current resolved theme (light/dark). */
  theme?: ResolvedThemeMode
  /** Controlled: called when user requests a theme change. When both theme and onThemeChange are set, provider is controlled. */
  onThemeChange?: (preference: ThemeMode) => void
}

function isControlled(props: ThemeProviderProps): boolean {
  return props.theme !== undefined && props.onThemeChange !== undefined
}

function resolveTheme(preference: ThemeMode, colorScheme: ColorSchemeName | null | undefined): ResolvedThemeMode {
  if (preference === 'system') {
    return colorScheme === 'dark' ? 'dark' : 'light'
  }
  return preference
}

export function ThemeProvider(props: ThemeProviderProps) {
  const controlled = isControlled(props)
  const { children } = props

  // Controlled: use props; Uncontrolled: use internal state
  const [themePreference, setThemePreference] = useState<ThemeMode>(
    controlled && props.theme != null ? (props.theme as ThemeMode) : (props.initialTheme ?? 'system')
  )
  const [resolved, setResolved] = useState<ResolvedThemeMode>(
    controlled && props.theme != null ? props.theme : resolveTheme(props.initialTheme ?? 'system', Appearance.getColorScheme())
  )
  const [isReady, setIsReady] = useState(controlled)

  // Initialize theme from storage (uncontrolled only)
  useEffect(() => {
    if (controlled) return
    let isMounted = true

    const initializeTheme = async () => {
      try {
        let stored: string | null = null
        if (Platform.OS === 'web') {
          stored = typeof window !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null
        } else if (AsyncStorage) {
          stored = await AsyncStorage.getItem(THEME_STORAGE_KEY)
        }

        if (isMounted) {
          if (stored === 'light' || stored === 'dark' || stored === 'system') {
            setThemePreference(stored as ThemeMode)
            setResolved(resolveTheme(stored as ThemeMode, Appearance.getColorScheme()))
          } else {
            const init = props.initialTheme ?? 'system'
            setThemePreference(init)
            setResolved(resolveTheme(init, Appearance.getColorScheme()))
          }
          setIsReady(true)
        }
      } catch (e) {
        if (isMounted) {
          setThemePreference(props.initialTheme ?? 'system')
          setResolved(resolveTheme(props.initialTheme ?? 'system', Appearance.getColorScheme()))
          setIsReady(true)
        }
      }
    }

    initializeTheme()

    return () => {
      isMounted = false
    }
  }, [controlled, props.initialTheme])

  // Listen to system theme changes (uncontrolled only)
  useEffect(() => {
    if (controlled) return
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setResolved(resolveTheme(themePreference, colorScheme))
    })

    return () => subscription.remove()
  }, [controlled, themePreference])

  // Update resolved when preference changes (uncontrolled only)
  useEffect(() => {
    if (controlled) return
    setResolved(resolveTheme(themePreference, Appearance.getColorScheme()))
  }, [controlled, themePreference])

  // Sync resolved from controlled theme
  useEffect(() => {
    if (controlled && props.theme != null) {
      setResolved(props.theme)
    }
  }, [controlled, props.theme])

  // Persist theme changes when they occur, and apply body styles on web (uncontrolled only)
  useEffect(() => {
    if (controlled || !isReady) return

    const persistTheme = async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          localStorage.setItem(THEME_STORAGE_KEY, themePreference)
          document.body.style.backgroundColor =
            resolved === 'light' ? colors.bg.light.default : colors.bg.dark.default
        } else if (AsyncStorage) {
          await AsyncStorage.setItem(THEME_STORAGE_KEY, themePreference)
        }
      } catch (e) {
        // ignore storage errors
      }
    }

    persistTheme()
  }, [controlled, themePreference, resolved, isReady])

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      if (controlled && props.onThemeChange) {
        props.onThemeChange(newTheme)
      } else {
        setThemePreference(newTheme)
      }
    },
    [controlled, props]
  )

  const toggleTheme = useCallback(() => {
    if (controlled && props.onThemeChange) {
      const next: ThemeMode = resolved === 'light' ? 'dark' : 'light'
      props.onThemeChange(next)
    } else {
      setThemePreference((prev) => {
        const currentResolved = resolveTheme(prev, Appearance.getColorScheme())
        return currentResolved === 'light' ? 'dark' : 'light'
      })
    }
  }, [controlled, resolved, props])

  const value: ThemeContextValue = {
    theme: resolved,
    setTheme,
    toggleTheme,
  }

  const containerStyle = {
    ...styles.container,
    backgroundColor: resolved === 'light' ? colors.bg.light.default : colors.bg.dark.default,
  }

  return (
    <ThemeContext.Provider value={value}>
      <View style={containerStyle}>{children}</View>
    </ThemeContext.Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
