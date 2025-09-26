import { Button, Input, SizableText, XStack, YStack, useMedia, useTheme } from '@app/ui'
import { Dialog } from 'tamagui'
import { Bell, Menu, Search } from '@tamagui/lucide-icons'
import { useState } from 'react'

export type AppHeaderProps = {
  /**
   * Title to display in the header
   */
  title?: string
  /**
   * Whether to show the hamburger menu button
   */
  showMenuButton?: boolean
  /**
   * Whether to show the search bar
   */
  showSearch?: boolean
  /**
   * Whether to show the notification button
   */
  showNotifications?: boolean
  /**
   * Custom content to display in the left section
   */
  leftContent?: React.ReactNode
  /**
   * Custom content to display in the right section
   */
  rightContent?: React.ReactNode
  /**
   * Callback when menu button is pressed
   */
  onMenuPress?: () => void
  /**
   * Callback when search query changes
   */
  onSearchChange?: (query: string) => void
  /**
   * Callback when notification button is pressed
   */
  onNotificationPress?: () => void
  /**
   * Whether to hide the header completely
   */
  hidden?: boolean
}

export const AppHeader = ({
  title,
  showMenuButton = true,
  showSearch = true,
  showNotifications = true,
  leftContent,
  rightContent,
  onMenuPress,
  onSearchChange,
  onNotificationPress,
  hidden = false,
}: AppHeaderProps) => {
  const media = useMedia()
  const theme = useTheme()
  const [searchQuery, setSearchQuery] = useState('')

  if (hidden) {
    return null
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    onSearchChange?.(query)
  }

  return (
    <XStack
      ai="center"
      px="$4"
      py="$3"
      borderBottomWidth={1}
      borderColor="$color4"
      backgroundColor="$color1"
      gap="$4"
      jc="space-between"
      flexShrink={0}
    >
      {/* Left Section */}
      <XStack ai="center" gap="$3" flexShrink={1} minWidth={0}>
        {leftContent || (
          <>
            {showMenuButton && !media.gtSm && (
              <Button
                size="$4"
                chromeless
                icon={<Menu size={28} />}
                onPress={onMenuPress}
                accessibilityLabel="Open menu"
              />
            )}
            {title && (
              <SizableText size="$6" fontWeight="700" flexShrink={1} minWidth={0}>
                {title}
              </SizableText>
            )}
          </>
        )}
      </XStack>

      {/* Right Section */}
      <XStack ai="center" gap="$3" flexGrow={1} justifyContent="flex-end" minWidth={0}>
        {rightContent || (
          <>
            {showSearch && <HeaderSearch query={searchQuery} onQueryChange={handleSearchChange} />}
            {showNotifications && (
              <Button
                size="$3"
                circular
                borderWidth={1}
                borderColor="$color4"
                backgroundColor="$color2"
                hoverStyle={{ backgroundColor: '$color3', borderColor: '$color5' }}
                pressStyle={{ backgroundColor: '$color3', borderColor: '$color6' }}
                icon={<Bell size={18} color={theme.color10.val} />}
                onPress={onNotificationPress}
                accessibilityLabel="Open notifications"
                flexShrink={0}
              />
            )}
          </>
        )}
      </XStack>
    </XStack>
  )
}

type HeaderSearchProps = {
  query: string
  onQueryChange: (query: string) => void
}

const HeaderSearch = ({ query, onQueryChange }: HeaderSearchProps) => {
  const theme = useTheme()
  const media = useMedia()

  const minWidth = media.gtSm ? 260 : media.gtXs ? 200 : 120
  const maxWidth = media.gtLg ? 480 : media.gtMd ? 380 : media.gtSm ? 320 : 260

  return (
    <XStack
      ai="center"
      gap="$2"
      px="$3"
      py="$2"
      flexGrow={1}
      flexShrink={1}
      minWidth={minWidth}
      maxWidth={maxWidth}
      borderRadius="$6"
      backgroundColor="$color2"
      borderWidth={1}
      borderColor="$color4"
    >
      <Search size={18} color={theme.color10.val} />
      <Input
        flexGrow={1}
        size="$3"
        borderWidth={0}
        backgroundColor="transparent"
        px="$0"
        py="$0"
        placeholder="Search"
        value={query}
        onChangeText={onQueryChange}
      />
    </XStack>
  )
}
