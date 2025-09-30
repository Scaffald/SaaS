import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui, setConfig } from 'tamagui'

// Development setup - only in development
if (process.env.NODE_ENV === 'development') {
  setupDev({
    visualizer: true,
  })
}

export const config = createTamagui(defaultConfig)

export default config

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
