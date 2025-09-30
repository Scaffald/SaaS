import { ChevronRight, ChevronDown, ChevronUp, ChevronLeft } from '@tamagui/lucide-icons'
import { GestureResponderEvent } from 'react-native'
import { XStack, Paragraph, YStack } from '@app/ui'
import { Link } from 'expo-router'
import type { DrawerItemConfig, DrawerLinkProps } from './types'
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
  const isExpanded = expandedItems?.has(item.key) || false
  const handleToggle = (event: GestureResponderEvent) => {
    event.preventDefault()
    if (item.isExpandable && onToggleExpanded) {
      onToggleExpanded(item.key)
    }
  }

  // If item is disabled, render as non-interactive element
  if (item.disabled) {
    return (
      <XStack items="center" gap="$3" px="$3" py="$2" opacity={0.5} cursor="not-allowed" flex={1}>
        {Icon && <Icon size={18} color="$color11" />}
        <Paragraph size="$3" fontWeight="500" color="$color11">
          {item.title}
        </Paragraph>
      </XStack>
    )
  }

  // For sub-items (depth > 0), render as simple link
  if (depth > 0) {
    return (
      <Link href={item.href} asChild>
        <XStack
          items="center"
          rounded="$4"
          gap="$3"
          px="$3"
          py="$3"
          pl="$9"
          pressStyle={{ bg: '$color1' }}
          hoverStyle={{ bg: '$color3' }}
          cursor="pointer"
          flex={1}
        >
          <Paragraph size="$2" fontWeight="600" color={active ? '$blue9' : '$color11'}>
            {item.title}
          </Paragraph>
        </XStack>
      </Link>
    )
  }

  // Common icon rendering logic
  const renderIcon = () => {
    if (!Icon) return null

    return (
      <XStack items="center" justify="center" width={25} height={20} rounded="$6">
        <Icon size={20} color={active ? '$color12' : '$blue9'} />
      </XStack>
    )
  }

  // Common content rendering logic
  const renderContent = () => (
    <XStack items="center" gap="$3" my="$1">
      {renderIcon()}
      <Paragraph size="$3" fontWeight="500" color={active ? '$color12' : '$color11'}>
        {item.title}
      </Paragraph>
    </XStack>
  )

  // Common right side elements (badge, chevron)
  const renderRightSide = () => (
    <XStack items="center" gap="$2">
      {item.badge && (
        <XStack px="$2" py="$1" rounded="$10" bg="$red9" minW={20} items="center">
          <Paragraph size="$1" color="$color12" fontWeight="600">
            {item.badge}
          </Paragraph>
        </XStack>
      )}

      {/* Chevron logic */}
      {item.isExpandable ? (
        isExpanded ? (
          <ChevronDown size={16} color={active ? '$color12' : '$color10'} />
        ) : (
          <ChevronLeft size={16} color={active ? '$color12' : '$color10'} />
        )
      ) : (
        item.hasChevron && <ChevronRight size={16} color="$color10" />
      )}
    </XStack>
  )

  // If item is expandable, render with toggle functionality and sub-items
  if (item.isExpandable) {
    return (
      <YStack flex={1}>
        <XStack
          onPress={handleToggle}
          items="center"
          justify="space-between"
          px="$3"
          py="$3"
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
        {isExpanded && item.subItems && (
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

  // For regular main items, render with proper touch handling
  return (
    <Link href={item.href} asChild>
      <XStack
        items="center"
        justify="space-between"
        px="$3"
        py="$3"
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
  )
}
