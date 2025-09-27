import { SidebarMenu, type MenuItem, useMedia } from '@app/ui'
import { Type, MousePointer, FormInput, BarChart3, Zap, Layout } from '@tamagui/lucide-icons'
import { usePathname } from '@app/core/utils/usePathname'
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'

export const StyleguideScreen = () => {
  const media = useMedia()
  const pathname = usePathname()

  const menuItems: MenuItem[] = [
    {
      id: 'typography',
      label: 'Typography',
      icon: Type,
      accentTheme: 'blue',
      isActive:
        pathname ===
        DASHBOARD_ROUTES.STYLEGUIDE?.childrenArray?.find(
          (r) => r.path === '/dashboard/styleguide/typography'
        )?.fullPath,
      href: media.sm
        ? DASHBOARD_ROUTES.STYLEGUIDE?.childrenArray?.find(
            (r) => r.path === '/dashboard/styleguide/typography'
          )?.fullPath
        : ROUTES.styleguide.fullPath,
    },
    {
      id: 'buttons',
      label: 'Buttons',
      icon: MousePointer,
      accentTheme: 'green',
      isActive:
        pathname ===
        DASHBOARD_ROUTES.STYLEGUIDE?.childrenArray?.find(
          (r) => r.path === '/dashboard/styleguide/buttons'
        )?.fullPath,
      href: DASHBOARD_ROUTES.STYLEGUIDE?.childrenArray?.find(
        (r) => r.path === '/dashboard/styleguide/buttons'
      )?.fullPath,
    },
    {
      id: 'forms',
      label: 'Form Controls',
      icon: FormInput,
      accentTheme: 'purple',
      isActive:
        pathname ===
        DASHBOARD_ROUTES.STYLEGUIDE?.childrenArray?.find(
          (r) => r.path === '/dashboard/styleguide/forms'
        )?.fullPath,
      href: DASHBOARD_ROUTES.STYLEGUIDE?.childrenArray?.find(
        (r) => r.path === '/dashboard/styleguide/forms'
      )?.fullPath,
    },
    {
      id: 'data-display',
      label: 'Data Display',
      icon: BarChart3,
      accentTheme: 'orange',
      isActive:
        pathname ===
        DASHBOARD_ROUTES.STYLEGUIDE?.childrenArray?.find(
          (r) => r.path === '/dashboard/styleguide/data-display'
        )?.fullPath,
      href: DASHBOARD_ROUTES.STYLEGUIDE?.childrenArray?.find(
        (r) => r.path === '/dashboard/styleguide/data-display'
      )?.fullPath,
    },
    {
      id: 'interactive',
      label: 'Interactive',
      icon: Zap,
      accentTheme: 'pink',
      isActive:
        pathname ===
        DASHBOARD_ROUTES.STYLEGUIDE?.childrenArray?.find(
          (r) => r.path === '/dashboard/styleguide/interactive'
        )?.fullPath,
      href: DASHBOARD_ROUTES.STYLEGUIDE?.childrenArray?.find(
        (r) => r.path === '/dashboard/styleguide/interactive'
      )?.fullPath,
    },
    {
      id: 'layout',
      label: 'Layout',
      icon: Layout,
      accentTheme: 'gray',
      isActive:
        pathname ===
        DASHBOARD_ROUTES.STYLEGUIDE?.childrenArray?.find(
          (r) => r.path === '/dashboard/styleguide/layout'
        )?.fullPath,
      href: DASHBOARD_ROUTES.STYLEGUIDE?.childrenArray?.find(
        (r) => r.path === '/dashboard/styleguide/layout'
      )?.fullPath,
    },
  ]

  return <SidebarMenu items={menuItems} />
}
