import { SidebarMenu, type MenuItem } from '@app/ui'
import { User, FileText, Wrench, ShieldCheck, PhoneCall, Cog, LogOut } from '@tamagui/lucide-icons'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import { usePathname } from '@app/core/utils/usePathname'
import { useLink } from 'solito/link'
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'

export const ProfileScreen = () => {
  const pathname = usePathname()
  const supabase = useSupabase()
  const settingsLink = useLink({
    href: DASHBOARD_ROUTES.SETTINGS?.fullPath || '/dashboard/settings',
  })

  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: User,
      accentTheme: 'blue',
      isActive:
        pathname === DASHBOARD_ROUTES.PROFILE?.fullPath ||
        pathname ===
          DASHBOARD_ROUTES.PROFILE?.childrenArray?.find(
            (r) => r.path === '/dashboard/profile/overview'
          )?.fullPath,
      href: DASHBOARD_ROUTES.PROFILE?.fullPath || '/dashboard/profile',
    },
    {
      id: 'basic-info',
      label: 'Basic Information',
      icon: FileText,
      accentTheme: 'green',
      isActive:
        pathname ===
        DASHBOARD_ROUTES.PROFILE?.childrenArray?.find(
          (r) => r.path === '/dashboard/profile/general'
        )?.fullPath,
      href: DASHBOARD_ROUTES.PROFILE?.childrenArray?.find(
        (r) => r.path === '/dashboard/profile/general'
      )?.fullPath,
    },
    {
      id: 'work-skills',
      label: 'Work & Skills',
      icon: Wrench,
      accentTheme: 'orange',
      isActive:
        pathname ===
        DASHBOARD_ROUTES.PROFILE?.childrenArray?.find((r) => r.path === '/dashboard/profile/skills')
          ?.fullPath,
      href: DASHBOARD_ROUTES.PROFILE?.childrenArray?.find(
        (r) => r.path === '/dashboard/profile/skills'
      )?.fullPath,
    },
    {
      id: 'travel-compliance',
      label: 'Travel & Compliance',
      icon: ShieldCheck,
      accentTheme: 'purple',
      isActive:
        pathname ===
        DASHBOARD_ROUTES.PROFILE?.childrenArray?.find(
          (r) => r.path === '/dashboard/profile/preferences'
        )?.fullPath,
      href: DASHBOARD_ROUTES.PROFILE?.childrenArray?.find(
        (r) => r.path === '/dashboard/profile/preferences'
      )?.fullPath,
    },
    {
      id: 'contact-availability',
      label: 'Contact & Availability',
      icon: PhoneCall,
      accentTheme: 'pink',
      isActive:
        pathname ===
        DASHBOARD_ROUTES.PROFILE?.childrenArray?.find(
          (r) => r.path === '/dashboard/profile/contact'
        )?.fullPath,
      href: DASHBOARD_ROUTES.PROFILE?.childrenArray?.find(
        (r) => r.path === '/dashboard/profile/contact'
      )?.fullPath,
    },
    {
      id: 'account-settings',
      label: 'Account Settings',
      icon: Cog,
      href: settingsLink.href,
      showSeparator: true,
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
