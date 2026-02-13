/**
 * AppStoreButton component types
 * Mobile app store badge buttons mapped from Figma
 */

import type { PressableProps, ViewStyle } from 'react-native'

/**
 * App stores
 */
export type AppStore =
  | 'appStore'
  | 'googlePlay'
  | 'galaxyStore'
  | 'oneStore'
  | 'appGallery'
  | 'microsoft'
  | 'amazonAppstore'
  | 'fDroid'

/**
 * App store button style
 */
export type AppStoreButtonStyle = 'filled' | 'outline'

/**
 * App store button props
 */
export interface AppStoreButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  /**
   * App store
   * @required
   */
  store: AppStore

  /**
   * Style variant
   * @default 'filled'
   */
  variant?: AppStoreButtonStyle

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Press handler
   */
  onPress?: () => void
}

/**
 * Store configuration
 */
export interface StoreConfig {
  name: string
  width: number
  height: number
  logo?: React.ComponentType
}
