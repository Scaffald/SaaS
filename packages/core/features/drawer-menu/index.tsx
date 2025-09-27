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
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'
import {
  BarChart3,
  ChevronRight,
  ChevronDown,
  CircleUser,
  Building2,
  Map,
  Settings2,
  LogOut,
  Users,
  Palette,
  Mail,
  Rocket,
  User,
  Fingerprint,
  Star,
  FileText,
  Clock,
  CheckCircle,
  Pause,
  HelpCircle,
  Bell,
} from '@tamagui/lucide-icons'
import type { JSX } from 'react'
import { useCallback, useState } from 'react'
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
  disabled?: boolean
  subItems?: DrawerItemConfig[]
  hasChevron?: boolean
  isExpandable?: boolean
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
        key: 'dashboard',
        title: 'Dashboard',
        href: ROUTES.dashboard.fullPath,
        icon: BarChart3,
      },
      {
        key: 'inboxes',
        title: 'Inboxes',
        href: '/inboxes',
        icon: Mail,
        hasChevron: true,
      },
      {
        key: 'performances',
        title: 'Performances',
        href: '/performances',
        icon: Rocket,
        hasChevron: true,
      },
      {
        key: 'employee-task',
        title: 'Employee Task',
        href: '/employee-task',
        icon: User,
        hasChevron: true,
      },
      {
        key: 'absence',
        title: 'Absence',
        href: '/absence',
        icon: Fingerprint,
        hasChevron: true,
      },
      {
        key: 'analytics',
        title: 'Analytics',
        href: '/analytics',
        icon: Star,
        hasChevron: true,
      },
      {
        key: 'projects',
        title: 'Projects',
        href: '/projects',
        icon: FileText,
        isExpandable: true,
        subItems: [
          {
            key: 'active-project',
            title: 'Active Project',
            href: '/projects/active',
            icon: Clock,
          },
          {
            key: 'project-done',
            title: 'Project Done',
            href: '/projects/done',
            icon: CheckCircle,
          },
          {
            key: 'project-on-hold',
            title: 'Project On Hold',
            href: '/projects/on-hold',
            icon: Pause,
          },
        ],
      },
      {
        key: 'client-list',
        title: 'Client List',
        href: '/client-list',
        icon: Users,
      },
      {
        key: 'help-center',
        title: 'Help Center',
        href: '/help-center',
        icon: HelpCircle,
      },
      {
        key: 'notification',
        title: 'Notification',
        href: '/notifications',
        icon: Bell,
        badge: '4',
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

// Helper function to get colors for sub-items based on their title
const getSubItemColor = (title: string): string => {
  if (title.toLowerCase().includes('active')) return '$blue9'
  if (title.toLowerCase().includes('done')) return '$green9'
  if (title.toLowerCase().includes('hold')) return '$red9'
  return '$gray9'
}

type DrawerLinkProps = {
  item: DrawerItemConfig
  pathname: string
  collapsed?: boolean
  onNavigate?: (href: string, event: GestureResponderEvent) => void
  depth?: number
  expandedItems?: Set<string>
  onToggleExpanded?: (key: string) => void
}

const DrawerLink = ({
  item,
  pathname,
  collapsed = false,
  depth = 0,
  onNavigate,
  expandedItems,
  onToggleExpanded,
}: DrawerLinkProps) => {
  const link = useLink({ href: item.href })
  const active = isActivePath(pathname, item.href)
  const Icon = item.icon
  const isExpanded = expandedItems?.has(item.key) || false

  const handlePress = (event: GestureResponderEvent) => {
    if (item.disabled) return

    if (item.isExpandable && onToggleExpanded) {
      onToggleExpanded(item.key)
    } else {
      link.onPress?.(event)
      onNavigate?.(item.href, event)
    }
  }

  if (collapsed) {
    return (
      <Button
        {...link}
        accessibilityRole="button"
        circular
        size="$3"
        icon={<Icon size={18} color="$color11" />}
        disabled={item.disabled}
        onPress={handlePress}
      />
    )
  }

  // For sub-items (depth > 0), render with different styling
  if (depth > 0) {
    return (
      <XStack
        ai="center"
        gap="$3"
        px="$3"
        py="$2"
        ml="$4" // Indent sub-items
        pressStyle={{ bg: '$color3' }} // Add press feedback
        onPress={handlePress}
        cursor="pointer"
      >
        {/* Connecting line */}
        <YStack w={1} h={20} bg="$color6" />

        {/* Colored circular icon */}
        <XStack ai="center" jc="center" w={8} h={8} br="$10" bg={getSubItemColor(item.title)}>
          <Icon size={12} color="$color12" />
        </XStack>

        {/* Title */}
        <Paragraph size="$2" fow="400" color="$color11">
          {item.title}
        </Paragraph>
      </XStack>
    )
  }

  // For main items
  const content = (
    <YStack>
      <XStack
        {...link}
        ai="center"
        jc="space-between"
        px="$3"
        py="$2"
        br="$4"
        bg={active ? '$blue9' : 'transparent'}
        pressStyle={{ bg: active ? '$blue9' : '$color3' }}
        disabled={item.disabled}
        onPress={handlePress}
        opacity={item.disabled ? 0.5 : 1}
        cursor="pointer"
      >
        <XStack ai="center" gap="$3">
          {/* Icon with circular background */}
          <XStack
            ai="center"
            jc="center"
            w={40}
            h={40}
            br="$10"
            bg={active ? 'transparent' : '$color1'}
          >
            <Icon size={20} color={active ? '$color12' : '$blue9'} />
          </XStack>

          {/* Title */}
          <Paragraph size="$3" fow="500" color={active ? '$color12' : '$color11'}>
            {item.title}
          </Paragraph>
        </XStack>

        {/* Right side elements */}
        <XStack ai="center" gap="$2">
          {/* Badge */}
          {item.badge && (
            <XStack px="$2" py="$1" br="$10" bg="$red9" minWidth={20} ai="center">
              <Paragraph size="$1" color="$color12" fow="600">
                {item.badge}
              </Paragraph>
            </XStack>
          )}

          {/* Chevron for regular items */}
          {item.hasChevron && !item.isExpandable && <ChevronRight size={16} color="$color10" />}

          {/* Expandable chevron */}
          {item.isExpandable && (
            <ChevronDown
              size={16}
              color="$color10"
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          )}
        </XStack>
      </XStack>

      {/* Sub-items */}
      {item.isExpandable && isExpanded && item.subItems && (
        <YStack mt="$1" gap="$1">
          {item.subItems.map((subItem) => (
            <DrawerLink
              key={subItem.key}
              item={subItem}
              pathname={pathname}
              depth={1}
              onNavigate={onNavigate}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </YStack>
      )}
    </YStack>
  )

  return content
}

type DrawerSectionProps = {
  section: DrawerSectionConfig
  pathname: string
  collapsed?: boolean
  onNavigate?: (href: string, event: GestureResponderEvent) => void
  expandedItems?: Set<string>
  onToggleExpanded?: (key: string) => void
}

const DrawerSection = ({
  section,
  pathname,
  collapsed,
  onNavigate,
  expandedItems,
  onToggleExpanded,
}: DrawerSectionProps) => {
  if (collapsed) {
    // For collapsed mode, show all items flat
    const items = section.items.flatMap((item) => [
      { item, depth: 0 },
      ...(item.subItems?.map((sub) => ({ item: sub, depth: 1 })) ?? []),
    ])

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
            expandedItems={expandedItems}
            onToggleExpanded={onToggleExpanded}
          />
        ))}
      </YStack>
    )
  }

  // For expanded mode, show items with expandable functionality
  return (
    <YStack gap="$1" width="100%">
      {section.items.map((item) => (
        <DrawerLink
          key={`${section.key}-${item.key}`}
          item={item}
          pathname={pathname}
          onNavigate={onNavigate}
          expandedItems={expandedItems}
          onToggleExpanded={onToggleExpanded}
        />
      ))}
    </YStack>
  )
}

