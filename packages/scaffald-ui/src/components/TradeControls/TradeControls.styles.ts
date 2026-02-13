/**
 * TradeControls component styles
 */

import type { ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import type { ThemeMode } from '../../theme'

export function getContainerStyles(theme: ThemeMode = 'light'): ViewStyle {
  return {
    flexDirection: 'column',
    gap: spacing[16],
    padding: spacing[24],
    backgroundColor: theme === 'light' ? colors.bg.light.default : colors.bg.dark.default,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme === 'light' ? colors.border.light.default : colors.border.dark.default,
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: spacing[16],
    padding: spacing[24],
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[8],
  },
  inputGroup: {
    flexDirection: 'column',
    gap: spacing[12],
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[8],
    paddingBottom: spacing[8],
  },
  actions: {
    flexDirection: 'column',
    gap: spacing[12],
    marginTop: spacing[8],
  },
})

export default styles
