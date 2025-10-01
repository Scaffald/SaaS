import { Button, XStack, useTheme } from 'tamagui'
import { Moon, Sun, LogOut } from '@tamagui/lucide-icons'
import { supabase } from '@app/core/utils/supabase/client'
import { useThemeSetting } from '@app/core/provider/theme/UniversalThemeProvider'
import { GestureResponderEvent } from 'react-native'
import { Link } from 'expo-router'

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
      px="$4"
      py="$3"
      borderTopWidth={1}
      borderTopColor="$color4"
      justify="space-between"
      items="center"
    >
      {/* Theme Toggle Button */}
      <Button
        size="$3"
        circular
        bg="$color3"
        borderColor="$color4"
        borderWidth={1}
        hoverStyle={{
          bg: '$color4',
          borderColor: '$color5',
        }}
        pressStyle={{
          bg: '$color5',
          borderColor: '$color6',
        }}
        onPress={handleThemeToggle}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {isDark ? <Sun size={20} color="$accentColor" /> : <Moon size={20} color="$accentColor" />}
      </Button>

      <Link href="/map">Map</Link>

      {/* Logout Button */}
      <Button
        size="$3"
        circular
        bg="$color3"
        borderColor="$color4"
        borderWidth={1}
        hoverStyle={{
          bg: '$color4',
          borderColor: '$color5',
        }}
        pressStyle={{
          bg: '$color5',
          borderColor: '$color6',
        }}
        onPress={handleLogout}
        aria-label="Sign out"
      >
        <LogOut size={20} color="$accentColor" />
      </Button>
    </XStack>
  )
}
