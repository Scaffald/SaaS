// SC-28: Theme toggle hidden for MVP (light-only). Restore the import and
// the toggle button below once dark mode is reinstated.
// import { useThemeSetting } from '@scf/core/provider/theme/UniversalThemeProvider'
import { supabase } from '@scf/core/utils/supabase/client'
import { LogOut } from 'lucide-react-native'
// import { LogOut, Moon, Sun } from 'lucide-react-native'
import type { GestureResponderEvent } from 'react-native'
import { Button, Row, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

/**
 * DrawerFooter component renders fixed action buttons at the bottom of the drawer.
 * Theme toggle is hidden for MVP — see SC-28.
 */
export const DrawerFooter = () => {
  const { theme } = useThemeContext()
  // const { resolvedTheme, toggle } = useThemeSetting()

  const handleLogout = async (event?: GestureResponderEvent) => {
    event?.preventDefault()
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // const handleThemeToggle = (event?: GestureResponderEvent) => {
  //   event?.preventDefault()
  //   toggle()
  // }

  // const isDark = resolvedTheme === 'dark'
  const iconColor = colors.fg[theme].active

  return (
    <Row
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border[theme].default,
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
    >
      {/* SC-28: Theme toggle hidden for MVP (light-only).
      <Button
        size="sm"
        variant="outline"
        color="gray"
        onPress={handleThemeToggle}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {isDark ? <Sun size={20} color={iconColor} /> : <Moon size={20} color={iconColor} />}
      </Button>
      */}

      {/* Logout Button */}
      <Button
        size="sm"
        variant="outline"
        color="gray"
        onPress={handleLogout}
        aria-label="Sign out"
      >
        <LogOut size={20} color={iconColor} />
      </Button>
    </Row>
  )
}
