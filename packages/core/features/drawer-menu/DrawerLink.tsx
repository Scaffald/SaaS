import { ChevronRight, ChevronDown, ChevronUp } from '@tamagui/lucide-icons'
import { GestureResponderEvent } from 'react-native'
import { XStack, Paragraph, YStack } from '@app/ui'
import { useLink } from 'solito/link'
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
  const link = useLink({ href: item.href })

  const handleToggle = (event: GestureResponderEvent) => {
    event.preventDefault()
    if (item.isExpandable && onToggleExpanded) {
      onToggleExpanded(item.key)
    }
  }

  const handleNavigation = () => {
    link.onPress()
  }

  // If item is disabled, render as non-interactive element
  if (item.disabled) {
    return (
      <XStack ai="center" gap="$3" px="$3" py="$2" opacity={0.5} cursor="not-allowed" width="100%">
        {Icon && <Icon size={18} color="$color11" />}
        <Paragraph size="$3" fow="500" color="$color11">
          {item.title}
        </Paragraph>
      </XStack>
    )
  }

  // For sub-items (depth > 0), render as simple link
  if (depth > 0) {
    return (
      <XStack
        ai="center"
        br="$4"
        gap="$3"
        px="$3"
        py="$3"
        pl="$10"
        pressStyle={{ bg: '$color1' }}
        hoverStyle={{ bg: '$color3' }}
        cursor="pointer"
        width="100%"
        onPress={handleNavigation}
      >
        <Paragraph size="$2" fow="600" color={active ? '$blue9' : '$color11'}>
          {item.title}
        </Paragraph>
      </XStack>
    )
  }

  // Common icon rendering logic
  const renderIcon = () => {
    if (!Icon) return null
    return (
      <XStack
        ai="center"
        jc="center"
        w={36}
        h={36}
        br="$6"
        bg={active ? 'rgba(255, 255, 255, 0.9)' : '$color3'}
        boxShadow={active ? '1px 1px 2px rgba(0, 0, 0, 0.3), -1px -1px 0 white' : 'unset'}
      >
        <Icon size={20} color={active ? '$blue9' : '$blue9'} />
      </XStack>
    )
  }

  // Common content rendering logic
  const renderContent = () => (
    <XStack ai="center" gap="$3" my="$1">
      {renderIcon()}
      <Paragraph size="$3" fow="500" color={active ? '$color12' : '$color11'}>
        {item.title}
      </Paragraph>
    </XStack>
  )

  // Common right side elements (badge, chevron)
  const renderRightSide = () => (
    <XStack ai="center" gap="$2">
      {item.badge && (
        <XStack px="$2" py="$1" br="$10" bg="$red9" minWidth={20} ai="center">
          <Paragraph size="$1" color="$color12" fow="600">
            {item.badge}
          </Paragraph>
        </XStack>
      )}

      {/* Chevron logic */}
      {item.isExpandable ? (
        isExpanded ? (
          <ChevronUp size={16} color={active ? '$color12' : '$color10'} />
        ) : (
          <ChevronDown size={16} color={active ? '$color12' : '$color10'} />
        )
      ) : (
        item.hasChevron && <ChevronRight size={16} color="$color10" />
      )}
    </XStack>
  )

  // Common container props
  const containerProps = {
    ai: 'center' as const,
    jc: 'space-between' as const,
    px: '$3' as const,
    py: '$2' as const,
    br: '$4' as const,
    bg: active ? '$blue9' : ('transparent' as const),
    pressStyle: { bg: active ? '$blue9' : '$color3' },
    cursor: 'pointer' as const,
    width: '100%' as const,
  }

  // If item is expandable, render with toggle functionality and sub-items
  if (item.isExpandable) {
    return (
      <YStack width="100%">
        <XStack {...containerProps} onPress={handleToggle}>
          {renderContent()}
          {renderRightSide()}
        </XStack>
        {isExpanded && item.subItems && (
          <YStack br="$4" my="$2" gap="$2" width="100%">
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
    <XStack {...containerProps} onPress={handleNavigation}>
      {renderContent()}
      {renderRightSide()}
    </XStack>
  )
}
