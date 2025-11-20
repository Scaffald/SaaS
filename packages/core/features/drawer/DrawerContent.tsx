import { ScaffaldLogo } from '@app/core/assets'
import { ROUTES } from '@app/core/constants/routes'
import { usePathname } from '@app/core/utils/usePathname'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { Settings as SettingsIcon } from '@tamagui/lucide-icons'
import { useCallback } from 'react'
import type { GestureResponderEvent } from 'react-native'
import { XStack, YStack } from 'tamagui'
import { DrawerLink } from './DrawerLink'
import { getDrawerItems } from './config'
import type { DrawerItemConfig } from './types'
import { normalizePath } from './utils'

export type DrawerContentProps = DrawerContentComponentProps & {
  /**
   * Callback when navigation occurs (for closing drawer on web)
   */
  onNavigate?: () => void
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
export const DrawerContent = ({ navigation, onNavigate }: DrawerContentProps) => {
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
    <YStack flex={1} bg="$color3" px="$4" py="$6">
      <YStack flex={1} justify="space-between" gap="$6">
        <XStack justify="center" items="center" pt="$4" $md={{ pt: '$1' }}>
          <ScaffaldLogo height={40} width={120} />
        </XStack>

        <YStack gap="$3" flex={1} mt="$2">
          {drawerItems.map((item) => (
            <DrawerLink
              key={item.key}
              item={item}
              pathname={pathname}
              onNavigate={handleNavigate}
            />
          ))}
        </YStack>

        <YStack pt="$4" borderTopWidth={1} borderColor="$color5">
          <DrawerLink item={settingsDrawerItem} pathname={pathname} onNavigate={handleNavigate} />
        </YStack>
      </YStack>
    </YStack>
  )
}
