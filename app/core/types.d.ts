import { config } from '@app/ui'

export type Conf = typeof config

declare module '@app/ui' {
  interface TamaguiCustomConfig extends Conf {}
}
