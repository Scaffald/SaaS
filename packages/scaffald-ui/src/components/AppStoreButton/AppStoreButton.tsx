/**
 * AppStoreButton component
 * Mobile app store download badges
 *
 * @example
 * ```tsx
 * import { AppStoreButton } from '@scaffald/ui'
 *
 * // Apple App Store badge
 * <AppStoreButton store="appStore" onPress={handleAppStorePress} />
 *
 * // Google Play badge
 * <AppStoreButton store="googlePlay" variant="outline" />
 * ```
 */

import { Pressable, View, StyleSheet } from 'react-native'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import type { AppStoreButtonProps, AppStore, StoreConfig } from './AppStoreButton.types'
import { useThemeContext } from '../../theme'

/**
 * Store configurations with dimensions
 * Dimensions from Figma design
 */
const storeConfigs: Record<AppStore, StoreConfig> = {
  appStore: {
    name: 'App Store',
    width: 120,
    height: 40,
  },
  googlePlay: {
    name: 'Google Play',
    width: 135,
    height: 40,
  },
  galaxyStore: {
    name: 'Galaxy Store',
    width: 147,
    height: 40,
  },
  oneStore: {
    name: 'One Store',
    width: 135,
    height: 40,
  },
  appGallery: {
    name: 'App Gallery',
    width: 133,
    height: 40,
  },
  microsoft: {
    name: 'Microsoft',
    width: 111,
    height: 40,
  },
  amazonAppstore: {
    name: 'Amazon Appstore',
    width: 137,
    height: 40,
  },
  fDroid: {
    name: 'F-Droid',
    width: 112,
    height: 40,
  },
}

export function AppStoreButton({
  store,
  variant = 'filled',
  style,
  onPress,
  ...pressableProps
}: AppStoreButtonProps) {
  const config = storeConfigs[store]
  const { theme } = useThemeContext()

  // Get styles based on variant
  const containerStyle = [
    styles.container,
    {
      width: config.width,
      height: config.height,
      backgroundColor: variant === 'filled' ? colors.gray[900] : 'transparent',
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: variant === 'outline' ? colors.border[theme].default : 'transparent',
    },
    style,
  ]

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
      {...pressableProps}
    >
      <View style={styles.content}>
        {/* Store logo and text would be rendered here */}
        {/* Consumers should provide custom logo components via children or render prop */}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.s,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pressed: {
    opacity: 0.8,
  },
})

// Export types
export type { AppStoreButtonProps, AppStore, AppStoreButtonStyle } from './AppStoreButton.types'
