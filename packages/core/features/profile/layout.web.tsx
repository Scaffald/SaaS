import { TwoColumnLayout, TwoColumnSidebarSkeleton, TwoColumnContentSkeleton } from '@app/ui'
import { useUser } from '@app/core/utils/useUser'

import {
  ProfileSidebar,
  ProfileSection,
  ProfileChecklistItem,
  PROFILE_SECTIONS,
} from './profile-layout'

export type ProfileLayoutProps = {
  /**
   * web-only
   */
  isProfileHome?: boolean
  /**
   * web-only
   */
  children?: React.ReactNode
  /**
   * Profile-specific props
   */
  avatarUrl?: string
  fullName?: string
  sections?: ProfileSection[]
  activeSectionId?: string
  onNavigate?: (sectionId: string) => void
  checklist?: ProfileChecklistItem[]
  completionPercentage?: number
}

export const ProfileLayout = ({
  children,
  isProfileHome = false,
  avatarUrl,
  fullName,
  sections = PROFILE_SECTIONS,
  activeSectionId,
  onNavigate,
  checklist,
  completionPercentage,
}: ProfileLayoutProps) => {
  const { isPending, user } = useUser()
  const showSkeleton = isPending || !user

  return (
    <TwoColumnLayout
      sidebar={
        <ProfileSidebar
          sections={sections}
          activeSectionId={activeSectionId}
          onNavigate={onNavigate}
          checklist={checklist}
          completionPercentage={completionPercentage}
          avatarUrl={avatarUrl}
          fullName={fullName}
        />
      }
      isHomePage={isProfileHome}
      isLoading={showSkeleton}
      sidebarSkeleton={<TwoColumnSidebarSkeleton />}
      contentSkeleton={<TwoColumnContentSkeleton />}
    >
      {children}
    </TwoColumnLayout>
  )
}
