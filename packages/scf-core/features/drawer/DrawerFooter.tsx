import { useThemeSetting } from '@scf/core/provider/theme/UniversalThemeProvider'
import { supabase } from '@scf/core/utils/supabase/client'
import { LogOut, Moon, Sun } from '@tamagui/lucide-icons'
import type { GestureResponderEvent } from 'react-native'
import { Button, XStack } from '@unicornlove/ui'

/**
 * DrawerFooter component renders fixed action buttons at the bottom of the drawer
 * Includes theme toggle button and logout button
 */
export const DrawerFooter = () => {
  // Using supabase directly from import
  const { resolvedTheme, toggle } = useThemeSetting()

  const handleLogout = async (event?: GestureResponderEvent) => {
    event?.preventDefault()
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleThemeToggle = (event?: GestureResponderEvent) => {
    event?.preventDefault()
    toggle()
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <XStack
      paddingHorizontal="$4"
      paddingVertical="$3"
      borderTopWidth={1}
      borderTopColor="$color4"
      justifyContent="space-between"
      alignItems="center"
    >
      {/* Theme Toggle Button */}
      <Button
        size="$3"
        circular
        backgroundColor="$color3"
        borderColor="$color4"
        borderWidth={1}
        hoverStyle={{
          backgroundColor: '$color4',
          borderColor: '$color5',
        }}
        pressStyle={{
          backgroundColor: '$color5',
          borderColor: '$color6',
        }}
        onPress={handleThemeToggle}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {isDark ? <Sun size={20} color="$blue5" /> : <Moon size={20} color="$blue5" />}
      </Button>

      {/* Logout Button */}
      <Button
        size="$3"
        circular
        backgroundColor="$color3"
        borderColor="$color4"
        borderWidth={1}
        hoverStyle={{
          backgroundColor: '$color4',
          borderColor: '$color5',
        }}
        pressStyle={{
          backgroundColor: '$color5',
          borderColor: '$color6',
        }}
        onPress={handleLogout}
        aria-label="Sign out"
      >
        <LogOut size={20} color="$blue5" />
      </Button>
    </XStack>
  )
}
