import { YStack, Text, ScrollView } from 'tamagui'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BarChart3, Building2, Briefcase } from '@tamagui/lucide-icons'
import { DrawerHeader } from './DrawerHeader'
import { DrawerLink } from './DrawerLink'
import { DrawerFooter } from './DrawerFooter'
import { usePathname } from '@app/core/utils/usePathname'
import { normalizePath } from './utils'
import { DASHBOARD_ROUTES, OFFICE_ROUTES } from '@app/core/constants/routes'

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
            {DASHBOARD_ROUTES.INDEX && (
              <DrawerLink
                item={{
                  key: 'worker-dashboard',
                  title: DASHBOARD_ROUTES.INDEX.title || 'Worker Dashboard',
                  href: DASHBOARD_ROUTES.INDEX.fullPath,
                  icon: BarChart3,
                }}
                pathname={pathname}
                onNavigate={handleNavigate}
                expandedItems={new Set()}
                onToggleExpanded={() => {}}
              />
            )}
            {OFFICE_ROUTES.INDEX && (
              <DrawerLink
                item={{
                  key: 'office',
                  title: OFFICE_ROUTES.INDEX.title || 'Office',
                  href: OFFICE_ROUTES.INDEX.fullPath,
                  icon: Building2,
                }}
                pathname={pathname}
                onNavigate={handleNavigate}
                expandedItems={new Set()}
                onToggleExpanded={() => {}}
              />
            )}
            {OFFICE_ROUTES.JOBS && (
              <DrawerLink
                item={{
                  key: 'manage-jobs',
                  title: OFFICE_ROUTES.JOBS.title || 'Manage Jobs',
                  href: OFFICE_ROUTES.JOBS.fullPath,
                  icon: Briefcase,
                }}
                pathname={pathname}
                onNavigate={handleNavigate}
                expandedItems={new Set()}
                onToggleExpanded={() => {}}
              />
            )}
          </YStack>
        </ScrollView>

        {/* Footer */}
        <DrawerFooter />
      </YStack>
    </YStack>
  )
}
