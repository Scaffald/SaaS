import { useTranslation } from '@app/core/utils/useTranslation'
import { Check, ChevronRight, Clock } from '@tamagui/lucide-icons'
import { Link } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { Paragraph, XStack, YStack } from 'tamagui'
import type { DrawerLinkProps } from './types'
import { isActivePath } from './utils'

export const DrawerLink = ({
  item,
  pathname,
  depth = 0,
  onNavigate,
  expandedItems,
  onToggleExpanded,
}: DrawerLinkProps) => {
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

    return (
      <XStack items="center" justify="center" width={25} height={20} rounded="$6">
        <Icon size={20} color={active ? '$color1' : '$color12'} />
      </XStack>
    )
  }, [Icon, active])

  const renderContent = useCallback(
    () => (
      <XStack items="center" gap="$3">
        {renderIcon()}
        <Paragraph size="$4" fontWeight="600" color={active ? '$color1' : '$color12'}>
          {title}
        </Paragraph>
      </XStack>
    ),
    [active, renderIcon, title]
  )

  const renderRightSide = useCallback(
    () => (
      <XStack items="center" gap="$2">
        {item.badge && (
          <XStack px="$2" py="$1" rounded="$10" bg="$red9" minW={20} items="center">
            <Paragraph size="$1" color={active ? '$color1' : '$color12'} fontWeight="600">
              {item.badge}
            </Paragraph>
          </XStack>
        )}
        {!item.isExpandable && item.hasChevron && <ChevronRight size={16} color="$color10" />}
      </XStack>
    ),
    [active, item.badge, item.hasChevron, item.isExpandable]
  )

  if (item.disabled) {
    return (
      <XStack items="center" gap="$3" px="$3" py="$2" opacity={0.5} cursor="not-allowed" flex={1}>
        {Icon && <Icon size={18} color="$color12" />}
        <Paragraph size="$3" fontWeight="500" color="$color12">
          {title}
        </Paragraph>
      </XStack>
    )
  }

  if (depth > 0) {
    return (
      <Link href={item.href} asChild>
        <XStack
          items="center"
          rounded="$4"
          gap="$3"
          px="$3"
          py="$2"
          pl="$9"
          pressStyle={{ bg: '$color1' }}
          hoverStyle={{ bg: '$blue4' }}
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
            items="center"
            justify="space-between"
            px="$3"
            py="$2"
            rounded="$4"
            my="$1"
            bg={active ? '$blue9' : 'transparent'}
            hoverStyle={{ bg: active ? '$blue9' : '$blue3' }}
            pressStyle={{ bg: active ? '$blue9' : '$blue3' }}
            cursor="pointer"
          >
            {renderContent()}
            {renderRightSide()}
          </XStack>
        </Link>
        {shouldShowSubItems && item.subItems && (
          <YStack rounded="$4" my="$2" gap="$2" flex={1}>
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
  }

  if (isAutoExpandable) {
    return (
      <YStack flex={1}>
        <Link href={item.href} asChild>
          <XStack
            items="center"
            justify="space-between"
            px="$3"
            py="$2"
            rounded="$4"
            my="$1"
            bg={active ? '$blue9' : 'transparent'}
            hoverStyle={{ bg: active ? '$blue9' : '$blue3' }}
            pressStyle={{ bg: active ? '$blue9' : '$blue3' }}
            cursor="pointer"
          >
            {renderContent()}
            {renderRightSide()}
          </XStack>
        </Link>
        {shouldShowSubItems && item.subItems && (
          <YStack rounded="$4" my="$2" gap="$2" flex={1}>
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
  }

  if (item.subItems && item.subItems.length > 0) {
    return (
      <YStack flex={1}>
        <Link href={item.href} asChild>
          <XStack
            items="center"
            justify="space-between"
            px="$3"
            py="$2"
            rounded="$4"
            my="$1"
            bg={active ? '$blue9' : 'transparent'}
            hoverStyle={{ bg: active ? '$blue9' : '$color3' }}
            pressStyle={{ bg: active ? '$blue9' : '$color3' }}
            cursor="pointer"
          >
            {renderContent()}
            {renderRightSide()}
          </XStack>
        </Link>
        <YStack rounded="$4" my="$2" gap="$2" flex={1}>
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
      </YStack>
    )
  }

  return (
    <Link href={item.href} asChild>
      <XStack
        items="center"
        justify="space-between"
        px="$3"
        py="$3"
        rounded="$2"
        my="$1"
        bg={active ? '$blue9' : 'transparent'}
        hoverStyle={{ bg: active ? '$blue9' : '$blue3' }}
        pressStyle={{ bg: active ? '$blue9' : '$blue3' }}
        cursor="pointer"
      >
        {renderContent()}
        {renderRightSide()}
      </XStack>
    </Link>
  )
}
