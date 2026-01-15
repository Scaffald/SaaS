/**
 * CryptoWalletLayout component styles
 */

import type { ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../theme'

export function getContainerStyles(theme: ThemeMode = 'light'): ViewStyle {
  return {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    backgroundColor: theme === 'light' ? colors.bg.light.default : colors.bg.dark.default,
  }
}

export function getContentStyles(): ViewStyle {
  return {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  sidebar: {
    height: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },
})

export default styles
