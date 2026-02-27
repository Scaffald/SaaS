import type { ViewStyle, TextStyle } from 'react-native'
import { StyleSheet } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import type { ThemeMode } from '../../tokens/colors'
import type { ChipSize } from './Chip.types'

export const staticStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.max, // Fully rounded (pill shape)
    borderWidth: 1,
  },
  focusRing: {
    shadowColor: colors.icon.light['300'],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  text: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontWeight: typography.bodyMedium.fontWeight,
    textAlign: 'center',
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing[2],
    padding: spacing[2],
  },
  closeIconContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeIconLine: {
    position: 'absolute',
    width: 10,
    height: 1.5,
    borderRadius: 0.75,
  },
  closeIconLine1: {
    transform: [{ rotate: '45deg' }],
  },
  closeIconLine2: {
    transform: [{ rotate: '-45deg' }],
  },
})

const sizeConfigs = {
  sm: {
    height: 24,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    iconSize: 16,
    gap: spacing[4],
  },
  md: {
    height: 28,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    iconSize: 18,
    gap: spacing[4],
  },
  lg: {
    height: 32,
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[4],
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    iconSize: 20,
    gap: spacing[4],
  },
}

export function getChipStyles(
  size: ChipSize,
  theme: ThemeMode,
  selected: boolean,
  isHovered: boolean,
  isFocused: boolean,
  disabled: boolean
): ViewStyle[] {
  const sizeConfig = sizeConfigs[size]
  const isLight = theme === 'light'
  const baseStyles: ViewStyle[] = [
    staticStyles.chip,
    {
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      paddingVertical: sizeConfig.paddingVertical,
      gap: sizeConfig.gap,
    },
  ]

  // Background and border based on state
  if (isLight) {
    if (selected) {
      baseStyles.push({
        backgroundColor: colors.gray[900],
        borderColor: colors.gray[900],
        borderWidth: 1,
      })
    } else if (isHovered && !disabled) {
      baseStyles.push({
        backgroundColor: colors.bg.light.subtle,
        borderColor: colors.border.light['200'],
        borderWidth: 1,
      })
    } else {
      baseStyles.push({
        backgroundColor: colors.bg.light.default,
        borderColor: colors.border.light['200'],
        borderWidth: 1,
      })
    }
  } else {
    if (selected) {
      baseStyles.push({
        backgroundColor: colors.gray[100],
        borderColor: colors.gray[100],
        borderWidth: 1,
      })
    } else if (isHovered && !disabled) {
      baseStyles.push({
        backgroundColor: colors.bg.dark.subtle,
        borderColor: colors.border.dark['200'],
        borderWidth: 1,
      })
    } else {
      baseStyles.push({
        backgroundColor: colors.bg.dark.default,
        borderColor: colors.border.dark['200'],
        borderWidth: 1,
      })
    }
  }

  // Focus state
  if (isFocused && !disabled) {
    baseStyles.push(staticStyles.focusRing)
  }

  // Disabled state
  if (disabled) {
    baseStyles.push({
      opacity: 0.4,
    })
  }

  return baseStyles
}

export function getChipTextStyles(
  size: ChipSize,
  theme: ThemeMode,
  selected: boolean,
  disabled: boolean
): TextStyle[] {
  const sizeConfig = sizeConfigs[size]
  const isLight = theme === 'light'
  
  const baseTextStyles: TextStyle[] = [
    staticStyles.text,
    {
      fontSize: sizeConfig.fontSize,
      lineHeight: sizeConfig.lineHeight,
    },
  ]

  if (isLight) {
    baseTextStyles.push({
      color: selected ? colors.text.light.quaternary : colors.text.light.primary,
    })
  } else {
    baseTextStyles.push({
      color: selected ? colors.text.dark.quaternary : colors.text.dark.primary,
    })
  }

  if (disabled) {
    baseTextStyles.push({
      color: isLight ? colors.text.light.disabled : colors.text.dark.disabled,
    })
  }

  return baseTextStyles
}

export function getChipSizeConfig(size: ChipSize) {
  return sizeConfigs[size]
}
