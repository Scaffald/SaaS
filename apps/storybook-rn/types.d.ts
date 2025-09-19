export type Conf = typeof import('@my/ui').config

declare module '@my/ui' {
  interface TamaguiCustomConfig extends Conf {}
}
