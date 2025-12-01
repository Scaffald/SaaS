import type { config } from "@unicornlove/ui";

export type Conf = typeof config;

declare module "@unicornlove/ui" {
  interface TamaguiCustomConfig extends Conf {}
}
