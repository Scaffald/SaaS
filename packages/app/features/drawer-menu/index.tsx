import {
  Avatar,
  Button,
  Paragraph,
  Separator,
  SizableText,
  XStack,
  YStack,
  getTokens,
} from '@my/ui'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { BarChart3, CircleUser, Map, Settings2, Sparkles } from '@tamagui/lucide-icons'
import { useCallback } from 'react'
import { GestureResponderEvent } from 'react-native'
import { useLink } from 'solito/link'

import { usePathname } from 'app/utils/usePathname'
import { useSafeAreaInsets } from 'app/utils/useSafeAreaInsets'
import { useUser } from 'app/utils/useUser'
import { SolitoImage } from 'solito/image'

export type DrawerItemConfig = {
  key: string
  title: string
  href: string
  icon: (props: { size?: number; color?: string }) => JSX.Element
  description?: string
  badge?: string
  theme?: string
  disabled?: boolean
  subItems?: DrawerItemConfig[]
}

export type DrawerSectionConfig = {
  key: string
  title: string
  items: DrawerItemConfig[]
}

export const drawerSections: DrawerSectionConfig[] = [
  {
    key: 'main',
    title: 'Main',
    items: [
      {
        key: 'dashboard',
        title: 'Dashboard',
        description: 'Overview of crews and active projects.',
        href: '/',
        icon: BarChart3,
        theme: 'purple',
      },
      {
        key: 'discover',
        title: 'Discover',
        description: 'Match with new talent and opportunities.',
        href: '/discover',
        icon: Map,
        theme: 'purple',
      },
    ],
  },
]

export const quickLinks: DrawerItemConfig[] = [
  {
    key: 'account',
    title: 'Account Settings',
    href: '/settings',
    icon: Settings2,
    theme: 'gray',
  },
  {
    key: 'profile',
    title: 'Your Profile',
    href: '/profile',
    icon: CircleUser,
    theme: 'purple',
  },
]

