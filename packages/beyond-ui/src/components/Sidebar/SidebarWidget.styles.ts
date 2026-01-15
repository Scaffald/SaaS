/**
 * SidebarWidget component styles
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'

export interface SidebarWidgetStyleConfig {
  collapsedContainer: ViewStyle
  collapsedProgressIndicator: ViewStyle
  progressHorizontalContainer: ViewStyle
  progressVerticalContainer: ViewStyle
  progressHeader: ViewStyle
  labelButton: ViewStyle
  progressLabel: TextStyle
  valueText: TextStyle
  progressBar: ViewStyle
  messageHorizontalContainer: ViewStyle
  messageVerticalContainer: ViewStyle
  upgradeButton: ViewStyle
  upgradeButtonText: TextStyle
  iconColor: string
}

export function getSidebarWidgetStyles(
  theme: ThemeMode,
  progressValue: number
): SidebarWidgetStyleConfig {
  const isLight = theme === 'light'

  const collapsedContainer: ViewStyle = {
    height: 4,
    marginHorizontal: spacing[12],
    marginVertical: spacing[4],
    backgroundColor: colors.bg.light['200'],
    borderRadius: borderRadius.max,
    overflow: 'hidden',
  }

  const collapsedProgressIndicator: ViewStyle = {
    height: '100%',
    borderRadius: borderRadius.max,
    backgroundColor: progressValue > 75 ? colors.error[500] : colors.primary[500],
  }

  const progressHorizontalContainer: ViewStyle = {
    gap: spacing[6],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  }

  const progressVerticalContainer: ViewStyle = {
    gap: spacing[6],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  }

  const progressHeader: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[8],
  }

  const labelButton: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  }

  const progressLabel: TextStyle = {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.small.lineHeight,
    color: isLight ? colors.text.light.primary : colors.text.dark.primary,
  }

  const valueText: TextStyle = {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.small.lineHeight,
    color: isLight ? colors.text.light.secondary : colors.text.dark.secondary,
  }

  const progressBar: ViewStyle = {
    marginTop: spacing[4],
  }

  const messageHorizontalContainer: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[8],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  }

  const messageVerticalContainer: ViewStyle = {
    gap: spacing[8],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  }

  const upgradeButton: ViewStyle = {
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[6],
    borderRadius: borderRadius.s,
    backgroundColor: colors.primary[500],
  }

  const upgradeButtonText: TextStyle = {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.white,
    lineHeight: typography.small.lineHeight,
  }

  const iconColor = isLight ? colors.icon.light.default : colors.icon.dark.default

  return {
    collapsedContainer,
    collapsedProgressIndicator,
    progressHorizontalContainer,
    progressVerticalContainer,
    progressHeader,
    labelButton,
    progressLabel,
    valueText,
    progressBar,
    messageHorizontalContainer,
    messageVerticalContainer,
    upgradeButton,
    upgradeButtonText,
    iconColor,
  }
}
