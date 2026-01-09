/**
 * ModalContent component style functions
 */

import type { ViewStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import type { ModalContentVariant } from './ModalContent.types'

export interface ModalContentStyleConfig {
  container: ViewStyle
}

export function getModalContentStyles(
  _variant: ModalContentVariant = 'default',
  theme: ThemeMode = 'light'
): ModalContentStyleConfig {
  // Base container styles
  // Padding: 24px horizontal, 20px vertical (from Figma specs)
  const baseContainer: ViewStyle = {
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[20],
    backgroundColor: colors.bg[theme].default,
  }

  return {
    container: baseContainer,
  }
}
