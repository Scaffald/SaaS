import { TwoColumnLayout, TwoColumnSidebarSkeleton, TwoColumnContentSkeleton } from '@app/ui'
import { useUser } from '@app/core/utils/useUser'

import { SettingsScreen } from './screen'

export type SettingsLayoutProps = {
  /**
   * web-only
   */
  isSettingsHome?: boolean
  /**
   * web-only
   */
  children?: React.ReactNode
}

export const SettingsLayout = ({ children, isSettingsHome = false }: SettingsLayoutProps) => {
  const { isPending, user } = useUser()
  const showSkeleton = isPending || !user

  return (
    <TwoColumnLayout
      sidebar={<SettingsScreen />}
      isHomePage={isSettingsHome}
      isLoading={showSkeleton}
      sidebarSkeleton={<TwoColumnSidebarSkeleton />}
      contentSkeleton={<TwoColumnContentSkeleton />}
    >
      {children}
    </TwoColumnLayout>
  )
}
