import {
  Avatar,
  Button,
  Card,
  ListItem,
  Paragraph,
  SizableText,
  Theme,
  XStack,
  YGroup,
  YStack,
  getTokens,
} from '@app/ui'
import type { ThemeName } from '@app/ui'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import { DrawerContentScrollView } from '@react-navigation/drawer'
import { ROUTES } from '@app/core/constants/routes'
import {
  BarChart3,
  ChevronRight,
  CircleUser,
  Building2,
  Map,
  Settings2,
  LogOut,
  Users,
} from '@tamagui/lucide-icons'
import type { JSX } from 'react'
import { useCallback } from 'react'
import { GestureResponderEvent, ScrollView } from 'react-native'
import { useLink } from 'solito/link'

import { usePathname } from '@app/core/utils/usePathname'
import { useSafeAreaInsets } from '@app/core/utils/useSafeAreaInsets'
import { useUser } from '@app/core/utils/useUser'
import { SolitoImage } from 'solito/image'

export type DrawerItemConfig = {
  key: string
  title: string
  href: string
  icon: (props: { size?: number; color?: string }) => JSX.Element
  description?: string
  badge?: string
  theme?: ThemeName
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
    title: '',
    items: [
      {
        key: 'home',
        title: 'Home',
        href: ROUTES.DASHBOARD,
        icon: BarChart3,
        theme: 'blue',
      },
      {
        key: 'discover',
        title: 'Discover',
        href: ROUTES.DISCOVER,
        icon: Map,
        theme: 'green',
      },
      {
        key: 'community',
        title: 'Community',
        href: '/community',
        icon: Users,
        theme: 'pink',
      },
      {
        key: 'profile',
        title: 'Profile',
        href: ROUTES.PROFILE,
        icon: CircleUser,
        theme: 'purple',
      },
    ],
  },
  {
    key: 'organizations',
    title: '',
    items: [
      {
        key: 'organizations',
        title: 'Organizations',
        href: ROUTES.ORGANIZATIONS,
        icon: Building2,
        theme: 'orange',
      },
    ],
  },
  {
    key: 'settings',
    title: '',
    items: [
      {
        key: 'settings',
        title: 'Settings',
        href: ROUTES.SETTINGS,
        icon: Settings2,
        theme: 'gray',
      },
    ],
  },
]

export const normalizePath = (value: string) => {
  if (!value) return '/'
  const withoutQuery = value.split('?')[0]
  const cleaned = withoutQuery.replace(/\/\(tabs\)/g, '')
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
  depth?: number
}

const DrawerLink = ({
  item,
  pathname,
  collapsed = false,
  depth = 0,
  onNavigate,
}: DrawerLinkProps) => {
  const link = useLink({ href: item.href })
  const active = isActivePath(pathname, item.href)
  const Icon = item.icon

  const handlePress = (event: GestureResponderEvent) => {
    if (item.disabled) return
    link.onPress?.(event)
    onNavigate?.(item.href, event)
  }

  if (collapsed) {
    return (
      <Button
        {...link}
        accessibilityRole="button"
        circular
        size="$3"
        icon={<Icon size={18} color="$gray11" />}
        disabled={item.disabled}
        onPress={handlePress}
        theme={active ? item.theme : undefined}
      />
    )
  }

  const themeName = active ? item.theme : undefined

  const content = (
    <ListItem
      {...link}
      hoverTheme
      pressTheme
      active={active}
      disabled={item.disabled}
      onPress={handlePress}
      size="$3"
      px="$3"
      py="$2"
      br="$3"
      bg={active ? '$backgroundFocus' : 'transparent'}
      borderColor="transparent"
      borderWidth={0}
      opacity={item.disabled ? 0.5 : 1}
      title={item.title}
      subTitle={item.description}
      fontWeight={depth > 0 ? '500' : '600'}
      color={active ? '$color12' : '$gray12'}
      paddingLeft={depth > 0 ? '$6' : undefined}
      icon={({ size }) => {
        const iconNode = (
          <XStack ai="center" jc="center" w={28} h={28} br="$3" bg={active ? '$color5' : '$color3'}>
            <Icon size={size ?? 16} color={active ? '$color12' : '$color11'} />
          </XStack>
        )

        if (!themeName && item.theme) {
          return <Theme name={item.theme}>{iconNode}</Theme>
        }

        return iconNode
      }}
      iconAfter={
        item.badge
          ? (() => {
              const badge = (
                <XStack px="$2" py="$1" br="$10" bg="$color3">
                  <Paragraph size="$1" color="$color11">
                    {item.badge}
                  </Paragraph>
                </XStack>
              )

              if (!themeName && item.theme) {
                return <Theme name={item.theme}>{badge}</Theme>
              }

              return badge
            })()
          : null
      }
    />
  )

  if (themeName) {
    return <Theme name={themeName}>{content}</Theme>
  }

  return content
}

