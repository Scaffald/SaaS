import { useThemeSetting } from '@scf/core/provider/theme/UniversalThemeProvider'
import { supabase } from '@scf/core/utils/supabase/client'
import { LogOut, Moon, Sun } from 'lucide-react-native'
import type { GestureResponderEvent } from 'react-native'
import { Button, Row } from '@scaffald/ui'

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
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {/* Theme Toggle Button */}
      <Button
        size="sm"
        variant="outline"
        color="gray"
        onPress={handleThemeToggle}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {isDark ? <Sun size={20} color="#3b82f6" /> : <Moon size={20} color="#3b82f6" />}
      </Button>

      {/* Logout Button */}
      <Button
        size="sm"
        variant="outline"
        color="gray"
        onPress={handleLogout}
        aria-label="Sign out"
      >
        <LogOut size={20} color="#3b82f6" />
      </Button>
    </Row>
  )
}
