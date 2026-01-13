/**
 * Tooltip component styles
 * Style generation functions using design tokens
 */

import type { TooltipStyleConfig, TooltipColor, TooltipType } from './Tooltip.types'
import { colors } from '../../tokens/colors'
import { spacing, padding } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typographyVariants } from '../../tokens/typography'
import type { ViewStyle, TextStyle } from 'react-native'

/**
 * Get tooltip style configuration based on type and color
 */
export function getTooltipStyles(
  type: TooltipType,
  color: TooltipColor
): TooltipStyleConfig {
  const isPrimary = color === 'primary'
  const isRich = type === 'rich'

  // Color tokens
  const backgroundColor = isPrimary ? colors.primary[50] : colors.gray[100]
  const textColor = isPrimary ? colors.primary[900] : colors.gray[900]
  const arrowColor = isPrimary ? colors.primary[50] : colors.gray[100]
  const actionButtonTextColor = isPrimary ? colors.primary[600] : colors.gray[600]

  // Padding based on type
  const horizontalPadding = isRich ? padding[16] : padding[10]
  const verticalPadding = isRich ? padding[12] : padding[8]

  // Container styles
  const container: ViewStyle = {
    position: 'absolute',
    zIndex: 9999,
    elevation: 9999, // Android
    maxWidth: 320, // Max width from design
  }

  // Content container styles
  const content: ViewStyle = {
    backgroundColor,
    borderRadius: borderRadius.s, // 8px
    overflow: 'hidden',
  }

  // Default content styles (single text content)
  const defaultContent: ViewStyle = {
    paddingHorizontal: horizontalPadding,
    paddingVertical: verticalPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  // Rich content styles (title + description + actions)
  const richContent: ViewStyle = {
    paddingHorizontal: horizontalPadding,
    paddingVertical: verticalPadding,
    flexDirection: 'column',
    gap: spacing[8], // 8px gap between sections
    alignItems: 'flex-start',
  }

  // Rich title text style
  const richTitle: TextStyle = {
    fontFamily: typographyVariants.paragraphSMedium.fontFamily,
    fontSize: typographyVariants.paragraphSMedium.fontSize,
    fontWeight: typographyVariants.paragraphSMedium.fontWeight,
    lineHeight: typographyVariants.paragraphSMedium.lineHeight,
    letterSpacing: 0, // Convert string to number for React Native
    color: textColor,
  }

  // Rich description text style
  const richDescription: TextStyle = {
    ...typographyVariants.captionRegular, // 12px, 16px line-height, regular weight
    color: textColor,
  }

  // Actions container style
  const richActions: ViewStyle = {
    flexDirection: 'row',
    gap: spacing[12], // 12px gap between buttons
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: spacing[6], // 6px bottom padding
    paddingHorizontal: 0,
  }

  // Action button style
  const actionButton: ViewStyle = {
    padding: 0,
    minHeight: 0,
    backgroundColor: 'transparent',
    borderRadius: borderRadius.s, // 8px
  }

  // Action button text style
  const actionButtonText: TextStyle = {
    ...typographyVariants.paragraphSMedium, // 14px, 20px line-height, medium weight
    color: actionButtonTextColor,
    textAlign: 'center',
  }

  // Arrow container style (will be positioned by TooltipArrow component)
  const arrow: ViewStyle = {
    width: 13, // Arrow width from design
    height: 6, // Arrow height from design
    backgroundColor: arrowColor,
  }

  return {
    container,
    content,
    defaultContent,
    richContent,
    richTitle,
    richDescription,
    richActions,
    actionButton,
    actionButtonText,
    arrow,
    backgroundColor,
    textColor,
    arrowColor,
  }
}

/**
 * Get text style for default tooltip content
 */
export function getDefaultTooltipTextStyle(color: TooltipColor): TextStyle {
  const textColor = color === 'primary' ? colors.primary[900] : colors.gray[900]

  return {
    ...typographyVariants.captionRegular, // 12px, 16px line-height, regular weight
    color: textColor,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  }
}

