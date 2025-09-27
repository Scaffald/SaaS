import { DashboardLayout } from '@app/core/features/dashboard/layout-refactored.web'
import { ProfileScreen } from './screen'

export type ProfileLayoutSimpleProps = {
  /**
   * web-only
   */
  isProfileHome?: boolean
  /**
   * web-only
   */
  children?: React.ReactNode
}

export const ProfileLayoutSimple = ({
  children,
  isProfileHome = false,
}: ProfileLayoutSimpleProps) => {
  return (
    <DashboardLayout
      useTwoColumn={true}
      sidebar={<ProfileScreen />}
      isHomePage={isProfileHome}
      fullPage={true}
    >
      {children}
    </DashboardLayout>
  )
}
