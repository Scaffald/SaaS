/**
 * BeyondUIProvider - Provider for Beyond UI components
 *
 * Sets up the Beyond UI theme context for the application.
 * Migration from Tamagui to Beyond UI is complete for forsured-web.
 *
 * Note: The ThemeProvider is currently in beyond-ui's playground folder.
 * It will be moved to a proper location in a future update.
 */

import type { ReactNode } from 'react'
import { ThemeProvider as BeyondThemeProvider } from '@unicornlove/beyond-ui'
import type { ThemeMode } from '@unicornlove/beyond-ui'

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
