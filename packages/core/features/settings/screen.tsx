import { SidebarMenu, type MenuItem, useCookieConsent, useMedia } from '@app/ui'
import { Cog, Cookie, Lock, LogOut, Mail, Moon } from '@tamagui/lucide-icons'
import { useThemeSetting } from '@app/core/provider/theme'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import { usePathname } from '@app/core/utils/usePathname'
import { useLink } from 'solito/link'
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'

export const SettingsScreen = () => {
  const media = useMedia()
  const pathname = usePathname()
  const { openPreferences, consentState, isReady } = useCookieConsent()
  const { toggle: toggleTheme, current: currentTheme } = useThemeSetting()
  const supabase = useSupabase()

  const menuItems: MenuItem[] = [
    {
      id: 'general',
      label: 'General',
      icon: Cog,
      accentTheme: 'green',
      isActive:
        pathname ===
        DASHBOARD_ROUTES.SETTINGS?.childrenArray?.find(
          (r) => r.path === '/dashboard/settings/general'
        )?.fullPath,
      href: media.sm
        ? DASHBOARD_ROUTES.SETTINGS?.childrenArray?.find(
            (r) => r.path === '/dashboard/settings/general'
          )?.fullPath
        : DASHBOARD_ROUTES.SETTINGS?.fullPath,
    },
    {
      id: 'change-password',
      label: 'Change Password',
      icon: Lock,
      accentTheme: 'green',
      isActive:
        pathname ===
        DASHBOARD_ROUTES.SETTINGS?.childrenArray?.find(
          (r) => r.path === '/dashboard/settings/security'
        )?.fullPath,
      href: DASHBOARD_ROUTES.SETTINGS?.childrenArray?.find(
        (r) => r.path === '/dashboard/settings/security'
      )?.fullPath,
    },
    {
      id: 'change-email',
      label: 'Change Email',
      icon: Mail,
      accentTheme: 'green',
      isActive:
        pathname ===
        DASHBOARD_ROUTES.SETTINGS?.childrenArray?.find(
          (r) => r.path === '/dashboard/settings/authentication'
        )?.fullPath,
      href: DASHBOARD_ROUTES.SETTINGS?.childrenArray?.find(
        (r) => r.path === '/dashboard/settings/authentication'
      )?.fullPath,
    },
    {
      id: 'manage-cookies',
      label: 'Manage Cookies',
      icon: Cookie,
      accentTheme: 'purple',
      onPress: isReady ? openPreferences : undefined,
      rightLabel: consentState ? 'Updated' : 'Review',
      showSeparator: true,
    },
    {
      id: 'theme',
      label: 'Theme',
      icon: Moon,
      accentTheme: 'blue',
      onPress: toggleTheme,
      rightLabel: currentTheme,
    },
    {
      id: 'logout',
      label: 'Log Out',
      icon: LogOut,
      accentTheme: 'red',
      onPress: () => supabase.auth.signOut(),
    },
  ]

  return <SidebarMenu items={menuItems} />
}
