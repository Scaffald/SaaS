import type { config } from '@scaffald/tamagui-ui'

export type Conf = typeof config

declare module '@scaffald/tamagui-ui' {
  interface TamaguiCustomConfig extends Conf {}
}
