import { YStack } from '@app/ui'
import { ScrollView } from 'react-native'
import { drawerSections } from './config'
import { DrawerHeader } from './DrawerHeader'
import { DrawerSection } from './DrawerSection'
import type { DrawerContentProps } from './types'

/**
 * DrawerContent component renders the main content area of the drawer
 * Includes the user header and scrollable navigation sections
 */
export const DrawerContent = ({
  pathname,
  collapsed = false,
  onNavigate,
  expandedItems,
  onToggleExpanded,
}: DrawerContentProps) => {
  return (
    <YStack
      width="100%"
      maxWidth={320}
      backgroundColor="$color2"
      borderRightWidth={1}
      borderColor="$color4"
      px="$4"
      py="$4"
      flex={1}
    >
      {/* Top Section - User Profile - Sticky */}
      <DrawerHeader collapsed={collapsed} onNavigate={onNavigate} />

      {/* Scrollable Content */}
      <ScrollView
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
              collapsed={collapsed}
              onNavigate={onNavigate}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  )
}
