export type Conf = typeof import('@app/ui').config

declare module '@app/ui' {
  interface TamaguiCustomConfig extends Conf {}
}

