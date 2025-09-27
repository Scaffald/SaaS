import { DashboardLayout } from '@app/ui'
import { ProfileScreen } from './screen'

export type ProfileLayoutProps = {
  /**
   * Profile page title
   */
  title?: string
  /**
   * Whether this is a home page
   */
  isProfileHome?: boolean
  /**
   * Main content
   */
  children?: React.ReactNode
}

export const ProfileLayout = ({
  title = 'Profile',
  isProfileHome = false,
  children,
}: ProfileLayoutProps) => {
  return (
    <DashboardLayout
      header={{
        title,
        showBackButton: !isProfileHome,
        showMenuButton: isProfileHome,
        showSearch: false,
        showNotifications: true,
      }}
      fullPage={true}
    >
      {children}
    </DashboardLayout>
  )
}
