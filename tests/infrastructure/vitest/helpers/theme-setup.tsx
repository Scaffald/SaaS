import type { ReactNode } from 'react'
import { ThemeProvider } from '@unicornlove/beyond-ui'

/**
 * Wraps children with Beyond-UI ThemeProvider for tests.
 * Use this instead of TamaguiTestWrapper (legacy name) when rendering components that need theme context.
 */
export function BeyondUIThemeWrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

/**
 * @deprecated Use BeyondUIThemeWrapper. Kept for backward compatibility with test-utils.
 */
/** @deprecated Use BeyondUIThemeWrapper. Kept for backward compatibility. */
export const TamaguiTestWrapper = BeyondUIThemeWrapper
