import { HomeLayout } from '@app/core/features/home/layout-refactored.web'
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
    <HomeLayout
      useTwoColumn={true}
      sidebar={<ProfileScreen />}
      isHomePage={isProfileHome}
      fullPage={true}
    >
      {children}
    </HomeLayout>
  )
}
