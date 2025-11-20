import { ScaffaldLogo } from '@app/core/assets'
import { ROUTES } from '@app/core/constants/routes'
import { usePathname } from '@app/core/utils/usePathname'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { ChevronLeft, ChevronRight, Settings as SettingsIcon } from '@tamagui/lucide-icons'
import { useCallback } from 'react'
import type { GestureResponderEvent } from 'react-native'
import { Button, XStack, YStack } from 'tamagui'
import { DrawerLink } from './DrawerLink'
import { getDrawerItems } from './config'
import type { DrawerItemConfig } from './types'
import { normalizePath } from './utils'

export type DrawerContentProps = DrawerContentComponentProps & {
  /**
   * Callback when navigation occurs (for closing drawer on web)
   */
  onNavigate?: () => void
  /**
   * Whether the drawer is collapsed (icon-only)
   */
  isCollapsed?: boolean
  /**
   * Whether collapsing is available (md and larger)
   */
  canCollapse?: boolean
  /**
   * Toggle collapse handler
   */
  onToggleCollapse?: () => void
}

const settingsDrawerItem: DrawerItemConfig = {
  key: 'settings',
  titleKey: 'navigation.settings',
  href: ROUTES.DASHBOARD.SETTINGS.path,
  icon: SettingsIcon,
  hasChevron: true,
}

/**
 * DrawerContent component renders the main content area of the drawer
 * Handles state management, navigation logic, and renders the UI
 * Works for both mobile (React Navigation) and web use cases
 */
export const DrawerContent = ({
  navigation,
  onNavigate,
  isCollapsed = false,
  canCollapse = false,
  onToggleCollapse,
}: DrawerContentProps) => {
  const pathname = normalizePath(usePathname())

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

  const drawerItems = getDrawerItems()

  return (
    <YStack
      flex={1}
      bg="$color3"
      px={isCollapsed ? '$2' : '$4'}
      py="$5"
      items={isCollapsed ? 'center' : 'stretch'}
    >
      <YStack flex={1} justify="space-between" gap="$5" width="100%">
        <XStack justify="center" items="center" gap="$3" pt="$2" width="100%">
          <ScaffaldLogo
            height={isCollapsed ? 30 : 40}
            width={isCollapsed ? 30 : 120}
            showWordmark={!isCollapsed}
          />
        </XStack>

        <YStack gap="$3" flex={1} mt="$2" width="100%" items={isCollapsed ? 'center' : 'stretch'}>
          {drawerItems.map((item) => (
            <DrawerLink
              key={item.key}
              item={item}
              pathname={pathname}
              onNavigate={handleNavigate}
              isCollapsed={isCollapsed}
            />
          ))}
        </YStack>

        <YStack
          pt="$4"
          borderTopWidth={1}
          borderColor="$color5"
          width="100%"
          items={isCollapsed ? 'center' : 'stretch'}
        >
          {isCollapsed ? (
            <YStack gap="$3" items="center">
              <DrawerLink
                item={settingsDrawerItem}
                pathname={pathname}
                onNavigate={handleNavigate}
                isCollapsed={isCollapsed}
              />
              {canCollapse && onToggleCollapse ? (
                <Button
                  size="$3"
                  circular
                  variant="outlined"
                  accessibilityLabel={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
                  icon={isCollapsed ? ChevronRight : ChevronLeft}
                  onPress={onToggleCollapse}
                />
              ) : null}
            </YStack>
          ) : (
            <XStack width="100%" justify="space-between" items="center" gap="$3">
              <DrawerLink
                item={settingsDrawerItem}
                pathname={pathname}
                onNavigate={handleNavigate}
                isCollapsed={isCollapsed}
              />
              {canCollapse && onToggleCollapse ? (
                <Button
                  size="$3"
                  circular
                  variant="outlined"
                  accessibilityLabel="Collapse navigation"
                  icon={isCollapsed ? ChevronRight : ChevronLeft}
                  onPress={onToggleCollapse}
                />
              ) : null}
            </XStack>
          )}
        </YStack>
      </YStack>
    </YStack>
  )
}
