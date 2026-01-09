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
import { View, StyleSheet, ScrollView, Platform } from 'react-native'
import type { SidebarProps, SidebarContextValue } from './Sidebar.types'
import { useThemeContext } from '../../playground/ThemeProvider'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderWidth } from '../../tokens/borders'

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

  const width = collapsed ? collapsedWidth : expandedWidth

  // Get background color based on variant and theme
  const getBackgroundColor = (): string => {
    if (isLight) {
      return colors.bg.light.default
    }
    return colors.bg.dark.default
  }

  // Get active color based on variant
  const getActiveColor = (): string => {
    switch (variant) {
      case 'finance':
        return colors.blue[500]
      case 'management':
        return colors.purple[500]
      case 'banking':
        return colors.green[500]
      case 'crypto':
        return colors.orange[500]
      default:
        return colors.primary[500]
    }
  }

  const backgroundColor = getBackgroundColor()

  // Create context value with active color
  const contextValue: SidebarContextValue = {
    collapsed,
    variant,
    theme,
    activeColor: getActiveColor(),
  }

  return (
    <SidebarContext.Provider value={contextValue}>
      <View
        style={[
          styles.container,
          {
            width,
            backgroundColor,
            borderRightWidth: borderWidth.thin,
            borderRightColor: isLight ? colors.border.light.default : colors.border.dark.default,
          },
          style,
        ]}
        // @ts-expect-error - web-specific props
        role="navigation"
        aria-label="Main navigation"
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
          // @ts-expect-error - web-specific props
          role="navigation"
        >
          {children}
        </ScrollView>

        {/* Footer */}
        {footer}
      </View>
    </SidebarContext.Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    flexDirection: 'column',
    ...(Platform.OS === 'web' && {
      // Ensure sidebar stays fixed on web
      position: 'fixed',
      top: 0,
      left: 0,
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: spacing[4],
  },
})

