/**
 * Modal component style functions
 */

import type { ViewStyle } from 'react-native'
import { Platform, StyleSheet } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { borderRadius, borderWidth } from '../../tokens/borders'
import { elevation } from '../../tokens/shadows'

export interface ModalStyleConfig {
  overlay: ViewStyle
  backdrop: ViewStyle
  container: ViewStyle
}

export function getModalStyles(
  theme: ThemeMode = 'light',
  width: number | string = 520
): ModalStyleConfig {
  return {
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    container: {
      width: width,
      backgroundColor: colors.bg[theme].default,
      borderRadius: borderRadius.xl, // 16px
      borderWidth: borderWidth.none,
      // Use elevation.modal shadow - for React Native we need to convert
      // For web, we can use boxShadow
      ...(Platform.OS === 'web'
        ? {
            boxShadow: elevation.modal,
          }
        : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 8,
          }),
    },
  }
}
