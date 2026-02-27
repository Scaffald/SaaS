/**
 * BeyondUIProvider - Provider for Beyond UI components
 *
 * Sets up the Beyond UI theme context for the application.
 *
 * Note: The ThemeProvider is currently in beyond-ui's playground folder.
 * It will be moved to a proper location in a future update.
 */

import type { ReactNode } from 'react'
import { ThemeProvider as BeyondThemeProvider } from '@scaffald/ui'
import type { ThemeMode } from '@scaffald/ui'

interface BeyondUIProviderProps {
  children: ReactNode
  /**
   * Initial theme for Beyond UI components
   * Default: 'light'
   */
  initialTheme?: ThemeMode
}

/**
 * Provider for Beyond UI components
 *
 * Usage:
 * ```tsx
 * <BeyondUIProvider>
 *   <App />
 * </BeyondUIProvider>
 * ```
 */
export function BeyondUIProvider({
  children,
  initialTheme = 'light',
}: BeyondUIProviderProps) {
  return (
    <BeyondThemeProvider initialTheme={initialTheme}>
      {children}
    </BeyondThemeProvider>
  )
}

export default BeyondUIProvider
