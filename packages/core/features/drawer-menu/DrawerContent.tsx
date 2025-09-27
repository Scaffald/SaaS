import { YStack } from '@app/ui'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { drawerSections } from './config'
import { DrawerHeader } from './DrawerHeader'
import { DrawerSection } from './DrawerSection'
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
    <YStack
      width="100%"
      maxWidth={320}
      backgroundColor="$color2"
      borderRightWidth={1}
      // borderColor="$color4"
      px="$4"
      py="$4"
      flex={1}
      bw={0}
    >
      {/* Top Section - User Profile - Sticky */}
      <DrawerHeader onNavigate={onNavigate} />

      {/* Scrollable Content - Using DrawerContentScrollView for proper gesture handling */}
      <DrawerContentScrollView
        {...drawerProps}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$1" width="100%">
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
    </YStack>
  )
}