export const normalizePath = (value: string) => {
  if (!value) return '/'
  const withoutQuery = value.split('?')[0]
  const cleaned = withoutQuery.replace(/\/(\(drawer|tabs\))/g, '')
  const normalized = cleaned.replace(/\/+/g, '/')
  if (normalized === '' || normalized === '/') return '/'
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

const isActivePath = (pathname: string, href: string) => {
  if (href === '/') {
    return pathname === '/' || pathname === '/index'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

type DrawerLinkProps = {
  item: DrawerItemConfig
  pathname: string
  collapsed?: boolean
  onNavigate?: (href: string, event: GestureResponderEvent) => void
}

const DrawerLink = ({ item, pathname, collapsed = false, onNavigate }: DrawerLinkProps) => {
  const link = useLink({ href: item.href })
  const active = isActivePath(pathname, item.href)
  const Icon = item.icon

  const handlePress = (event: GestureResponderEvent) => {
    if (item.disabled) return
    link.onPress?.(event)
    onNavigate?.(item.href, event)
  }

  return (
    <Button
      {...link}
      accessibilityRole="button"
      justifyContent="flex-start"
      width="100%"
      size="$3"
      borderRadius="$3"
      backgroundColor={active ? '$purple3' : 'transparent'}
      color={active ? '$purple12' : '$gray11'}
      icon={<Icon size={20} color={active ? '$purple11' : '$gray10'} />}
      iconAfter={null}
      disabled={item.disabled}
      onPress={handlePress}
      theme={active ? 'purple' : undefined}
    >
      {!collapsed && (
        <YStack alignItems="flex-start" gap="$1">
          <SizableText size="$4" fontWeight="600">
            {item.title}
          </SizableText>
          {item.description ? (
            <Paragraph size="$2" color="$gray10">
              {item.description}
            </Paragraph>
          ) : null}
        </YStack>
      )}
    </Button>
  )
}

type DrawerSectionProps = {
  section: DrawerSectionConfig
  pathname: string
  collapsed?: boolean
  onNavigate?: (href: string, event: GestureResponderEvent) => void
}

const DrawerSection = ({ section, pathname, collapsed, onNavigate }: DrawerSectionProps) => {
  return (
    <YStack gap="$2">
      {!collapsed && (
        <SizableText size="$2" fontWeight="600" color="$gray10" textTransform="uppercase">
          {section.title}
        </SizableText>
      )}
      <YStack gap="$1">
        {section.items.map((item) => (
          <YStack key={item.key} gap="$1">
            <DrawerLink item={item} pathname={pathname} collapsed={collapsed} onNavigate={onNavigate} />
            {item.subItems?.map((sub) => (
              <DrawerLink
                key={sub.key}
                item={sub}
                pathname={pathname}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </YStack>
        ))}
      </YStack>
    </YStack>
  )
}

type DrawerContentProps = {
  pathname: string
  collapsed?: boolean
  onNavigate?: (href: string, event: GestureResponderEvent) => void
}

export const DrawerContent = ({ pathname, collapsed = false, onNavigate }: DrawerContentProps) => {
  const { profile, avatarUrl, user, updateProfile } = useUser()
  const manageLink = useLink({ href: '/profile' })

  const handleManagePress = (event: GestureResponderEvent) => {
    manageLink.onPress?.(event)
    onNavigate?.('/profile', event)
  }

  return (
    <YStack
      width="100%"
      maxWidth={320}
      backgroundColor="$color1"
      borderRightWidth={1}
      borderColor="$color4"
      px="$4"
      py="$4"
      gap="$5"
    >
      <YStack backgroundColor="$gray2" borderRadius="$4" px="$4" py="$4" gap="$4">
        <XStack alignItems="center" gap="$3">
          <XStack
            width="$4.5"
            height="$4.5"
            borderRadius="$3"
            backgroundColor="$purple3"
            alignItems="center"
            justifyContent="center"
          >
            <CircleUser size={24} color="$purple11" />
          </XStack>
          {!collapsed && (
            <YStack f={1} gap="$1">
              <SizableText size="$5" fontWeight="700" color="$gray12">
                {profile?.name ?? 'Store Name'}
              </SizableText>
              <Paragraph size="$2" color="$gray10">
                Synced moments ago
              </Paragraph>
            </YStack>
          )}
          {!collapsed && (
            <Button theme="purple" size="$2" px="$3" onPress={updateProfile}>
              Refresh
            </Button>
          )}
        </XStack>
        {!collapsed && (
          <XStack gap="$2" ai="center">
            <Sparkles size={16} color="$gray10" />
            <Paragraph size="$2" color="$gray10">
              Updated moments ago
            </Paragraph>
          </XStack>
        )}
      </YStack>

      <YStack gap="$5">
        {drawerSections.map((section) => (
          <DrawerSection
            key={section.key}
            section={section}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </YStack>

      <YStack gap="$4">
        {!collapsed && <Separator borderColor="$color4" />}
        <YStack gap="$2">
          {quickLinks.map((item) => (
            <DrawerLink
              key={item.key}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </YStack>
        <XStack
          backgroundColor="$gray2"
          borderRadius="$4"
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
              <SizableText size="$4" fontWeight="600" color="$gray12">
                {profile?.name ?? 'No Name'}
              </SizableText>
              <Paragraph size="$2" color="$gray10">
                {user?.email ?? 'View profile'}
              </Paragraph>
            </YStack>
          )}
          {!collapsed && (
            <Button size="$2" px="$3" onPress={handleManagePress}>
              Manage
            </Button>
          )}
        </XStack>
      </YStack>
    </YStack>
  )
}

export const DrawerMenu = (props: DrawerContentComponentProps) => {
  const { navigation } = props
  const { top, bottom } = useSafeAreaInsets()
  const tokens = getTokens()
  const pathname = normalizePath(usePathname())
  const collapsed = false
  const verticalPadding = tokens.space['$5'].val

  const handleNavigate = useCallback(
    (_href: string, _event?: GestureResponderEvent) => {
      navigation.closeDrawer()
    },
    [navigation],
  )

  return (
    <DrawerContentScrollView
      {...props}
      bounces={false}
      style={{ backgroundColor: 'white' }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: top + verticalPadding,
        paddingBottom: bottom + verticalPadding,
        alignItems: 'center',
      }}
    >
      <DrawerContent pathname={pathname} collapsed={collapsed} onNavigate={handleNavigate} />
    </DrawerContentScrollView>
  )
}

export default DrawerMenu
