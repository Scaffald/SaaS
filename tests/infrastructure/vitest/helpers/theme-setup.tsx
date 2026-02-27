import type { ReactNode } from 'react'
import { ThemeProvider } from '@scaffald/ui'

/**
 * Wraps children with Beyond-UI ThemeProvider for tests.
 * Use this when rendering components that need theme context.
 */
export function BeyondUIThemeWrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

