/**
 * Tamagui module augmentation for @unicornlove/ui
 *
 * This file provides type declarations that augment the 'tamagui' module
 * with the custom configuration from this package.
 */

import type { config } from './tamagui.config'

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
