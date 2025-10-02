import { YStack } from 'tamagui'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { drawerSections } from './config'
import { DrawerHeader } from './DrawerHeader'
import { DrawerSection } from './DrawerSection'
import { DrawerFooter } from './DrawerFooter'
import type { DrawerContentProps } from './types'

/**
 * DrawerContent component renders the main content area of the drawer
 * Includes the user header and scrollable navigation sections
 * Uses DrawerContentScrollView for proper gesture handling
 */
export const DrawerContent = ({
  pathname,
  onNavigate,
  expandedItems,
  onToggleExpanded,
  drawerProps,
}: DrawerContentProps) => {
  return (
    <YStack flex={1} gap="$4" px="$4" py="$4">
      {/* Top Section - User Profile - Sticky */}
      <DrawerHeader onNavigate={onNavigate} />

      {/* Scrollable Content - Using DrawerContentScrollView for proper gesture handling */}
      <DrawerContentScrollView {...drawerProps} showsVerticalScrollIndicator={false}>
        <YStack gap="$1" flex={1}>
          {drawerSections.map((section) => (
            <DrawerSection
              key={section.key}
              section={section}
              pathname={pathname}
              onNavigate={onNavigate}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </YStack>
      </DrawerContentScrollView>

      {/* Bottom Section - Fixed Action Buttons */}
      <DrawerFooter />
    </YStack>
  )
}
