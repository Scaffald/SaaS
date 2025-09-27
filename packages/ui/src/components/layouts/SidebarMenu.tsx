import { Paragraph, ScrollView, Separator, XStack, YStack, isWeb } from 'tamagui'
import type { IconProps } from '@tamagui/helpers-icon'
import type { ThemeName } from 'tamagui'
import { useLink } from 'solito/link'

export type MenuItem = {
  id: string
  label: string
  icon: React.FC<IconProps>
  accentTheme?: ThemeName
  isActive?: boolean
  onPress?: () => void
  href?: string
  rightLabel?: string
  showSeparator?: boolean
}

export type SidebarMenuProps = {
  /**
   * Array of menu items to display
   */
  items: MenuItem[]
  /**
   * Optional footer content (like version info)
   */
  footer?: React.ReactNode
}

export const SidebarMenu = ({ items, footer }: SidebarMenuProps) => {
  return (
    <YStack f={1}>
      <ScrollView>
        <YStack gap="$2" p="$4">
          {items.map((item, index) => (
            <YStack key={item.id}>
              <SidebarMenuItem item={item} />
              {item.showSeparator && isWeb && index < items.length - 1 && (
                <Separator boc="$color3" mx="$-4" bw="$0.25" my="$2" />
              )}
            </YStack>
          ))}
        </YStack>
      </ScrollView>
      {footer && (
        <Paragraph py="$2" ta="center" theme="alt2">
          {footer}
        </Paragraph>
      )}
    </YStack>
  )
}

type SidebarMenuItemProps = {
  item: MenuItem
}

const SidebarMenuItem = ({ item }: SidebarMenuItemProps) => {
  const linkProps = item.href ? useLink({ href: item.href }) : {}

  return (
    <XStack
      ai="center"
      jc="space-between"
      px="$3"
      py="$3"
      br="$4"
      bg={item.isActive ? '$color2' : 'transparent'}
      pressStyle={{ bg: '$color2' }}
      cursor="pointer"
      onPress={item.onPress}
      {...linkProps}
    >
      <XStack ai="center" gap="$3" f={1}>
        <YStack theme={item.accentTheme} bg="$background" p="$1.5" br="$3" o={0.6}>
          <item.icon size={16} />
        </YStack>
        <Paragraph size="$3" fow={item.isActive ? '600' : '400'}>
          {item.label}
        </Paragraph>
      </XStack>
      {item.rightLabel && (
        <YStack br="$10" bg="$backgroundPress" px="$3" py="$1.5">
          <Paragraph size="$2" tt="capitalize">
            {item.rightLabel}
          </Paragraph>
        </YStack>
      )}
    </XStack>
  )
}
