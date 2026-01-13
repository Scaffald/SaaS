/**
 * ModalHeader component style functions
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius, borderWidth } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import type { ModalHeaderOrientation } from './ModalHeader.types'

export interface ModalHeaderStyleConfig {
  container: ViewStyle
  iconContainer: ViewStyle
  textContainer: ViewStyle
  title: TextStyle
  description: TextStyle
  closeButton: ViewStyle
  closeIconColor: string
}

export function getModalHeaderStyles(
  orientation: ModalHeaderOrientation = 'left',
  theme: ThemeMode = 'light'
): ModalHeaderStyleConfig {
  const _isLight = theme === 'light'

  // Base container styles
  const baseContainer: ViewStyle = {
    flexDirection: 'column',
    alignItems: orientation === 'center' ? 'center' : 'flex-start',
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[20],
    borderBottomWidth: borderWidth.thin,
    borderBottomColor: colors.border[theme].default,
    backgroundColor: colors.bg[theme].default,
    gap: spacing[12],
    position: 'relative',
  }

  // Icon container (48px, rounded-xl, bordered)
  const iconContainer: ViewStyle = {
    width: spacing[48],
    height: spacing[48],
    borderRadius: borderRadius.xl, // 16px
    borderWidth: borderWidth.thin,
    borderColor: colors.border[theme].default,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg[theme].default,
  }

  // Text container
  const textContainer: ViewStyle = {
    flexDirection: 'column',
    alignItems: orientation === 'center' ? 'center' : 'flex-start',
    gap: spacing[4], // 2px gap between title and description
  }

  // Title text (20px medium, line-height 28px)
  const title: TextStyle = {
    fontFamily: typography.subtitleMedium.fontFamily,
    fontSize: typography.subtitleMedium.fontSize,
    fontWeight: typography.subtitleMedium.fontWeight,
    lineHeight: typography.subtitleMedium.lineHeight,
    color: colors.text[theme].primary,
    textAlign: orientation === 'center' ? 'center' : 'left',
  }

  // Description text (14px regular, line-height 20px)
  const description: TextStyle = {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
    color: colors.text[theme].secondary,
    textAlign: orientation === 'center' ? 'center' : 'left',
  }

  // Close button (24px, positioned absolute top-right)
  const closeButton: ViewStyle = {
    position: 'absolute',
    top: spacing[16],
    right: spacing[16],
    width: spacing[24],
    height: spacing[24],
    justifyContent: 'center',
    alignItems: 'center',
  }

  const closeIconColor = colors.icon[theme].default

  return {
    container: baseContainer,
    iconContainer,
    textContainer,
    title,
    description,
    closeButton,
    closeIconColor,
  }
}
