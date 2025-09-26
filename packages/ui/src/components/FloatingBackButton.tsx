import { ArrowLeft } from '@tamagui/lucide-icons'
import { useCallback } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, useMedia, useTheme } from 'tamagui'

export interface FloatingBackButtonProps {
  /**
   * Custom onPress handler. This is now required since we can't assume expo-router
   */
  onPress: () => void
  /**
   * Whether to show the button. Defaults to true
   */
  show?: boolean
  /**
   * Custom bottom offset from safe area. Defaults to 20
   */
  bottomOffset?: number
  /**
   * Custom left offset from safe area. Defaults to 20
   */
  leftOffset?: number
}

/**
 * A floating back button that appears in the bottom left corner of the screen.
 * Designed to be used instead of the header back button for better mobile UX.
 *
 * @param props - FloatingBackButtonProps
 * @returns JSX element or null if not shown
 */
export const FloatingBackButton = ({
  onPress,
  show = true,
  bottomOffset = 20,
  leftOffset = 20,
}: FloatingBackButtonProps) => {
  const insets = useSafeAreaInsets()
  const media = useMedia()
  const theme = useTheme()

  const handlePress = useCallback(() => {
    onPress()
  }, [onPress])

  // Hide on desktop/tablet where drawer is permanent
  if (!show || media.gtSm) {
    return null
  }

  return (
    <Button
      position="absolute"
      bottom={insets.bottom + bottomOffset}
      left={insets.left + leftOffset}
      size="$4"
      circular
      backgroundColor="$background"
      borderColor="$borderColor"
      borderWidth={1}
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={8}
      elevation={4}
      pressStyle={{
        scale: 0.95,
      }}
      hoverStyle={{
        backgroundColor: '$backgroundHover',
      }}
      zIndex={1000}
      onPress={handlePress}
    >
      <Button.Icon>
        <ArrowLeft size={20} color={theme.color.val} />
      </Button.Icon>
    </Button>
  )
}

FloatingBackButton.displayName = 'FloatingBackButton'
