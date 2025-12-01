import type { ReactNode } from 'react'
import { TamaguiProvider } from '@unicornlove/ui'
import { createTamagui } from '@unicornlove/ui'
import { config } from '@tamagui/config/v3'

/**
 * Creates a Tamagui instance for testing
 */
export function createTestTamagui() {
  return createTamagui(config)
}

/**
 * Test helper to render components with Tamagui theme
 */
export function TamaguiTestWrapper({ children }: { children: ReactNode }) {
  const tamaguiConfig = createTestTamagui()
  return <TamaguiProvider config={tamaguiConfig}>{children}</TamaguiProvider>
}
