/**
 * ModalActions component style functions
 */

import type { ViewStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderWidth } from '../../tokens/borders'
import type { ModalActionsOrientation } from './ModalActions.types'

export interface ModalActionsStyleConfig {
  container: ViewStyle
  subActionsContainer: ViewStyle
  buttonsContainer: ViewStyle
}

export function getModalActionsStyles(
  orientation: ModalActionsOrientation = 'center',
  theme: ThemeMode = 'light'
): ModalActionsStyleConfig {
  const _isLight = theme === 'light'

  // Base container styles
  const baseContainer: ViewStyle = {
    flexDirection: 'column',
    alignItems: orientation === 'center' ? 'center' : 'flex-end',
    paddingHorizontal: spacing[20],
    paddingTop: spacing[28],
    paddingBottom: spacing[20],
    borderTopWidth: borderWidth.thin,
    borderTopColor: colors.border[theme].default,
    backgroundColor: colors.bg[theme].default,
    gap: spacing[12],
  }

  // Sub-actions container (optional checkbox, toggle, message, etc.)
  const subActionsContainer: ViewStyle = {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  }

  // Buttons container
  const buttonsContainer: ViewStyle = {
    width: '100%',
    flexDirection: orientation === 'center' ? 'column' : 'row',
    alignItems: 'stretch',
    justifyContent: orientation === 'center' ? 'center' : 'flex-end',
    gap: spacing[12],
  }

  return {
    container: baseContainer,
    subActionsContainer,
    buttonsContainer,
  }
}
