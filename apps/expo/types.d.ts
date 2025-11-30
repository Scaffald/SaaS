export type Conf = typeof import("@scaffald/neue-ui").config;

declare module "@scaffald/neue-ui" {
  interface TamaguiCustomConfig extends Conf {}
}
