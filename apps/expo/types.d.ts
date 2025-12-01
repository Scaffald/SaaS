export type Conf = typeof import("@unicornlove/ui").config;

declare module "@unicornlove/ui" {
  interface TamaguiCustomConfig extends Conf {}
}
