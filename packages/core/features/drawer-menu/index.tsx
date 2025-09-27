import { YStack, getTokens } from '@app/ui'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { useCallback, useState } from 'react'
import { GestureResponderEvent } from 'react-native'

import { usePathname } from '@app/core/utils/usePathname'
import { useSafeAreaInsets } from '@app/core/utils/useSafeAreaInsets'
import { DrawerContent } from './DrawerContent'
import { normalizePath } from './utils'

// Re-export types for backward compatibility
export type { DrawerItemConfig, DrawerSectionConfig, DrawerContentProps } from './types'

export const DrawerMenu = (props: DrawerContentComponentProps) => {
  const { navigation } = props
  const { top, bottom } = useSafeAreaInsets()
  const tokens = getTokens()
  const pathname = normalizePath(usePathname())
  const collapsed = false
  const verticalPadding = tokens.space['$5'].val

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
    <YStack
      flex={1}
      backgroundColor="$color2"
      paddingTop={top + verticalPadding}
      paddingBottom={bottom + verticalPadding}
    >
      <DrawerContent
        pathname={pathname}
        collapsed={collapsed}
        onNavigate={handleNavigate}
        expandedItems={expandedItems}
        onToggleExpanded={toggleExpanded}
      />
    </YStack>
  )
}

export default DrawerMenu
