/**
 * Sidebar component
 * Main sidebar navigation component with collapsed/expanded states
 * Maps to Figma "Sidebar Menu" component
 *
 * @example
 * ```tsx
 * import { Sidebar, SidebarMenuItem, SidebarHeader, SidebarFooter } from '@unicornlove/beyond-ui'
 *
 * <Sidebar variant="main" collapsed={isCollapsed} onCollapseChange={setIsCollapsed}>
 *   <SidebarHeader title="Forsured" />
 *   <SidebarMenuItem icon={DashboardIcon} label="Dashboard" state="active" />
 *   <SidebarMenuItem icon={ClientsIcon} label="Clients" />
 *   <SidebarFooter user={{ name: "John Doe", email: "john@example.com" }} />
 * </Sidebar>
 * ```
 */

import { useState, createContext, useContext } from 'react'
import { View, ScrollView, Platform } from 'react-native'
import type { SidebarProps, SidebarContextValue } from './Sidebar.types'
import { useThemeContext } from '../../theme'
import { getSidebarStyles } from './Sidebar.styles'

// Sidebar context
const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebarContext(): SidebarContextValue {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('Sidebar components must be used within a Sidebar')
  }
  return context
}

/**
 * Sidebar component
 * Provides navigation sidebar with collapse/expand functionality
 */
export function Sidebar({
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapseChange,
  variant = 'main',
  header,
  footer,
  children,
  style,
  expandedWidth = 272,
  collapsedWidth = 80,
}: SidebarProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // Support both controlled and uncontrolled mode
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed)
  const isControlled = collapsedProp !== undefined
  const collapsed = isControlled ? collapsedProp : internalCollapsed

  const _handleCollapseChange = (newCollapsed: boolean) => {
    if (!isControlled) {
      setInternalCollapsed(newCollapsed)
    }
    onCollapseChange?.(newCollapsed)
  }

  // Get styles from factory function
  const styles = getSidebarStyles(variant, theme, collapsed, expandedWidth, collapsedWidth)

  // Create context value with active color
  const contextValue: SidebarContextValue = {
    collapsed,
    variant,
    theme,
    activeColor: styles.activeColor,
  }

  return (
    <SidebarContext.Provider value={contextValue}>
      <View
        style={[styles.container, style]}
        {...(Platform.OS === 'web' && {
          role: 'navigation',
          'aria-label': 'Main navigation',
        } as any)}
        accessibilityRole="navigation"
        accessibilityLabel="Main navigation sidebar"
      >
        {/* Header */}
        {header}

        {/* Scrollable content area */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          {...(Platform.OS === 'web' && {
            role: 'navigation',
          } as any)}
        >
          {children}
        </ScrollView>

        {/* Footer - always at bottom */}
        <View style={styles.footerContainer}>
          {footer}
        </View>
      </View>
    </SidebarContext.Provider>
  )
}


