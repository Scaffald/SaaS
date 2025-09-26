import { SidebarMenu, type MenuItem } from '@app/ui'
import { Building2, Plus, Search } from '@tamagui/lucide-icons'
import { usePathname } from '@app/core/utils/usePathname'

const ORGANIZATION_SEARCH_PATH = '/organizations/search'
const ORGANIZATION_CREATE_PATH = '/organizations/new'
const ORGANIZATION_LIST_PATH = '/organizations/my-organizations'
const ORGANIZATION_HOME_PATH = '/organizations'

const isMyOrganizationsPath = (pathname: string) => {
  if (pathname === ORGANIZATION_HOME_PATH || pathname === ORGANIZATION_LIST_PATH) {
    return true
  }

  if (!pathname.startsWith('/organizations/')) {
    return false
  }

  return ![ORGANIZATION_SEARCH_PATH, ORGANIZATION_CREATE_PATH].includes(pathname)
}

export const OrganizationsScreen = () => {
  const pathname = usePathname()
  const media = useMedia()
  const _pathname = usePathname()
  const createLink = useLink({ href: '/organizations/new' })

  const menuItems: MenuItem[] = [
    {
      id: 'search-organizations',
      label: 'Search',
      icon: Search,
      accentTheme: 'blue',
      href: ORGANIZATION_SEARCH_PATH,
      isActive: pathname === ORGANIZATION_SEARCH_PATH,
    },
    {
      id: 'my-organizations',
      label: 'My Organizations',
      icon: Building2,
      accentTheme: 'green',
      href: ORGANIZATION_LIST_PATH,
      isActive: pathname ? isMyOrganizationsPath(pathname) : false,
    },
    {
      id: 'create-organization',
      label: 'Create Organization',
      icon: Plus,
      accentTheme: 'orange',
      href: ORGANIZATION_CREATE_PATH,
      isActive: pathname === ORGANIZATION_CREATE_PATH,
    },
  ]

  return <SidebarMenu items={menuItems} />
}
