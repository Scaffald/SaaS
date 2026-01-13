/**
 * Theme Provider for managing light/dark mode
 * Provides theme context and persistence via localStorage
 */

import type React from 'react'
import { createContext, useState, useEffect, useCallback, useContext } from 'react'
import { View, StyleSheet } from 'react-native'
import type { ThemeMode } from './useTheme'
import { colors } from '../tokens/colors'

// Re-export ThemeMode for convenience
export type { ThemeMode } from './useTheme'

export interface ThemeContextValue {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}

const THEME_STORAGE_KEY = 'beyond-ui-playground-theme'

interface ThemeProviderProps {
  children: React.ReactNode
  initialTheme?: ThemeMode
}

export function ThemeProvider({ children, initialTheme = 'light' }: ThemeProviderProps) {
  // Get initial theme from localStorage or props
  const getInitialTheme = useCallback((): ThemeMode => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (stored === 'light' || stored === 'dark') {
        return stored
      }
    }
    return initialTheme
  }, [initialTheme])

  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme)

  // Persist theme changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
      // Update document background for better visual context
      document.body.style.backgroundColor =
        theme === 'light' ? colors.bg.light.default : colors.bg.dark.default
    }
  }, [theme])

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  const value: ThemeContextValue = {
    theme,
    setTheme,
    toggleTheme,
  }

  // Apply theme styles to container
  const containerStyle = {
    ...styles.container,
    backgroundColor: theme === 'light' ? colors.bg.light.default : colors.bg.dark.default,
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
    // Note: flex: 1 makes the container fill available space
    // For web, the parent html/body should have height: 100%
  },
})
