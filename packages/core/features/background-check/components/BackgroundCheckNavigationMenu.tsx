import { ROUTES } from '@app/core/constants/routes'
import { DashboardWidget, Text, XStack, YStack } from '@app/ui'
import { ArrowRight } from '@tamagui/lucide-icons'
import { Link, usePathname } from 'expo-router'

type BackgroundCheckNavItem = {
  key: string
  title: string
  description: string
  path: string
}

const BACKGROUND_CHECK_NAV_ITEMS: BackgroundCheckNavItem[] = [
  {
    key: 'overview',
    title: 'Overview',
    description: 'Monitor organization requests, statuses, and results.',
    path: ROUTES.OFFICE_ATS_CHECKS.path,
  },
  {
    key: 'admin',
    title: 'Admin Review',
    description: 'Review escalated checks and manage compliance workflows.',
    path: ROUTES.OFFICE_ATS_CHECKS_ADMIN.path,
  },
  {
    key: 'request',
    title: 'Request Check',
    description: 'Launch a new background check for an organization member.',
    path: ROUTES.OFFICE_ATS_CHECKS_REQUEST.path,
  },
]

export function BackgroundCheckNavigationMenu() {
  const pathname = usePathname()

  return (
    <DashboardWidget gap="$4">
      <YStack gap="$1">
        <Text fontSize="$5" fontWeight="700" color="$color12">
          Background Check Tools
        </Text>
        <Text fontSize="$3" color="$color10">
          Switch between related workflows and management tools.
        </Text>
      </YStack>

      <YStack gap="$2">
        {BACKGROUND_CHECK_NAV_ITEMS.map((item) => {
          const normalizedPath = pathname?.replace(/\/$/, '') ?? ''
          const itemPath = item.path.replace(/\/$/, '')
          const isOverview = item.key === 'overview'
          const isActive = isOverview
            ? normalizedPath === itemPath
            : normalizedPath === itemPath || normalizedPath.startsWith(`${itemPath}/`)

          return (
            <Link key={item.key} href={item.path} asChild>
              <YStack
                px="$4"
                py="$3"
                gap="$2"
                rounded="$4"
                borderWidth={1}
                borderColor={isActive ? '$blue7' : '$color6'}
                bg={isActive ? '$blue4' : '$color2'}
                hoverStyle={{
                  bg: isActive ? '$blue5' : '$color3',
                }}
                pressStyle={{
                  bg: isActive ? '$blue6' : '$color4',
                }}
                cursor="pointer"
                animation="quick"
              >
                <YStack gap="$1">
                  <Text fontSize="$4" fontWeight="600" color={isActive ? '$blue12' : '$color12'}>
                    {item.title}
                  </Text>
                  <Text fontSize="$3" color={isActive ? '$blue11' : '$color10'}>
                    {item.description}
                  </Text>
                </YStack>

                <XStack gap="$2" items="center">
                  <Text fontSize="$3" fontWeight="600" color={isActive ? '$blue12' : '$color11'}>
                    View workspace
                  </Text>
                  <ArrowRight size={16} color={isActive ? '$blue11' : '$color10'} />
                </XStack>
              </YStack>
            </Link>
          )
        })}
      </YStack>
    </DashboardWidget>
  )
}
