import { SidebarMenu, type MenuItem } from '@app/ui'
import { User, FileText, Wrench, ShieldCheck, PhoneCall, Cog, LogOut } from '@tamagui/lucide-icons'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import { usePathname } from '@app/core/utils/usePathname'
import { useLink } from 'solito/link'
import { ROUTES } from '@app/core/constants/routes'

export const ProfileScreen = () => {
  const pathname = usePathname()
  const supabase = useSupabase()
  const settingsLink = useLink({ href: ROUTES.SETTINGS })

  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: User,
      accentTheme: 'blue',
      isActive: pathname === ROUTES.PROFILE || pathname === ROUTES.PROFILE_OVERVIEW,
      href: ROUTES.PROFILE,
    },
    {
      id: 'basic-info',
      label: 'Basic Information',
      icon: FileText,
      accentTheme: 'green',
      isActive: pathname === ROUTES.PROFILE_BASIC_INFO,
      href: ROUTES.PROFILE_BASIC_INFO,
    },
    {
      id: 'work-skills',
      label: 'Work & Skills',
      icon: Wrench,
      accentTheme: 'orange',
      isActive: pathname === ROUTES.PROFILE_WORK_SKILLS,
      href: ROUTES.PROFILE_WORK_SKILLS,
    },
    {
      id: 'travel-compliance',
      label: 'Travel & Compliance',
      icon: ShieldCheck,
      accentTheme: 'purple',
      isActive: pathname === ROUTES.PROFILE_TRAVEL_COMPLIANCE,
      href: ROUTES.PROFILE_TRAVEL_COMPLIANCE,
    },
    {
      id: 'contact-availability',
      label: 'Contact & Availability',
      icon: PhoneCall,
      accentTheme: 'pink',
      isActive: pathname === ROUTES.PROFILE_CONTACT_AVAILABILITY,
      href: ROUTES.PROFILE_CONTACT_AVAILABILITY,
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
