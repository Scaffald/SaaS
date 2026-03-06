/**
 * BeyondUIProvider - Provider for Beyond UI (scaffald-ui) components
 *
 * Must be used inside forsured ThemeProvider. Syncs forsured theme (light/dark/earth)
 * with scaffald-ui ThemeProvider in controlled mode. Earth is mapped to light for UI.
 */

import type { ReactNode } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { ThemeProvider as ScaffaldThemeProvider } from '@scaffald/ui'
import type { ResolvedThemeMode } from '@scaffald/ui'

interface BeyondUIProviderProps {
  children: ReactNode
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Maps forsured theme to scaffald-ui resolved theme (earth -> light).
 */
function toResolved(theme: 'light' | 'dark' | 'earth'): ResolvedThemeMode {
  return theme === 'earth' ? 'light' : theme
}

/**
 * Provider for Beyond UI components. Uses forsured theme as single source of truth.
 */
export function BeyondUIProvider({ children }: BeyondUIProviderProps) {
  const { theme, setTheme } = useTheme()
  const resolved = toResolved(theme)

  const onThemeChange = (pref: 'light' | 'dark' | 'system') => {
    if (pref === 'system') {
      setTheme(getSystemTheme())
    } else {
      setTheme(pref)
    }
  }

  return (
    <ScaffaldThemeProvider theme={resolved} onThemeChange={onThemeChange}>
      {children}
    </ScaffaldThemeProvider>
  )
}

export default BeyondUIProvider
