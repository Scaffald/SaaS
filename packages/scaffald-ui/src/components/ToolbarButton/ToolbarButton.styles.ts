/**
 * ToolbarButton styles
 * iOS 26 toolbar button styling
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'
import type { ResolvedThemeMode } from '../../tokens/colors'

export interface ToolbarButtonStyleConfig {
  /** Icon button touch target */
  iconButton: ViewStyle
  /** Text button container */
  textButton: ViewStyle
  /** Filled button container */
  filledButton: ViewStyle
  /** Back button container */
  backButton: ViewStyle
  /** Text label style */
  textLabel: TextStyle
  /** Filled button label */
  filledLabel: TextStyle
  /** Back button label */
  backLabel: TextStyle
  /** Back chevron text */
  backChevron: TextStyle
  /** Default tint color */
  tintColor: string
  /** Default icon color */
  iconColor: string
}

export function getToolbarButtonStyles(
  theme: ResolvedThemeMode,
): ToolbarButtonStyleConfig {
  const tintColor = colors.accents[theme].blue
  const iconColor = colors.labelsVibrant[theme].primary

  const iconButton: ViewStyle = {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  }

  const textButton: ViewStyle = {
    height: 44,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.pill,
  }

  const filledButton: ViewStyle = {
    height: 30,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: tintColor,
  }

  const backButton: ViewStyle = {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingRight: 8,
  }

  const textLabel: TextStyle = {
    fontSize: 17,
    fontWeight: '400',
    color: tintColor,
  }

  const filledLabel: TextStyle = {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  }

  const backLabel: TextStyle = {
    fontSize: 17,
    fontWeight: '400',
    color: tintColor,
  }

  const backChevron: TextStyle = {
    fontSize: 22,
    fontWeight: '300',
    color: tintColor,
    marginTop: -1,
  }

  return {
    iconButton,
    textButton,
    filledButton,
    backButton,
    textLabel,
    filledLabel,
    backLabel,
    backChevron,
    tintColor,
    iconColor,
  }
}
