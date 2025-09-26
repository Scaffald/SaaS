import { TwoColumnContentSkeleton, TwoColumnLayout, TwoColumnSidebarSkeleton } from '@app/ui'
import { useUser } from '@app/core/utils/useUser'

import { OrganizationsScreen } from './screen'

export type OrganizationsLayoutProps = {
  /**
   * web-only
   */
  isOrganizationsHome?: boolean
  /**
   * web-only
   */
  children?: React.ReactNode
}

export const OrganizationsLayout = ({
  children,
  isOrganizationsHome = false,
}: OrganizationsLayoutProps) => {
  const { isPending, user } = useUser()
  const showSkeleton = isPending || !user

  return (
    <TwoColumnLayout
      sidebar={<OrganizationsScreen />}
      isHomePage={isOrganizationsHome}
      isLoading={showSkeleton}
      sidebarSkeleton={<TwoColumnSidebarSkeleton />}
      contentSkeleton={<TwoColumnContentSkeleton />}
    >
      {children}
    </TwoColumnLayout>
  )
}
