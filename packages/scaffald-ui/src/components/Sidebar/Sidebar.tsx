/**
 * Sidebar component
 * Main sidebar navigation component with collapsed/expanded states
 * Maps to Figma "Sidebar Menu" component
 *
 * @example
 * ```tsx
 * import { Sidebar, SidebarMenuItem, SidebarHeader, SidebarFooter } from '@scaffald/ui'
 *
 * <Sidebar
 *   variant="main"
 *   collapsed={isCollapsed}
 *   onCollapseChange={setIsCollapsed}
 *   showHamburger
 *   mode="auto"
 *   keyboard={{ toggleShortcut: 'ctrl+b' }}
 * >
 *   <SidebarHeader title="Forsured" />
 *   <SidebarMenuItem icon={DashboardIcon} label="Dashboard" state="active" />
 *   <SidebarMenuItem icon={ClientsIcon} label="Clients" />
 *   <SidebarFooter user={{ name: "John Doe", email: "john@example.com" }} />
 * </Sidebar>
 * ```
 */

import { useState, createContext, useContext, useEffect, useCallback } from 'react'
import { View, ScrollView, Platform, Pressable } from 'react-native'
import { Menu as MenuIcon } from 'lucide-react-native'
import type { SidebarProps, SidebarContextValue, SidebarMode } from './Sidebar.types'
import { useThemeContext } from '../../theme'
import { getSidebarStyles } from './Sidebar.styles'
import { useResponsive } from '../../hooks/useResponsive'

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
 * Match keyboard shortcut (simple implementation)
 */
function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const modifiers = parts.slice(0, -1)

  const keyMatch = event.key.toLowerCase() === key
  const ctrlMatch = modifiers.includes('ctrl') ? event.ctrlKey : !event.ctrlKey
  const metaMatch = modifiers.includes('cmd') || modifiers.includes('meta') ? event.metaKey : !event.metaKey
  const shiftMatch = modifiers.includes('shift') ? event.shiftKey : !event.shiftKey
  const altMatch = modifiers.includes('alt') ? event.altKey : !event.altKey

  return keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch
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
  mode: modeProp = 'fixed',
  onOverlayPress,
  showHamburger = false,
  hamburgerPosition = 'header',
  keyboard = { enabled: true, arrowNavigation: true },
  animated = true,
  animationDuration = 200,
}: SidebarProps) {
  const { theme } = useThemeContext()
  const { isMobile } = useResponsive()

  // Support both controlled and uncontrolled mode
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed)
  const isControlled = collapsedProp !== undefined
  const collapsed = isControlled ? collapsedProp : internalCollapsed

  // Determine actual mode (auto = overlay on mobile, fixed on desktop)
  const mode: SidebarMode = modeProp === 'auto' ? (isMobile ? 'overlay' : 'fixed') : modeProp

  // In overlay mode on mobile, default to collapsed
  const effectiveCollapsed = mode === 'overlay' && isMobile ? true : collapsed

  const handleCollapseChange = useCallback((newCollapsed: boolean) => {
    if (!isControlled) {
      setInternalCollapsed(newCollapsed)
    }
    onCollapseChange?.(newCollapsed)
  }, [isControlled, onCollapseChange])

  const toggleCollapsed = useCallback(() => {
    handleCollapseChange(!collapsed)
  }, [collapsed, handleCollapseChange])

  // Keyboard shortcuts
  useEffect(() => {
    if (Platform.OS !== 'web' || !keyboard?.enabled || !keyboard?.toggleShortcut) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (keyboard.toggleShortcut && matchesShortcut(event, keyboard.toggleShortcut)) {
        event.preventDefault()
        toggleCollapsed()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [keyboard, toggleCollapsed])

  // Handle overlay backdrop press
  const handleOverlayBackdropPress = useCallback(() => {
    if (mode === 'overlay') {
      handleCollapseChange(true)
      onOverlayPress?.()
    }
  }, [mode, handleCollapseChange, onOverlayPress])

  // Get styles from factory function
  const styles = getSidebarStyles(
    variant,
    theme,
    effectiveCollapsed,
    expandedWidth,
    collapsedWidth,
    mode,
    animated,
    animationDuration
  )

  // Create context value with active color
  const contextValue: SidebarContextValue = {
    collapsed: effectiveCollapsed,
    variant,
    theme,
    activeColor: styles.activeColor,
  }

  // Hamburger button (outside mode)
  const renderHamburgerButton = () => {
    if (!showHamburger || hamburgerPosition !== 'outside') {
      return null
    }

    return (
      <Pressable
        onPress={toggleCollapsed}
        style={{
          position: 'absolute',
          top: 16,
          left: effectiveCollapsed ? 16 : expandedWidth + 16,
          zIndex: 1001,
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme === 'light' ? '#fff' : '#1f2937',
          borderRadius: 8,
          ...(Platform.OS === 'web' && {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            transition: `left ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            cursor: 'pointer',
          } as any),
        }}
        accessibilityRole="button"
        accessibilityLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <MenuIcon size={20} color={theme === 'light' ? '#374151' : '#d1d5db'} />
      </Pressable>
    )
  }

  return (
    <>
      <SidebarContext.Provider value={contextValue}>
        {/* Overlay backdrop (overlay mode only, when expanded) */}
        {mode === 'overlay' && !effectiveCollapsed && Platform.OS === 'web' && (
          <Pressable
            onPress={handleOverlayBackdropPress}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
              ...(animated && {
                transition: `opacity ${animationDuration}ms ease-in-out`,
              }),
            } as any}
            accessibilityRole="button"
            accessibilityLabel="Close sidebar"
          />
        )}

        <View
          style={[styles.container, style]}
          {...(Platform.OS === 'web' && {
            role: 'navigation',
            'aria-label': 'Main navigation',
            'aria-expanded': !effectiveCollapsed,
          } as any)}
          accessibilityRole="navigation"
          accessibilityLabel="Main navigation sidebar"
        >
          {/* Header with optional hamburger */}
          {header || (showHamburger && hamburgerPosition === 'header') ? (
            <View style={{ position: 'relative' }}>
              {header}
              {showHamburger && hamburgerPosition === 'header' && (
                <Pressable
                  onPress={toggleCollapsed}
                  style={{
                    position: 'absolute',
                    right: 16,
                    top: 16,
                    width: 32,
                    height: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                    ...(Platform.OS === 'web' && {
                      cursor: 'pointer',
                      ':hover': {
                        backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                      },
                    } as any),
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <MenuIcon size={20} color={theme === 'light' ? '#374151' : '#d1d5db'} />
                </Pressable>
              )}
            </View>
          ) : null}

          {/* Scrollable content area */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {children}
          </ScrollView>

          {/* Footer - always at bottom */}
          {footer && (
            <View style={styles.footerContainer}>
              {footer}
            </View>
          )}
        </View>
      </SidebarContext.Provider>

      {/* Hamburger button (outside mode) */}
      {renderHamburgerButton()}
    </>
  )
}
