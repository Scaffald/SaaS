import { SidebarMenu, type MenuItem } from '@app/ui'
import { User, FileText, Wrench, ShieldCheck, PhoneCall, Cog, LogOut } from '@tamagui/lucide-icons'
import { useSupabase } from '@app/core/utils/supabase/useSupabase'
import { usePathname } from '@app/core/utils/usePathname'
import { useLink } from 'solito/link'

export const ProfileScreen = () => {
  const pathname = usePathname()
  const supabase = useSupabase()
  const settingsLink = useLink({ href: '/settings' })

  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: User,
      accentTheme: 'blue',
      isActive: pathname === '/profile',
      href: '/profile',
    },
    {
      id: 'basic-info',
      label: 'Basic Information',
      icon: FileText,
      accentTheme: 'green',
      isActive: pathname === '/profile/basic-info',
      href: '/profile/basic-info',
    },
    {
      id: 'work-skills',
      label: 'Work & Skills',
      icon: Wrench,
      accentTheme: 'orange',
      isActive: pathname === '/profile/work-skills',
      href: '/profile/work-skills',
    },
    {
      id: 'travel-compliance',
      label: 'Travel & Compliance',
      icon: ShieldCheck,
      accentTheme: 'purple',
      isActive: pathname === '/profile/travel-compliance',
      href: '/profile/travel-compliance',
    },
    {
      id: 'contact-availability',
      label: 'Contact & Availability',
      icon: PhoneCall,
      accentTheme: 'pink',
      isActive: pathname === '/profile/contact-availability',
      href: '/profile/contact-availability',
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
