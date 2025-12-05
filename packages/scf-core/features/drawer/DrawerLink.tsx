import { useTranslation } from '@scf/core/utils/useTranslation'
import { Check, ChevronRight, Clock } from '@tamagui/lucide-icons'
import { Link } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { Paragraph, XStack, YStack } from '@unicornlove/ui'
import type { DrawerLinkProps } from './types'
import { isActivePath } from './utils'

export const DrawerLink = ({
  item,
  pathname,
  depth = 0,
  onNavigate,
  expandedItems,
  onToggleExpanded,
  isCollapsed,
}: DrawerLinkProps) => {
  const collapsed = isCollapsed ?? false
  const active = isActivePath(pathname, item.href)
  const Icon = item.icon
  const hasSubItems = Boolean(item.subItems?.length)
  // Always show sub-items when they exist
  const shouldShowSubItems = hasSubItems
  const isManualExpandable = item.isExpandable && !item.expandOnActive
  const isAutoExpandable = item.isExpandable && item.expandOnActive
  const { t } = useTranslation()

  const resolveTitle = useCallback(() => {
    if (item.titleKey) {
      return t(item.titleKey)
    }

    return item.title ?? item.key
  }, [item.key, item.title, item.titleKey, t])

  const title = useMemo(() => resolveTitle(), [resolveTitle])

  const renderIcon = useCallback(() => {
    if (!Icon) return null
    return <Icon size={20} color={active ? '$color1' : '$color12'} />
  }, [Icon, active])

  const renderContent = useCallback(() => {
    const iconWrapper = (
      <XStack
        alignItems="center"
        justifyContent="center"
        width={collapsed ? 48 : 32}
        height={collapsed ? 48 : 32}
        borderRadius="$8"
        backgroundColor={collapsed ? (active ? '$blue9' : '$color5') : 'transparent'}
      >
        {renderIcon()}
      </XStack>
    )

    if (collapsed) {
      return iconWrapper
    }

    return (
      <XStack alignItems="center" gap="$3">
        {iconWrapper}
        <Paragraph size="$4" fontWeight="600" color={active ? '$color1' : '$color12'}>
          {title}
        </Paragraph>
      </XStack>
    )
  }, [active, collapsed, renderIcon, title])

  const renderRightSide = useCallback(() => {
    if (collapsed) {
      return null
    }

    return (
      <XStack alignItems="center" gap="$2">
        {item.badge && (
          <XStack
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$10"
            backgroundColor="$red9"
            minWidth={20}
            alignItems="center"
          >
            <Paragraph size="$1" color={active ? '$color1' : '$color12'} fontWeight="600">
              {item.badge}
            </Paragraph>
          </XStack>
        )}
        {!item.isExpandable && item.hasChevron && <ChevronRight size={16} color="$color10" />}
      </XStack>
    )
  }, [active, collapsed, item.badge, item.hasChevron, item.isExpandable])

  if (collapsed && depth > 0) {
    return null
  }

  if (item.disabled) {
    if (collapsed) {
      return (
        <XStack
          alignItems="center"
          justifyContent="center"
          width={56}
          height={56}
          borderRadius="$8"
          opacity={0.4}
          backgroundColor="$color4"
          cursor="not-allowed"
        >
          {renderIcon()}
        </XStack>
      )
    }

    return (
      <XStack
        alignItems="center"
        gap="$3"
        paddingHorizontal="$3"
        paddingVertical="$2"
        opacity={0.5}
        cursor="not-allowed"
        flex={1}
      >
        {Icon && <Icon size={18} color="$color12" />}
        <Paragraph size="$3" fontWeight="500" color="$color12">
          {title}
        </Paragraph>
      </XStack>
    )
  }

  if (collapsed && depth === 0) {
    return (
      <Link href={item.href} asChild>
        <XStack
          width={56}
          height={56}
          borderRadius="$8"
          alignItems="center"
          justifyContent="center"
          backgroundColor={active ? '$blue9' : 'transparent'}
          hoverStyle={{ backgroundColor: active ? '$blue9' : '$blue4' }}
          pressStyle={{ backgroundColor: active ? '$blue9' : '$blue4' }}
          cursor="pointer"
        >
          {renderIcon()}
        </XStack>
      </Link>
    )
  }

  if (depth > 0) {
    return (
      <Link href={item.href} asChild>
        <XStack
          alignItems="center"
          borderRadius="$4"
          gap="$3"
          paddingHorizontal="$3"
          paddingVertical="$2"
          paddingLeft="$9"
          pressStyle={{ backgroundColor: '$color1' }}
          hoverStyle={{ backgroundColor: '$blue4' }}
          cursor="pointer"
          flex={1}
        >
          <Paragraph size="$4" fontWeight="500" color={active ? '$blue9' : '$color12'}>
            {title}
          </Paragraph>
          {item.isOnCooldown ? (
            <Clock size={16} color="$blue9" />
          ) : item.isCompleted ? (
            <Check size={16} color="$green9" />
          ) : null}
        </XStack>
      </Link>
    )
  }

  if (isManualExpandable) {
    return (
      <YStack flex={1}>
        <Link href={item.href} asChild>
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$4"
            marginVertical="$1"
            backgroundColor={active ? '$blue9' : 'transparent'}
            hoverStyle={{ backgroundColor: active ? '$blue9' : '$blue3' }}
            pressStyle={{ backgroundColor: active ? '$blue9' : '$blue3' }}
            cursor="pointer"
          >
            {renderContent()}
            {renderRightSide()}
          </XStack>
        </Link>
        {shouldShowSubItems && item.subItems && (
          <YStack borderRadius="$4" marginVertical="$2" gap="$2" flex={1}>
            {item.subItems.map((subItem) => (
              <DrawerLink
                key={subItem.key}
                item={subItem}
                pathname={pathname}
                depth={1}
                onNavigate={onNavigate}
                expandedItems={expandedItems}
                onToggleExpanded={onToggleExpanded}
                isCollapsed={collapsed}
              />
            ))}
          </YStack>
        )}
      </YStack>
    )
  }

  if (isAutoExpandable) {
    return (
      <YStack flex={1}>
        <Link href={item.href} asChild>
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$4"
            marginVertical="$1"
            backgroundColor={active ? '$blue9' : 'transparent'}
            hoverStyle={{ backgroundColor: active ? '$blue9' : '$blue3' }}
            pressStyle={{ backgroundColor: active ? '$blue9' : '$blue3' }}
            cursor="pointer"
          >
            {renderContent()}
            {renderRightSide()}
          </XStack>
        </Link>
        {shouldShowSubItems && item.subItems && (
          <YStack borderRadius="$4" marginVertical="$2" gap="$2" flex={1}>
            {item.subItems.map((subItem) => (
              <DrawerLink
                key={subItem.key}
                item={subItem}
                pathname={pathname}
                depth={1}
                onNavigate={onNavigate}
                expandedItems={expandedItems}
                onToggleExpanded={onToggleExpanded}
                isCollapsed={collapsed}
              />
            ))}
          </YStack>
        )}
      </YStack>
    )
  }

  if (item.subItems && item.subItems.length > 0) {
    return (
      <YStack flex={1}>
        <Link href={item.href} asChild>
          <XStack
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$4"
            marginVertical="$1"
            backgroundColor={active ? '$blue9' : 'transparent'}
            hoverStyle={{ backgroundColor: active ? '$blue9' : '$color3' }}
            pressStyle={{ backgroundColor: active ? '$blue9' : '$color3' }}
            cursor="pointer"
          >
            {renderContent()}
            {renderRightSide()}
          </XStack>
        </Link>
        <YStack borderRadius="$4" marginVertical="$2" gap="$2" flex={1}>
          {item.subItems.map((subItem) => (
            <DrawerLink
              key={subItem.key}
              item={subItem}
              pathname={pathname}
              depth={1}
              onNavigate={onNavigate}
              expandedItems={expandedItems}
              onToggleExpanded={onToggleExpanded}
              isCollapsed={collapsed}
            />
          ))}
        </YStack>
      </YStack>
    )
  }

  return (
    <Link href={item.href} asChild>
      <XStack
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="$3"
        paddingVertical="$3"
        borderRadius="$2"
        marginVertical="$1"
        backgroundColor={active ? '$blue9' : 'transparent'}
        hoverStyle={{ backgroundColor: active ? '$blue9' : '$blue3' }}
        pressStyle={{ backgroundColor: active ? '$blue9' : '$blue3' }}
        cursor="pointer"
      >
        {renderContent()}
        {renderRightSide()}
      </XStack>
    </Link>
  )
}
