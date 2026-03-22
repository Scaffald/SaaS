/**
 * ActionSheet styles
 * iOS 26 glassmorphic action sheet design from Figma
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ResolvedThemeMode } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import { shadows } from '../../tokens/shadows'

export function getActionSheetStyles(theme: ResolvedThemeMode) {
  const overlay: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg[theme].overlay,
    justifyContent: 'flex-end',
    alignItems: 'center',
  }

  const container: ViewStyle = {
    width: '100%',
    maxWidth: 400,
    borderTopLeftRadius: borderRadius.sheet,
    borderTopRightRadius: borderRadius.sheet,
    padding: 14,
    gap: 10,
    ...shadows.iosSheet,
    // Glass background
    ...(Platform.OS === 'web'
      ? {
          backgroundColor: theme === 'light'
            ? 'rgba(245, 245, 245, 0.6)'
            : 'rgba(44, 44, 46, 0.7)',
        }
      : {
          backgroundColor: theme === 'light'
            ? 'rgba(245, 245, 245, 0.88)'
            : 'rgba(44, 44, 46, 0.92)',
        }),
  }

  // Apply backdrop-filter on web
  if (Platform.OS === 'web') {
    (container as Record<string, unknown>).backdropFilter = 'blur(50px)';
    (container as Record<string, unknown>).WebkitBackdropFilter = 'blur(50px)';
  }

  const titleArea: ViewStyle = {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 10,
    alignItems: 'center',
  }

  const titleText: TextStyle = {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.43,
    color: colors.labels[theme].primary,
    textAlign: 'center',
  }

  const descriptionText: TextStyle = {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.43,
    color: colors.labels[theme].primary,
    textAlign: 'center',
  }

  const buttonsContainer: ViewStyle = {
    gap: 10,
  }

  const actionButton: ViewStyle = {
    height: 48,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.fills[theme].secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  }

  const actionButtonPressed: ViewStyle = {
    backgroundColor: colors.fills[theme].primary,
  }

  const actionText: TextStyle = {
    fontSize: 17,
    fontWeight: '510' as TextStyle['fontWeight'],
    lineHeight: 22,
    letterSpacing: -0.43,
    color: colors.labels[theme].primary,
    textAlign: 'center',
  }

  const destructiveText: TextStyle = {
    ...actionText,
    color: colors.accents[theme].red,
  }

  const disabledText: TextStyle = {
    ...actionText,
    color: colors.labels[theme].tertiary,
  }

  const cancelButton: ViewStyle = {
    ...actionButton,
    backgroundColor: colors.fills[theme].secondary,
    marginTop: 4,
  }

  const cancelText: TextStyle = {
    ...actionText,
    fontWeight: '600',
    color: colors.accents[theme].blue,
  }

  return {
    overlay,
    container,
    titleArea,
    titleText,
    descriptionText,
    buttonsContainer,
    actionButton,
    actionButtonPressed,
    actionText,
    destructiveText,
    disabledText,
    cancelButton,
    cancelText,
  }
}
