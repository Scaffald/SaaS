import type { config } from "@scaffald/neue-ui";

export type Conf = typeof config;

declare module "@scaffald/neue-ui" {
  interface TamaguiCustomConfig extends Conf {}
}
