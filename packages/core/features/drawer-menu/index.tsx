import { YStack, getTokens } from '@app/ui'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { useCallback, useState } from 'react'
import { GestureResponderEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { usePathname } from '@app/core/utils/usePathname'
import { DrawerContent } from './DrawerContent'
import { normalizePath } from './utils'

// Re-export types and functions for backward compatibility
export type { DrawerItemConfig, DrawerSectionConfig, DrawerContentProps } from './types'
export { drawerSections } from './config'
export { normalizePath } from './utils'

export const DrawerMenu = (props: DrawerContentComponentProps) => {
  const { navigation } = props
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
      navigation.closeDrawer()
    },
    [navigation]
  )

  return (
    <YStack flex={1} bg="$color2" pt={top} pb={bottom} boxShadow="0 0 30px 0 rgba(0, 0, 0, 0.15)">
      <DrawerContent
        pathname={pathname}
        onNavigate={handleNavigate}
        expandedItems={expandedItems}
        onToggleExpanded={toggleExpanded}
        drawerProps={props}
      />
    </YStack>
  )
}

export default DrawerMenu
