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

interface ThemeProviderProps {
  children: React.ReactNode
  initialTheme?: ThemeMode
}

function resolveTheme(preference: ThemeMode, colorScheme: ColorSchemeName | null | undefined): ResolvedThemeMode {
  if (preference === 'system') {
    return colorScheme === 'dark' ? 'dark' : 'light'
  }
  return preference
}

export function ThemeProvider({ children, initialTheme = 'system' }: ThemeProviderProps) {
  // We store the user's preference (light, dark, system)
  const [themePreference, setThemePreference] = useState<ThemeMode>(initialTheme)
  // We store the resolved theme (light, dark)
  const [resolved, setResolved] = useState<ResolvedThemeMode>(
    resolveTheme(initialTheme, Appearance.getColorScheme())
  )
  const [isReady, setIsReady] = useState(false)

  // Initialize theme from storage
  useEffect(() => {
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
            setThemePreference(initialTheme)
            setResolved(resolveTheme(initialTheme, Appearance.getColorScheme()))
          }
          setIsReady(true)
        }
      } catch (e) {
        if (isMounted) {
          setThemePreference(initialTheme)
          setResolved(resolveTheme(initialTheme, Appearance.getColorScheme()))
          setIsReady(true)
        }
      }
    }

    initializeTheme()

    return () => {
      isMounted = false
    }
  }, [initialTheme])

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setResolved(resolveTheme(themePreference, colorScheme))
    })

    return () => subscription.remove()
  }, [themePreference])

  // Update resolved when preference changes
  useEffect(() => {
    setResolved(resolveTheme(themePreference, Appearance.getColorScheme()))
  }, [themePreference])

  // Persist theme changes when they occur, and apply body styles on web
  useEffect(() => {
    if (!isReady) return

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
  }, [themePreference, resolved, isReady])

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemePreference(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemePreference((prev) => {
      const currentResolved = resolveTheme(prev, Appearance.getColorScheme())
      return currentResolved === 'light' ? 'dark' : 'light'
    })
  }, [])

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
