/**
 * Modal component style functions
 */

import type { ViewStyle, DimensionValue } from 'react-native'
import { Platform, StyleSheet } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { borderRadius, borderWidth } from '../../tokens/borders'
import { shadows, boxShadows } from '../../tokens/shadows'

export interface ModalStyleConfig {
  overlay: ViewStyle
  backdrop: ViewStyle
  container: ViewStyle
}

export function getModalStyles(
  theme: ThemeMode = 'light',
  width: number | string = 520
): ModalStyleConfig {
  // Modal uses shadow-m (medium shadow)
  const modalShadow = shadows.m

  return {
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      // Use semi-transparent backdrop for the overlay - increased from 0.5 to 0.7 for better visibility
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    container: {
      width: width as DimensionValue,
      backgroundColor: colors.bg[theme].default,
      borderRadius: borderRadius.xl, // 16px
      borderWidth: borderWidth.none,
      // Use modal shadow (shadow-m) - elevation.modal maps to shadows.m
      ...(Platform.OS === 'web'
        ? {
            boxShadow: boxShadows.m,
          }
        : {
            shadowColor: modalShadow.shadowColor,
            shadowOffset: modalShadow.shadowOffset,
            shadowOpacity: modalShadow.shadowOpacity,
            shadowRadius: modalShadow.shadowRadius,
            elevation: modalShadow.elevation,
          }),
    },
  }
}
