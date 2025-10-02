import { YStack, Text, ScrollView } from 'tamagui'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BarChart3, Building2 } from '@tamagui/lucide-icons'
import { DrawerHeader } from './DrawerHeader'
import { DrawerLink } from './DrawerLink'
import { DrawerFooter } from './DrawerFooter'
import { usePathname } from '@app/core/utils/usePathname'
import { normalizePath } from './utils'

export const OfficeDrawerMenuMobile = (props: DrawerContentComponentProps) => {
  const { top, bottom } = useSafeAreaInsets()
  const pathname = normalizePath(usePathname())

  const handleNavigate = () => {
    props.navigation.closeDrawer()
  }

  return (
    <YStack flex={1} bg="$color2" pt={top} pb={bottom}>
      <YStack flex={1} gap="$4" px="$4" py="$4">
        {/* Header */}
        <DrawerHeader onNavigate={handleNavigate} />

        {/* Navigation Links */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$1">
            <DrawerLink
              item={{
                key: 'worker-dashboard',
                title: 'Worker Dashboard',
                href: '/dashboard',
                icon: BarChart3,
              }}
              pathname={pathname}
              onNavigate={handleNavigate}
              expandedItems={new Set()}
              onToggleExpanded={() => {}}
            />
            <DrawerLink
              item={{
                key: 'office',
                title: 'Office',
                href: '/office',
                icon: Building2,
              }}
              pathname={pathname}
              onNavigate={handleNavigate}
              expandedItems={new Set()}
              onToggleExpanded={() => {}}
            />
          </YStack>
        </ScrollView>

        {/* Footer */}
        <DrawerFooter />
      </YStack>
    </YStack>
  )
}
