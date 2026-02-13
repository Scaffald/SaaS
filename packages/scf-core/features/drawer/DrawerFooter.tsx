import { useThemeSetting } from '@scf/core/provider/theme/UniversalThemeProvider'
import { supabase } from '@scf/core/utils/supabase/client'
import { LogOut, Moon, Sun } from 'lucide-react-native'
import type { GestureResponderEvent } from 'react-native'
import { Button, Row } from '@unicornlove/beyond-ui'

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
    <Row
      paddingHorizontal={16}
      paddingVertical={12}
      borderTopWidth={1}
      borderTopColor="$color4"
      justify="space-between"
      align="center"
    >
      {/* Theme Toggle Button */}
      <Button
        size="sm"
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
        {isDark ? <Sun size="lg" color="$blue5" /> : <Moon size="lg" color="$blue5" />}
      </Button>

      {/* Logout Button */}
      <Button
        size="sm"
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
        <LogOut size="lg" color="$blue5" />
      </Button>
    </Row>
  )
}
