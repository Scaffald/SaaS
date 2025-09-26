import { TwoColumnLayout, TwoColumnSidebarSkeleton, TwoColumnContentSkeleton } from '@app/ui'
import { useUser } from '@app/core/utils/useUser'

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
  const { isPending, user } = useUser()
  const showSkeleton = isPending || !user

  return (
    <TwoColumnLayout
      sidebar={<ProfileScreen />}
      isHomePage={isProfileHome}
      isLoading={showSkeleton}
      sidebarSkeleton={<TwoColumnSidebarSkeleton />}
      contentSkeleton={<TwoColumnContentSkeleton />}
    >
      {children}
    </TwoColumnLayout>
  )
}
