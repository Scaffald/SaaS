export type Conf = typeof import('@scaffald/tamagui-ui').config

declare module '@scaffald/tamagui-ui' {
  interface TamaguiCustomConfig extends Conf {}
}
