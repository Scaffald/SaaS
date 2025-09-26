import { Button, SizableText, XStack, YStack, useTheme } from '@app/ui'
import { ArrowLeft, Bell, Menu, Search } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'

export type AppHeaderProps = {
  /**
   * Title to display in the header
   */
  title?: string
  /**
   * Whether to show the back button
   */
  showBackButton?: boolean
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
   * Callback when back button is pressed
   */
  onBackPress?: () => void
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
  showBackButton = true,
  showMenuButton = false,
  showSearch = false,
  showNotifications = true,
  leftContent,
  rightContent,
  onBackPress,
  onMenuPress,
  onSearchChange,
  onNotificationPress,
  hidden = false,
}: AppHeaderProps) => {
  const theme = useTheme()
  const router = useRouter()

  if (hidden) {
    return null
  }

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress()
    } else {
      router.back()
    }
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
      minHeight={60}
    >
      {/* Left Section */}
      <XStack ai="center" gap="$3" flexShrink={1} minWidth={0}>
        {leftContent || (
          <>
            {showBackButton && (
              <Button
                size="$3"
                circular
                borderWidth={1}
                borderColor="$color4"
                backgroundColor="$color2"
                onPress={handleBackPress}
                accessibilityLabel="Go back"
                flexShrink={0}
              >
                <ArrowLeft size={18} color={theme.color10.val} />
              </Button>
            )}
            {showMenuButton && (
              <Button
                size="$3"
                circular
                borderWidth={1}
                borderColor="$color4"
                backgroundColor="$color2"
                onPress={onMenuPress}
                accessibilityLabel="Open menu"
                flexShrink={0}
              >
                <Menu size={18} color={theme.color10.val} />
              </Button>
            )}
            {title && (
              <SizableText size="$6" fontWeight="700" flexShrink={1} minWidth={0} numberOfLines={1}>
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
            {showSearch && (
              <Button
                size="$3"
                circular
                borderWidth={1}
                borderColor="$color4"
                backgroundColor="$color2"
                onPress={() => onSearchChange?.('')}
                accessibilityLabel="Search"
                flexShrink={0}
              >
                <Search size={18} color={theme.color10.val} />
              </Button>
            )}
            {showNotifications && (
              <Button
                size="$3"
                circular
                borderWidth={1}
                borderColor="$color4"
                backgroundColor="$color2"
                onPress={onNotificationPress}
                accessibilityLabel="Open notifications"
                flexShrink={0}
              >
                <Bell size={18} color={theme.color10.val} />
              </Button>
            )}
          </>
        )}
      </XStack>
    </XStack>
  )
}
