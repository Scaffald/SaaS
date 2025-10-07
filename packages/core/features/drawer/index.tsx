import { GetThemeValueForKey, YStack, getTokens } from 'tamagui'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { useCallback, useState } from 'react'
import { GestureResponderEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Platform } from 'react-native'

import { usePathname } from '@app/core/utils/usePathname'
import { DrawerContent } from './DrawerContent'
import { normalizePath } from './utils'

// Re-export types and functions for backward compatibility
export type { DrawerItemConfig, DrawerSectionConfig, DrawerContentProps } from './types'
export { drawerSections } from './config'
export { normalizePath } from './utils'
export { DrawerFooter } from './DrawerFooter'
export { DrawerLayout } from './DrawerLayout'

export type UnifiedDrawerProps = {
  /**
   * Navigation props from React Navigation (mobile only)
   */
  navigation?: DrawerContentComponentProps['navigation']
  /**
   * Callback when navigation occurs (for closing drawer on web)
   */
  onNavigate?: () => void
  /**
   * Whether to show safe area insets (mobile only)
   */
  showSafeArea?: boolean
  /**
   * Custom styling props
   */
  showBoxShadow?: boolean
  backgroundColor?: GetThemeValueForKey<'backgroundColor'>
}

export const UnifiedDrawer = ({
  navigation,
  onNavigate,
  showSafeArea = Platform.OS !== 'web',
  showBoxShadow = true,
  backgroundColor = '$color2' as GetThemeValueForKey<'backgroundColor'>,
}: UnifiedDrawerProps) => {
  const { top, bottom } = useSafeAreaInsets()
  const pathname = normalizePath(usePathname())

  // State for managing expanded items
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = useCallback((key: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }, [])

  const handleNavigate = useCallback(
    (_href: string, _event?: GestureResponderEvent) => {
      // Close drawer on mobile, call onNavigate callback on web
      if (navigation) {
        navigation.closeDrawer()
      } else {
        onNavigate?.()
      }
    },
    [navigation, onNavigate]
  )

  // Create mock drawer props for web compatibility
  const drawerProps = navigation
    ? {
        navigation,
        state: {} as DrawerContentComponentProps['state'],
        descriptors: {} as DrawerContentComponentProps['descriptors'],
      }
    : undefined

  return (
    <YStack
      flex={1}
      bg={backgroundColor}
      pt={showSafeArea ? top : 0}
      pb={showSafeArea ? bottom : 0}
      boxShadow={showBoxShadow ? '0 0 30px 0 rgba(0, 0, 0, 0.15)' : undefined}
    >
      <DrawerContent
        pathname={pathname}
        onNavigate={handleNavigate}
        expandedItems={expandedItems}
        onToggleExpanded={toggleExpanded}
        drawerProps={drawerProps}
      />
    </YStack>
  )
}

// Legacy mobile drawer component for backward compatibility
export const DrawerMenu = (props: DrawerContentComponentProps) => {
  return <UnifiedDrawer navigation={props.navigation} />
}

// Static drawer for web (now using unified implementation)
export const StaticDrawer = ({ onNavigate }: { onNavigate?: () => void } = {}) => {
  return <UnifiedDrawer onNavigate={onNavigate} showSafeArea={false} showBoxShadow={false} />
}

export default DrawerMenu
