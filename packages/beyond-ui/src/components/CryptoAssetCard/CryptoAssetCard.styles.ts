/**
 * CryptoAssetCard component styles
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { StyleSheet } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { typographyVariants } from '../../tokens/typography'
import type { ThemeMode } from '../../theme'

export function getContainerStyles(theme: ThemeMode = 'light'): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[16],
    backgroundColor: theme === 'light' ? colors.bg.light.default : colors.bg.dark.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme === 'light' ? colors.border.light.default : colors.border.dark.default,
  }
}

export function getSymbolStyles(theme: ThemeMode = 'light'): TextStyle {
  return {
    ...typographyVariants.paragraphMMedium,
    color: theme === 'light' ? colors.text.light.primary : colors.text.dark.primary,
  }
}

export function getNameStyles(theme: ThemeMode = 'light'): TextStyle {
  return {
    ...typographyVariants.paragraphSRegular,
    color: theme === 'light' ? colors.text.light.secondary : colors.text.dark.secondary,
  }
}

export function getPriceStyles(theme: ThemeMode = 'light'): TextStyle {
  return {
    ...typographyVariants.paragraphMMedium,
    color: theme === 'light' ? colors.text.light.primary : colors.text.dark.primary,
  }
}

export function getChangeStyles(
  changeType: 'positive' | 'negative',
  theme: ThemeMode = 'light'
): TextStyle {
  return {
    ...typographyVariants.paragraphSMedium,
    color:
      changeType === 'positive'
        ? colors.success[500]
        : theme === 'light'
          ? colors.error[500]
          : colors.error[400],
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[16],
    borderRadius: 12,
    borderWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    flexDirection: 'column',
    gap: spacing[4],
    flex: 1,
  },
  rightSection: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: spacing[4],
  },
  balanceSection: {
    flexDirection: 'column',
    gap: spacing[2],
    marginTop: spacing[4],
  },
})

export default styles
