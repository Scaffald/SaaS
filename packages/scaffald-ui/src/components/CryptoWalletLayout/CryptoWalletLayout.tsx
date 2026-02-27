/**
 * CryptoWalletLayout component
 * Wrapper component for consistent crypto wallet page structure
 * Handles sidebar + main content layout
 *
 * @example
 * ```tsx
 * import { CryptoWalletLayout } from '@scaffald/ui'
 * import { Sidebar } from '@scaffald/ui'
 *
 * <CryptoWalletLayout
 *   sidebarContent={<Sidebar>...</Sidebar>}
 *   variant="dashboard"
 * >
 *   <View>Main content</View>
 * </CryptoWalletLayout>
 * ```
 */

import { View, StyleSheet } from 'react-native'
import type { CryptoWalletLayoutProps } from './CryptoWalletLayout.types'
import { getContainerStyles, getContentStyles } from './CryptoWalletLayout.styles'
import { useThemeContext } from '../../theme'

export function CryptoWalletLayout({
  sidebarContent,
  children,
  variant: _variant = 'default',
  showSidebar = true,
  style,
  sidebarStyle,
  contentStyle,
}: CryptoWalletLayoutProps) {
  const { theme } = useThemeContext()
  const containerStyles = getContainerStyles(theme)
  const contentStyles = getContentStyles()

  return (
    <View style={[containerStyles, styles.container, style]}>
      {showSidebar && sidebarContent && (
        <View style={[styles.sidebar, sidebarStyle]}>{sidebarContent}</View>
      )}
      <View style={[contentStyles, styles.content, contentStyle]}>{children}</View>
    </View>
  )
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
