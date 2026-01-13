/**
 * BeyondUIProvider - Wrapper for Beyond UI components
 *
 * This provider sets up the Beyond UI theme context for gradual migration
 * from Tamagui to Beyond UI. During migration, both UI libraries coexist.
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
 * Provider for Beyond UI components during Tamagui migration
 *
 * Usage:
 * ```tsx
 * <TamaguiProvider>
 *   <BeyondUIProvider>
 *     <App />
 *   </BeyondUIProvider>
 * </TamaguiProvider>
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
