import { SidebarMenu, type MenuItem, useMedia } from '@app/ui'
import { Type, MousePointer, FormInput, BarChart3, Zap, Layout } from '@tamagui/lucide-icons'
import { usePathname } from '@app/core/utils/usePathname'
import { ROUTES } from '@app/core/constants/routes'

export const StyleguideScreen = () => {
  const media = useMedia()
  const pathname = usePathname()

  const menuItems: MenuItem[] = [
    {
      id: 'typography',
      label: 'Typography',
      icon: Type,
      accentTheme: 'blue',
      isActive: pathname === ROUTES.STYLEGUIDE_TYPOGRAPHY,
      href: media.sm ? ROUTES.STYLEGUIDE_TYPOGRAPHY : ROUTES.STYLEGUIDE,
    },
    {
      id: 'buttons',
      label: 'Buttons',
      icon: MousePointer,
      accentTheme: 'green',
      isActive: pathname === ROUTES.STYLEGUIDE_BUTTONS,
      href: ROUTES.STYLEGUIDE_BUTTONS,
    },
    {
      id: 'forms',
      label: 'Form Controls',
      icon: FormInput,
      accentTheme: 'purple',
      isActive: pathname === ROUTES.STYLEGUIDE_FORMS,
      href: ROUTES.STYLEGUIDE_FORMS,
    },
    {
      id: 'data-display',
      label: 'Data Display',
      icon: BarChart3,
      accentTheme: 'orange',
      isActive: pathname === ROUTES.STYLEGUIDE_DATA_DISPLAY,
      href: ROUTES.STYLEGUIDE_DATA_DISPLAY,
    },
    {
      id: 'interactive',
      label: 'Interactive',
      icon: Zap,
      accentTheme: 'pink',
      isActive: pathname === ROUTES.STYLEGUIDE_INTERACTIVE,
      href: ROUTES.STYLEGUIDE_INTERACTIVE,
    },
    {
      id: 'layout',
      label: 'Layout',
      icon: Layout,
      accentTheme: 'gray',
      isActive: pathname === ROUTES.STYLEGUIDE_LAYOUT,
      href: ROUTES.STYLEGUIDE_LAYOUT,
    },
  ]

  return <SidebarMenu items={menuItems} />
}
