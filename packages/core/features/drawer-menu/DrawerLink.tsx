import { ChevronRight, ChevronDown } from '@tamagui/lucide-icons'
import { GestureResponderEvent } from 'react-native'
import { XStack, Paragraph, YStack, Link } from '@app/ui'
import type { DrawerItemConfig, DrawerLinkProps } from './types'
import { isActivePath } from './utils'

export const DrawerLink = ({
  item,
  pathname,
  collapsed = false,
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
      <XStack ai="center" gap="$3" px="$3" py="$2" opacity={0.5} cursor="not-allowed">
        {Icon && <Icon size={18} color="$color11" />}
        <Paragraph size="$3" fow="500" color="$color11">
          {item.title}
        </Paragraph>
      </XStack>
    )
  }

  // If item is expandable, render as button for toggle functionality
  if (item.isExpandable) {
    return (
      <YStack>
        <XStack
          ai="center"
          jc="space-between"
          px="$3"
          py="$2"
          br="$4"
          bg={active ? '$blue9' : 'transparent'}
          pressStyle={{ bg: active ? '$blue9' : '$color3' }}
          onPress={handleToggle}
          cursor="pointer"
        >
          <XStack ai="center" gap="$3" my="$1">
            {Icon && (
              <XStack
                ai="center"
                jc="center"
                w={38}
                h={38}
                br="$6"
                bg={active ? 'rgba(255, 255, 255, 0.9)' : '$color3'}
                boxShadow={active ? '1px 1px 2px rgba(0, 0, 0, 0.3), -1px -1px 0 white' : 'unset'}
              >
                <Icon size={20} color={active ? '$blue9' : '$blue9'} />
              </XStack>
            )}
            <Paragraph size="$3" fow="500" color={active ? '$color12' : '$color11'}>
              {item.title}
            </Paragraph>
          </XStack>
          <ChevronDown
            size={16}
            color="$color10"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </XStack>
        {isExpanded && item.subItems && (
          <YStack br="$4" my="$2" gap="$2">
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

  if (collapsed) {
    return (
      <Link href={item.href} aria-label={item.title}>
        <XStack
          ai="center"
          jc="center"
          w={44}
          h={44}
          br="$10"
          bg={active ? '$blue9' : '$color3'}
          pressStyle={{ bg: active ? '$blue8' : '$color4' }}
        >
          {Icon && <Icon size={18} color={active ? '$color12' : '$color11'} />}
        </XStack>
      </Link>
    )
  }

  // For sub-items (depth > 0), render as link with different styling
  if (depth > 0) {
    return (
      <Link href={item.href}>
        <XStack
          ai="center"
          gap="$3"
          px="$3"
          py="$2"
          ml="$4"
          pressStyle={{ bg: '$color3' }}
          cursor="pointer"
        >
          <Paragraph size="$2" fow="400" color={active ? '$blue9' : '$color11'}>
            {item.title}
          </Paragraph>
        </XStack>
      </Link>
    )
  }

  // For main items - render as link
  return (
    <Link href={item.href}>
      <XStack
        ai="center"
        jc="space-between"
        px="$3"
        py="$2"
        br="$4"
        bg={active ? '$blue9' : 'transparent'}
        pressStyle={{ bg: active ? '$blue9' : '$color3' }}
        cursor="pointer"
      >
        <XStack ai="center" gap="$3" my="$1">
          {Icon && (
            <XStack
              ai="center"
              jc="center"
              w={38}
              h={38}
              br="$6"
              bg={active ? 'rgba(255, 255, 255, 0.9)' : '$color3'}
              boxShadow={active ? '1px 1px 2px rgba(0, 0, 0, 0.3), -1px -1px 0 white' : 'unset'}
            >
              <Icon size={20} color={active ? '$blue9' : '$blue9'} />
            </XStack>
          )}
          <Paragraph size="$3" fow="500" color={active ? '$color12' : '$color11'}>
            {item.title}
          </Paragraph>
        </XStack>

        <XStack ai="center" gap="$2">
          {item.badge && (
            <XStack px="$2" py="$1" br="$10" bg="$red9" minWidth={20} ai="center">
              <Paragraph size="$1" color="$color12" fow="600">
                {item.badge}
              </Paragraph>
            </XStack>
          )}
          {item.hasChevron && <ChevronRight size={16} color="$color10" />}
        </XStack>
      </XStack>
    </Link>
  )
}
