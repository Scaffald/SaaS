/**
 * EditMenu styles
 * iOS 26 floating glassmorphic edit menu from Figma
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ResolvedThemeMode } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import { shadows } from '../../tokens/shadows'

export function getEditMenuStyles(theme: ResolvedThemeMode) {
  const container: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: borderRadius.pill,
    paddingLeft: 20,
    paddingRight: 4,
    ...shadows.iosSheet,
    // Glass background
    ...(Platform.OS === 'web'
      ? {
          backgroundColor:
            theme === 'light'
              ? 'rgba(245, 245, 245, 0.6)'
              : 'rgba(44, 44, 46, 0.7)',
        }
      : {
          backgroundColor:
            theme === 'light'
              ? 'rgba(245, 245, 245, 0.88)'
              : 'rgba(44, 44, 46, 0.92)',
        }),
  }

  // Apply backdrop-filter on web
  if (Platform.OS === 'web') {
    ;(container as Record<string, unknown>).backdropFilter = 'blur(50px)'
    ;(container as Record<string, unknown>).WebkitBackdropFilter = 'blur(50px)'
  }

  const actionsRow: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  }

  const actionItem: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  }

  const actionLabel: TextStyle = {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.6,
    color: colors.labelsVibrant[theme].primary,
  }

  const destructiveLabel: TextStyle = {
    ...actionLabel,
    color: colors.accents[theme].red,
  }

  const disabledLabel: TextStyle = {
    ...actionLabel,
    opacity: 0.4,
  }

  const separator: ViewStyle = {
    width: 1,
    height: 18,
    backgroundColor: colors.fillsVibrant[theme].primary,
    marginRight: 16,
  }

  const moreButton: ViewStyle = {
    width: 36,
    height: 36,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.fillsVibrant[theme].tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }

  const moreButtonPressed: ViewStyle = {
    opacity: 0.7,
  }

  const moreIcon: TextStyle = {
    fontSize: 15,
    fontWeight: '590' as TextStyle['fontWeight'],
    color: colors.labelsVibrant[theme].primary,
  }

  return {
    container,
    actionsRow,
    actionItem,
    actionLabel,
    destructiveLabel,
    disabledLabel,
    separator,
    moreButton,
    moreButtonPressed,
    moreIcon,
  }
}
