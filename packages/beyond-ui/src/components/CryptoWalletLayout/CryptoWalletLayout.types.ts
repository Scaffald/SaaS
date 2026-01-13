/**
 * CryptoWalletLayout component types
 */

import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'

export type CryptoWalletLayoutVariant = 'default' | 'dashboard' | 'trade'

export interface CryptoWalletLayoutProps {
  /**
   * Sidebar content (navigation menu)
   */
  sidebarContent?: ReactNode

  /**
   * Main content area
   */
  children: ReactNode

  /**
   * Layout variant
   * @default 'default'
   */
  variant?: CryptoWalletLayoutVariant

  /**
   * Whether sidebar is visible
   * @default true
   */
  showSidebar?: boolean

  /**
   * Custom styles
   */
  style?: ViewStyle

  /**
   * Custom sidebar styles
   */
  sidebarStyle?: ViewStyle

  /**
   * Custom content area styles
   */
  contentStyle?: ViewStyle
}
