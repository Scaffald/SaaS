import { PageLayoutWrapper } from '@app/ui'
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
  /**
   * Whether to show the floating back button
   */
  showFloatingBackButton?: boolean
}

export const ProfileLayout = ({
  title = 'Profile',
  isProfileHome = false,
  children,
  showFloatingBackButton = true,
}: ProfileLayoutProps) => {
  return (
    <PageLayoutWrapper
      header={{
        title,
        showBackButton: !isProfileHome,
        showMenuButton: isProfileHome,
        showSearch: false,
        showNotifications: true,
      }}
      showFloatingBackButton={showFloatingBackButton}
      fullPage={true}
    >
      {children}
    </PageLayoutWrapper>
  )
}
