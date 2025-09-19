import {
  Avatar,
  Button,
  Paragraph,
  Separator,
  SizableText,
  Theme,
  XStack,
  YStack,
  getTokens,
  useMedia,
  useTheme,
} from '@my/ui'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import {
  BarChart3,
  Bell,
  CircleUser,
  FileText,
  Info,
  Layers,
  LifeBuoy,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from '@tamagui/lucide-icons'
import { GestureResponderEvent } from 'react-native'
import { useLink } from 'solito/link'

import { usePathname } from 'app/utils/usePathname'
import { useSafeAreaInsets } from 'app/utils/useSafeAreaInsets'
import { useUser } from 'app/utils/useUser'
import { SolitoImage } from 'solito/image'

type DrawerItemConfig = {
  key: string
  title: string
  href: string
  icon: (props: { size?: number; color?: string }) => JSX.Element
  description?: string
  badge?: string
  theme?: string
  disabled?: boolean
}

type DrawerSectionConfig = {
  key: string
  title: string
  items: DrawerItemConfig[]
}

const drawerSections: DrawerSectionConfig[] = [
  {
    key: 'dashboards',
    title: 'Dashboards',
    items: [
      {
        key: 'daily-overview',
        title: 'Daily Overview',
        description: 'Today’s performance snapshot',
        href: '/',
        icon: BarChart3,
        theme: 'purple',
      },
      {
        key: 'revenue',
        title: 'Store Configurator',
        description: 'Manage your storefront basics',
        href: '/create',
        icon: Layers,
        theme: 'blue',
      },
      {
        key: 'retention',
        title: 'Account Settings',
        description: 'Profiles, billing & preferences',
        href: '/settings',
        icon: Settings2,
        theme: 'gray',
      },
    ],
  },
  {
    key: 'insights',
    title: 'Insights',
    items: [
      {
        key: 'marketing',
        title: 'Marketing',
        description: 'Campaign health & lift',
        href: '/about',
        icon: Sparkles,
        theme: 'pink',
      },
      {
        key: 'notifications',
        title: 'Notifications',
        description: 'Inbox & workflow alerts',
        href: '/notifications',
        icon: Bell,
        theme: 'yellow',
        disabled: true,
      },
    ],
  },
  {
    key: 'support',
    title: 'Support',
    items: [
      {
        key: 'help-center',
        title: 'Help Center',
        description: 'Guides & onboarding docs',
        href: '/terms-of-service',
        icon: LifeBuoy,
        theme: 'green',
      },
      {
        key: 'privacy',
        title: 'Privacy Policy',
        description: 'Data protections & compliance',
        href: '/privacy-policy',
        icon: ShieldCheck,
        theme: 'blue',
      },
      {
        key: 'terms',
        title: 'Terms of Service',
        description: 'Usage & partnership terms',
        href: '/terms-of-service',
        icon: FileText,
        theme: 'orange',
      },
    ],
  },
]

const quickLinks: DrawerItemConfig[] = [
  {
    key: 'store-config',
    title: 'Store Configurator',
    href: '/create',
    icon: ShoppingBag,
    theme: 'purple',
  },
  {
    key: 'account',
    title: 'Account Settings',
    href: '/settings',
    icon: Settings2,
    theme: 'gray',
  },
  {
    key: 'about',
    title: 'About SCF Neue',
    href: '/about',
    icon: Info,
    theme: 'blue',
  },
]

const normalizePath = (value: string) => {
  if (!value) return '/'
  const withoutQuery = value.split('?')[0]
  const cleaned = withoutQuery.replace(/\/\((drawer|tabs)\)/g, '')
  const normalized = cleaned.replace(/\/+/g, '/')
  if (normalized === '' || normalized === '/') return '/'
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

type DrawerNavItemProps = {
  item: DrawerItemConfig
  isActive: boolean
  onNavigate: (event: GestureResponderEvent) => void
  collapsed: boolean
}

const DrawerNavItem = ({ item, isActive, onNavigate, collapsed }: DrawerNavItemProps) => {
  const Icon = item.icon

  return (
    <Theme name={item.theme ?? 'surface2'}>
      <XStack
        accessibilityRole="button"
        alignItems="center"
        gap="$3"
        px="$4"
        py="$3"
        borderRadius="$9"
        pressStyle={{ scale: 0.97 }}
        hoverStyle={{ backgroundColor: '$color3' }}
        backgroundColor={isActive ? '$color4' : 'transparent'}
        opacity={item.disabled ? 0.5 : 1}
        onPress={item.disabled ? undefined : onNavigate}
      >
        <XStack
          alignItems="center"
          justifyContent="center"
          width="$3.5"
          height="$3.5"
          borderRadius="$6"
          backgroundColor={isActive ? '$color5' : '$color3'}
        >
          <Icon size={20} color={isActive ? '$color11' : '$color10'} />
        </XStack>
        {!collapsed && (
          <YStack f={1} gap="$1">
            <SizableText size="$4" fontWeight="600" color={isActive ? '$color12' : '$color11'}>
              {item.title}
            </SizableText>
            {item.description ? (
              <Paragraph size="$2" color="$color10">
                {item.description}
              </Paragraph>
            ) : null}
          </YStack>
        )}
      </XStack>
    </Theme>
  )
}

type DrawerNavItemWrapperProps = {
  item: DrawerItemConfig
  pathname: string
  navigation: DrawerContentComponentProps['navigation']
  collapsed: boolean
}

const DrawerNavItemWrapper = ({ item, pathname, navigation, collapsed }: DrawerNavItemWrapperProps) => {
  const link = useLink({ href: item.href })
  const isActive = item.href === '/'
    ? pathname === '/' || pathname === '/index'
    : pathname === item.href || pathname.startsWith(`${item.href}/`)

  const handlePress = (event: GestureResponderEvent) => {
    if (item.disabled) return
    link.onPress?.(event)
    navigation.closeDrawer()
  }

  return (
    <DrawerNavItem
      item={item}
      isActive={isActive}
      onNavigate={handlePress}
      collapsed={collapsed}
    />
  )
}

const ProfileManageButton = ({
  navigation,
}: {
  navigation: DrawerContentComponentProps['navigation']
}) => {
  const link = useLink({ href: '/profile' })

  return (
    <Button
      size="$2"
      px="$3"
      theme="surface1"
      onPress={(event) => {
        link.onPress?.(event)
        navigation.closeDrawer()
      }}
    >
      Manage
    </Button>
  )
}

export const DrawerMenu = (props: DrawerContentComponentProps) => {
  const { navigation } = props
  const { top, bottom } = useSafeAreaInsets()
  const { profile, avatarUrl, user, updateProfile } = useUser()
  const theme = useTheme()
  const pathname = normalizePath(usePathname())
  const tokens = getTokens()
  const media = useMedia()
  const collapsed = media.sm && !media.gtSm
  const verticalPadding = tokens.space['$5'].val

  return (
    <DrawerContentScrollView
      {...props}
      bounces={false}
      style={{ backgroundColor: theme.color1.val }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: top + verticalPadding,
        paddingBottom: bottom + verticalPadding,
      }}
    >
      <YStack f={1} gap="$5" px="$4">
        <Theme name="surface2">
          <YStack
            backgroundColor="$color3"
            borderRadius="$10"
            px="$4"
            py="$4"
            gap="$4"
          >
            <XStack alignItems="center" gap="$3">
              <XStack
                width="$4.5"
                height="$4.5"
                borderRadius="$9"
                backgroundColor="$color5"
                alignItems="center"
                justifyContent="center"
              >
                <CircleUser size={24} color="$color12" />
              </XStack>
              {!collapsed && (
                <YStack f={1} gap="$1">
                  <SizableText size="$5" fontWeight="700" color="$color12">
                    {profile?.name ?? 'Store Name'}
                  </SizableText>
                  <Paragraph size="$2" color="$color10">
                    Synced moments ago
                  </Paragraph>
                </YStack>
              )}
              {!collapsed && (
                <Button
                  themeInverse
                  size="$2"
                  px="$3"
                  onPress={updateProfile}
                >
                  Refresh
                </Button>
              )}
            </XStack>
            {!collapsed && (
              <XStack gap="$2" ai="center">
                <Sparkles size={16} color="$color10" />
                <Paragraph size="$2" color="$color10">
                  Updated moments ago
                </Paragraph>
              </XStack>
            )}
          </YStack>
        </Theme>

        <YStack gap="$5">
          {drawerSections.map((section) => (
            <YStack key={section.key} gap="$3">
              {!collapsed && (
                <SizableText size="$2" fontWeight="600" color="$color10" textTransform="uppercase">
                  {section.title}
                </SizableText>
              )}
              <YStack gap="$2">
                {section.items.map((item) => (
                  <DrawerNavItemWrapper
                    key={item.key}
                    item={item}
                    pathname={pathname}
                    navigation={navigation}
                    collapsed={collapsed}
                  />
                ))}
              </YStack>
            </YStack>
          ))}
        </YStack>

        <YStack gap="$4">
          {!collapsed && <Separator borderColor="$color4" />}
          <YStack gap="$2">
            {quickLinks.map((item) => (
              <DrawerNavItemWrapper
                key={item.key}
                item={item}
                pathname={pathname}
                navigation={navigation}
                collapsed={collapsed}
              />
            ))}
          </YStack>
          <Theme name="surface2">
            <XStack
              backgroundColor="$color3"
              borderRadius="$10"
              px="$4"
              py="$4"
              gap="$3"
              alignItems="center"
            >
              <Avatar circular size="$3">
                <SolitoImage
                  src={avatarUrl}
                  alt="Profile avatar"
                  width={getTokens().size['3'].val}
                  height={getTokens().size['3'].val}
                />
              </Avatar>
              {!collapsed && (
                <YStack f={1} gap="$1">
                  <SizableText size="$4" fontWeight="600">
                    {profile?.name ?? 'No Name'}
                  </SizableText>
                  <Paragraph size="$2" color="$color10">
                    {profile?.email ?? user?.email ?? 'View profile'}
                  </Paragraph>
                </YStack>
              )}
              {!collapsed && <ProfileManageButton navigation={navigation} />}
            </XStack>
          </Theme>
        </YStack>
      </YStack>
    </DrawerContentScrollView>
  )
}

export default DrawerMenu
