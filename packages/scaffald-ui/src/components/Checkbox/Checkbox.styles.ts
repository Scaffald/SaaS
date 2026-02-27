import { StyleSheet } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import type { ThemeMode } from '../../tokens/colors'
import type { CheckboxColor, CheckboxSize } from './Checkbox.types'

export const staticStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[8],
  },
  checkboxWrapper: {
    // Wrapper for checkbox with optional top padding for alignment
  },
  checkboxBox: {
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flexDirection: 'column',
    flex: 1,
    gap: spacing[4], // 4px gap between label and helper text
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  label: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  optionalText: {
    fontFamily: typography.body.fontFamily,
    fontWeight: typography.body.fontWeight,
  },
  helperText: {
    fontFamily: typography.body.fontFamily,
    fontWeight: typography.body.fontWeight,
  },
  disabled: {
    opacity: 0.5,
  },
})

const sizeConfigs = {
  sm: {
    size: 16,
    iconSize: 10,
    borderRadius: borderRadius.s - 2, // Slightly smaller radius
  },
  md: {
    size: 20,
    iconSize: 12,
    borderRadius: borderRadius.s,
  },
}

export function getCheckboxSizeConfig(size: CheckboxSize) {
  return sizeConfigs[size]
}

export function getCheckboxColorConfig(
  error: boolean,
  isCheckedOrIndeterminate: boolean,
  color: CheckboxColor,
  disabled: boolean,
  theme: ThemeMode
) {
  // Error state overrides color choice
  if (error) {
    return {
      border: colors.border[theme].error,
      background: isCheckedOrIndeterminate ? colors.error[600] : 'transparent',
      backgroundHover: isCheckedOrIndeterminate ? colors.error[700] : colors.error[50],
      iconColor: colors.white,
    }
  }

  // Primary color
  if (color === 'primary') {
    return {
      border: disabled
        ? colors.border[theme].disabled
        : isCheckedOrIndeterminate
          ? colors.primary[600]
          : colors.border[theme].default,
      background: isCheckedOrIndeterminate
        ? disabled
          ? colors.primary[200]
          : colors.primary[600]
        : 'transparent',
      backgroundHover: isCheckedOrIndeterminate ? colors.primary[700] : colors.gray[50],
      iconColor: colors.white,
    }
  }

  // Gray color
  return {
    border: disabled
      ? colors.border[theme].disabled
      : isCheckedOrIndeterminate
        ? colors.gray[700]
        : colors.border[theme].default,
    background: isCheckedOrIndeterminate
      ? disabled
        ? colors.gray[200]
        : colors.gray[700]
      : 'transparent',
    backgroundHover: isCheckedOrIndeterminate ? colors.gray[800] : colors.gray[50],
    iconColor: colors.white,
  }
}
