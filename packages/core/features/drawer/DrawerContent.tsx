import { useAssessmentStatus } from '@app/core/features/assessments/hooks/useAssessmentStatus'
import { usePathname } from '@app/core/utils/usePathname'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { useCallback, useState } from 'react'
import type { GestureResponderEvent } from 'react-native'
import { YStack } from 'tamagui'
import { getDrawerItems } from './config'
import { DrawerLink } from './DrawerLink'
import { normalizePath } from './utils'

export type DrawerContentProps = DrawerContentComponentProps & {
  /**
   * Callback when navigation occurs (for closing drawer on web)
   */
  onNavigate?: () => void
}

/**
 * DrawerContent component renders the main content area of the drawer
 * Handles state management, navigation logic, and renders the UI
 * Works for both mobile (React Navigation) and web use cases
 */
export const DrawerContent = ({ navigation, onNavigate, ...drawerProps }: DrawerContentProps) => {
  const pathname = normalizePath(usePathname())
  const assessmentStatus = useAssessmentStatus()

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

  const drawerItems = getDrawerItems({
    assessmentStatus,
  })

  return (
    <DrawerContentScrollView {...drawerProps} showsVerticalScrollIndicator={false}>
      <YStack gap="$1" flex={1}>
        {drawerItems.map((item) => (
          <DrawerLink
            key={item.key}
            item={item}
            pathname={pathname}
            onNavigate={handleNavigate}
            expandedItems={expandedItems}
            onToggleExpanded={toggleExpanded}
          />
        ))}
      </YStack>
    </DrawerContentScrollView>
  )
}
