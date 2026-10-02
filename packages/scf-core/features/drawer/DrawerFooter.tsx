import { isDarkModeEnabled } from '@scf/core/provider/theme/dark-mode-flag'
import { useThemeSetting } from '@scf/core/provider/theme/UniversalThemeProvider'
import { supabase } from '@scf/core/utils/supabase/client'
import { LogOut, Moon, Sun } from 'lucide-react-native'
import type { GestureResponderEvent } from 'react-native'
import { Button, Row, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

/**
 * DrawerFooter component renders fixed action buttons at the bottom of the drawer.
 *
 * The theme toggle was commented out for MVP (SC-28) alongside the hardcoded
 * light resolution. It is back, but only renders when `EXPO_PUBLIC_DARK_MODE=1`
 * — a toggle that renders while the resolution is gated would be a control that
 * visibly does nothing, which is worse than no control. See
 * provider/theme/dark-mode-flag.ts. #840 removes the gate.
 */
export const DrawerFooter = () => {
  const { theme } = useThemeContext()
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
        gap: 8,
      }}
    >
      {isDarkModeEnabled() && (
        <Button
          size="sm"
          variant="outline"
          color="gray"
          onPress={handleThemeToggle}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? <Sun size={20} color={iconColor} /> : <Moon size={20} color={iconColor} />}
        </Button>
      )}

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
