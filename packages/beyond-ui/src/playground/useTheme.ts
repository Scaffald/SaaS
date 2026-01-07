/**
 * Theme hook for accessing and managing theme state
 */

import { useContext } from 'react'
import { ThemeContext } from './ThemeProvider'

export type ThemeMode = 'light' | 'dark'

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
