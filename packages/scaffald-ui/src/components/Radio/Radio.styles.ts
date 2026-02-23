import { StyleSheet } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { typography } from '../../tokens/typography'
import type { ThemeMode } from '../../tokens/colors'
import type { RadioColor, RadioSize } from './Radio.types'

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
  radioWrapper: {
    // Wrapper for radio button
  },
  radioCircle: {
    borderWidth: 1.5,
    borderRadius: 9999, // Fully circular
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
    iconSize: 8,
  },
  md: {
    size: 20,
    iconSize: 10,
  },
}

export function getRadioSizeConfig(size: RadioSize) {
  return sizeConfigs[size]
}

export function getRadioColorConfig(
  error: boolean,
  checked: boolean,
  color: RadioColor,
  disabled: boolean,
  theme: ThemeMode
) {
  // Error state overrides color choice
  if (error) {
    return {
      border: colors.border[theme].error,
      background: checked ? colors.error[600] : 'transparent',
      backgroundHover: checked ? colors.error[700] : colors.error[50],
      iconColor: colors.white,
    }
  }

  // Primary color
  if (color === 'primary') {
    return {
      border: disabled
        ? colors.border[theme].disabled
        : checked
          ? colors.primary[600]
          : colors.border[theme].default,
      background: checked
        ? disabled
          ? colors.primary[200]
          : colors.primary[600]
        : 'transparent',
      backgroundHover: checked ? colors.primary[700] : colors.gray[50],
      iconColor: theme === 'dark' ? colors.gray[900] : colors.white,
    }
  }

  // Gray color
  return {
    border: disabled
      ? colors.border[theme].disabled
      : checked
        ? colors.gray[700]
        : colors.border[theme].default,
    background: checked ? (disabled ? colors.gray[200] : colors.gray[700]) : 'transparent',
    backgroundHover: checked ? colors.gray[800] : colors.gray[50],
    iconColor: colors.white,
  }
}
