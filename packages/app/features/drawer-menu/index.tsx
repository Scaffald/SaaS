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
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Binoculars,
  Map,
  Coins,
  Megaphone,
  Crown,
  Hand,
} from '@tamagui/lucide-icons'
import { GestureResponderEvent } from 'react-native'
import { useState } from 'react'
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
  subItems?: DrawerItemConfig[]
}

type DrawerSectionConfig = {
  key: string
  title: string
  items: DrawerItemConfig[]
  isExpandable?: boolean
}

const drawerSections: DrawerSectionConfig[] = [
  {
    key: 'dashboards',
    title: 'Dashboards',
    isExpandable: true,
    items: [
      {
        key: 'discover',
        title: 'Discover',
        href: '/discover',
        icon: Map,
        theme: 'purple',
      },
      {
        key: 'daily-overview',
        title: 'Daily Overview',
        href: '/',
        icon: Binoculars,
        theme: 'purple',
      },
      {
        key: 'revenue-profit',
        title: 'Revenue & Profit',
        href: '/revenue',
        icon: Coins,
        theme: 'purple',
        subItems: [
          {
            key: 'revenue-daily',
            title: 'Daily Revenue',
            href: '/revenue/daily',
            icon: BarChart3,
            theme: 'purple',
          },
          {
            key: 'revenue-monthly',
            title: 'Monthly Revenue',
            href: '/revenue/monthly',
            icon: BarChart3,
            theme: 'purple',
          },
        ],
      },
      {
        key: 'marketing',
        title: 'Marketing',
        href: '/marketing',
        icon: Megaphone,
        theme: 'purple',
        subItems: [
          {
            key: 'marketing-campaigns',
            title: 'Campaigns',
            href: '/marketing/campaigns',
            icon: Sparkles,
            theme: 'purple',
          },
          {
            key: 'marketing-analytics',
            title: 'Analytics',
            href: '/marketing/analytics',
            icon: BarChart3,
            theme: 'purple',
          },
        ],
      },
      {
        key: 'retention',
        title: 'Retention',
        href: '/retention',
        icon: Crown,
        theme: 'purple',
        subItems: [
          {
            key: 'retention-customers',
            title: 'Customer Retention',
            href: '/retention/customers',
            icon: Crown,
            theme: 'purple',
          },
          {
            key: 'retention-churn',
            title: 'Churn Analysis',
            href: '/retention/churn',
            icon: BarChart3,
            theme: 'purple',
          },
        ],
      },
      {
        key: 'product-relations',
        title: 'Product Relations',
        href: '/products',
        icon: ShoppingBag,
        theme: 'purple',
      },
      {
        key: 'attribution',
        title: 'Attribution',
        href: '/attribution',
        icon: Hand,
        theme: 'purple',
        subItems: [
          {
            key: 'attribution-sources',
            title: 'Traffic Sources',
            href: '/attribution/sources',
            icon: BarChart3,
            theme: 'purple',
          },
          {
            key: 'attribution-conversion',
            title: 'Conversion Paths',
            href: '/attribution/conversion',
            icon: Hand,
            theme: 'purple',
          },
        ],
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
  isSubItem?: boolean
}

const DrawerNavItem = ({ item, isActive, onNavigate, collapsed, isSubItem = false }: DrawerNavItemProps) => {
  const Icon = item.icon

  return (
    <XStack
      accessibilityRole="button"
      alignItems="center"
      gap="$3"
      px={isSubItem ? "$6" : "$4"}
      py="$3"
      borderRadius="$2"
      pressStyle={{ scale: 0.98 }}
      hoverStyle={{ backgroundColor: '$color2' }}
      backgroundColor={isActive ? '$purple2' : 'transparent'}
      opacity={item.disabled ? 0.5 : 1}
      onPress={item.disabled ? undefined : onNavigate}
      borderLeftWidth={isActive ? 3 : 0}
      borderLeftColor={isActive ? '$purple9' : 'transparent'}
    >
      <XStack
        alignItems="center"
        justifyContent="center"
        width="$3.5"
        height="$3.5"
        borderRadius="$2"
        backgroundColor={isActive ? '$purple3' : 'transparent'}
      >
        <Icon size={20} color={isActive ? '$purple11' : '$gray11'} />
      </XStack>
      {!collapsed && (
        <YStack f={1} gap="$1">
          <SizableText size="$4" fontWeight="600" color={isActive ? '$purple12' : '$gray12'}>
            {item.title}
          </SizableText>
          {item.description ? (
            <Paragraph size="$2" color="$gray10">
              {item.description}
            </Paragraph>
          ) : null}
        </YStack>
      )}
    </XStack>
  )
}

type DrawerAccordionItemProps = {
  item: DrawerItemConfig
  pathname: string
  navigation: DrawerContentComponentProps['navigation']
  collapsed: boolean
}

const DrawerAccordionItem = ({ item, pathname, navigation, collapsed }: DrawerAccordionItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const link = useLink({ href: item.href })
  const isActive =
    item.href === '/'
      ? pathname === '/' || pathname === '/index'
      : pathname === item.href || pathname.startsWith(`${item.href}/`)

  const handlePress = (event: GestureResponderEvent) => {
    if (item.disabled) return
    if (item.subItems && item.subItems.length > 0) {
      setIsExpanded(!isExpanded)
    } else {
      link.onPress?.(event)
      navigation.closeDrawer()
    }
  }

  const handleSubItemPress = (subItem: DrawerItemConfig) => (event: GestureResponderEvent) => {
    if (subItem.disabled) return
    const subLink = useLink({ href: subItem.href })
    subLink.onPress?.(event)
    navigation.closeDrawer()
  }

  const hasSubItems = item.subItems && item.subItems.length > 0

  return (
    <YStack>
      <DrawerNavItem 
        item={item} 
        isActive={isActive} 
        onNavigate={handlePress} 
        collapsed={collapsed}
      />
      {hasSubItems && isExpanded && !collapsed && (
        <YStack gap="$1" mt="$2">
          {item.subItems!.map((subItem) => {
            const isSubActive =
              subItem.href === '/'
                ? pathname === '/' || pathname === '/index'
                : pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)
            
            return (
              <DrawerNavItem
                key={subItem.key}
                item={subItem}
                isActive={isSubActive}
                onNavigate={handleSubItemPress(subItem)}
                collapsed={collapsed}
                isSubItem={true}
              />
            )
          })}
        </YStack>
      )}
    </YStack>
  )
}

type DrawerNavItemWrapperProps = {
  item: DrawerItemConfig
  pathname: string
  navigation: DrawerContentComponentProps['navigation']
  collapsed: boolean
}

const DrawerNavItemWrapper = ({
  item,
  pathname,
  navigation,
  collapsed,
}: DrawerNavItemWrapperProps) => {
  const link = useLink({ href: item.href })
  const isActive =
    item.href === '/'
      ? pathname === '/' || pathname === '/index'
      : pathname === item.href || pathname.startsWith(`${item.href}/`)

  const handlePress = (event: GestureResponderEvent) => {
    if (item.disabled) return
    link.onPress?.(event)
    navigation.closeDrawer()
  }

  return (
    <DrawerNavItem item={item} isActive={isActive} onNavigate={handlePress} collapsed={collapsed} />
  )
}

type DrawerSectionHeaderProps = {
  section: DrawerSectionConfig
  collapsed: boolean
  isExpanded: boolean
  onToggle: () => void
}

const DrawerSectionHeader = ({ section, collapsed, isExpanded, onToggle }: DrawerSectionHeaderProps) => {
  if (collapsed) return null

  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      px="$4"
      py="$2"
      onPress={section.isExpandable ? onToggle : undefined}
      pressStyle={{ scale: 0.98 }}
      cursor={section.isExpandable ? 'pointer' : 'default'}
    >
      <SizableText size="$2" fontWeight="600" color="$gray10" textTransform="uppercase">
        {section.title}
      </SizableText>
      {section.isExpandable && (
        <XStack alignItems="center" justifyContent="center" width="$3" height="$3">
          {isExpanded ? (
            <ChevronUp size={16} color="$gray10" />
          ) : (
            <ChevronDown size={16} color="$gray10" />
          )}
        </XStack>
      )}
    </XStack>
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
      theme="purple"
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
  const pathname = normalizePath(usePathname())
  const tokens = getTokens()
  const media = useMedia()
  const collapsed = media.sm && !media.gtSm
  const verticalPadding = tokens.space['$5'].val

  // State for accordion sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dashboards: true, // Start with dashboards expanded to match the image
  })

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  return (
    <DrawerContentScrollView
      {...props}
      bounces={false}
      style={{ backgroundColor: 'white' }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: top + verticalPadding,
        paddingBottom: bottom + verticalPadding,
      }}
    >
      <YStack f={1} gap="$5" px="$4">
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
          {drawerSections.map((section) => {
            const isExpanded = expandedSections[section.key] ?? false
            
            return (
              <YStack key={section.key} gap="$3">
                <DrawerSectionHeader
                  section={section}
                  collapsed={collapsed}
                  isExpanded={isExpanded}
                  onToggle={() => toggleSection(section.key)}
                />
                {isExpanded && (
                  <YStack gap="$2">
                    {section.items.map((item) => (
                      <DrawerAccordionItem
                        key={item.key}
                        item={item}
                        pathname={pathname}
                        navigation={navigation}
                        collapsed={collapsed}
                      />
                    ))}
                  </YStack>
                )}
              </YStack>
            )
          })}
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
                  {profile?.email ?? user?.email ?? 'View profile'}
                </Paragraph>
              </YStack>
            )}
            {!collapsed && <ProfileManageButton navigation={navigation} />}
          </XStack>
        </YStack>
      </YStack>
    </DrawerContentScrollView>
  )
}

export default DrawerMenu