type DrawerContentProps = {
  pathname: string
  collapsed?: boolean
  onNavigate?: (href: string, event: GestureResponderEvent) => void
  expandedItems?: Set<string>
  onToggleExpanded?: (key: string) => void
}

export const DrawerContent = ({
  pathname,
  collapsed = false,
  onNavigate,
  expandedItems,
  onToggleExpanded,
}: DrawerContentProps) => {
  const { profile, avatarUrl } = useUser()
  const tokens = getTokens()
  const manageLink = useLink({ href: DASHBOARD_ROUTES.PROFILE?.fullPath || '/dashboard/profile' })
  const avatarSize = tokens.size['3'].val

  const handleManagePress = (event: GestureResponderEvent) => {
    manageLink.onPress?.(event)
    onNavigate?.(DASHBOARD_ROUTES.PROFILE?.fullPath || '/dashboard/profile', event)
  }

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
      <YStack gap="$4" width="100%" flexShrink={0}>
        <Card
          px="$4"
          py="$3"
          gap="$3"
          borderRadius="$5"
          borderColor="$color4"
          backgroundColor="$color3"
        >
          <ListItem
            hoverTheme
            pressTheme
            size="$4"
            px="$0"
            py="$0"
            bg="transparent"
            onPress={handleManagePress}
            title={
              !collapsed
                ? (profile as unknown as { name?: string })?.name || 'Rajeev Ranjan'
                : undefined
            }
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
            iconAfter={!collapsed ? <ChevronRight size={16} color="$color10" /> : undefined}
          />
        </Card>
      </YStack>

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

export const DrawerMenu = (props: DrawerContentComponentProps) => {
  const { navigation } = props
  const { top, bottom } = useSafeAreaInsets()
  const tokens = getTokens()
  const pathname = normalizePath(usePathname())
  const collapsed = false
  const verticalPadding = tokens.space['$5'].val

  // State for managing expanded items
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = useCallback((key: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }, [])

  const handleNavigate = useCallback(
    (_href: string, _event?: GestureResponderEvent) => {
      navigation.closeDrawer()
    },
    [navigation]
  )

  return (
    <YStack
      flex={1}
      backgroundColor="$color2"
      paddingTop={top + verticalPadding}
      paddingBottom={bottom + verticalPadding}
    >
      <DrawerContent
        pathname={pathname}
        collapsed={collapsed}
        onNavigate={handleNavigate}
        expandedItems={expandedItems}
        onToggleExpanded={toggleExpanded}
      />
    </YStack>
  )
}

export default DrawerMenu