type DrawerSectionProps = {
  section: DrawerSectionConfig
  pathname: string
  collapsed?: boolean
  onNavigate?: (href: string, event: GestureResponderEvent) => void
}

const DrawerSection = ({ section, pathname, collapsed, onNavigate }: DrawerSectionProps) => {
  const items = section.items.flatMap((item) => [
    { item, depth: 0 },
    ...(item.subItems?.map((sub) => ({ item: sub, depth: 1 })) ?? []),
  ])

  if (collapsed) {
    return (
      <YStack gap="$2">
        {items.map(({ item, depth }) => (
          <DrawerLink
            key={`${section.key}-${item.key}-${depth}`}
            item={item}
            pathname={pathname}
            collapsed
            depth={depth}
            onNavigate={onNavigate}
          />
        ))}
      </YStack>
    )
  }

  return (
    <YStack gap="$2" width="100%">
      <SizableText size="$2" fontWeight="600" color="$gray10" textTransform="uppercase">
        {section.title}
      </SizableText>
      <YGroup size="$3" borderRadius="$3">
        {items.map(({ item, depth }) => (
          <YGroup.Item key={`${section.key}-${item.key}-${depth}`}>
            <DrawerLink item={item} pathname={pathname} depth={depth} onNavigate={onNavigate} />
          </YGroup.Item>
        ))}
      </YGroup>
    </YStack>
  )
}

type DrawerContentProps = {
  pathname: string
  collapsed?: boolean
  onNavigate?: (href: string, event: GestureResponderEvent) => void
}

export const DrawerContent = ({ pathname, collapsed = false, onNavigate }: DrawerContentProps) => {
  const { profile, avatarUrl } = useUser()
  const tokens = getTokens()
  const manageLink = useLink({ href: ROUTES.PROFILE })
  const avatarSize = tokens.size['3'].val

  const handleManagePress = (event: GestureResponderEvent) => {
    manageLink.onPress?.(event)
    onNavigate?.(ROUTES.PROFILE, event)
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
      flex={1}
    >
      {/* Top Section - User Profile - Sticky */}
      <YStack gap="$4" width="100%" flexShrink={0}>
        <Card
          px="$4"
          py="$3"
          gap="$3"
          borderRadius="$5"
          borderColor="$color4"
          backgroundColor="$color2"
        >
          <ListItem
            hoverTheme
            pressTheme
            size="$4"
            px="$0"
            py="$0"
            bg="transparent"
            onPress={handleManagePress}
            title={!collapsed ? (profile?.name ?? 'Rajeev Ranjan') : undefined}
            subTitle={!collapsed ? 'Partner ID: 304404' : undefined}
            icon={() => (
              <Avatar circular size="$3">
                <SolitoImage
                  src={avatarUrl}
                  alt="Profile avatar"
                  width={avatarSize}
                  height={avatarSize}
                />
              </Avatar>
            )}
            iconAfter={!collapsed ? <ChevronRight size={16} color="$gray10" /> : undefined}
          />
        </Card>
      </YStack>

      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$4" width="100%">
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
      </ScrollView>
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
    [navigation]
  )

  return (
    <YStack
      flex={1}
      backgroundColor="$color1"
      paddingTop={top + verticalPadding}
      paddingBottom={bottom + verticalPadding}
    >
      <DrawerContent pathname={pathname} collapsed={collapsed} onNavigate={handleNavigate} />
    </YStack>
  )
}

export default DrawerMenu
