import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import {
  CertificationsWidget,
  CommunityBadgesWidget,
  EducationWidget,
  ExperienceWidget,
  GeneralInfoWidget,
  ReviewsWidget,
  SkillsWidget,
} from '@scf/core/features/profile/widgets'
import { useAuth } from '@scf/core/provider/auth/useAuth'
import { useRecordViewMutation } from '@scf/core/utils/profile-views-sdk-hooks'
import { useGeneralInfoWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import type { DashboardBreadcrumbSegment } from '@scf/core/utils/navigation/buildDashboardBreadcrumbs'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useRef } from 'react'
import { Stack } from '@scaffald/ui'

/**
 * Dynamic User Profile Route
 * Shows comprehensive profile view for any user
 * Uses same widgets as own profile but with showEdit={false}
 */
export default function UserProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuth()
  const currentUserId = session?.user?.id

  // Fetch user profile data for title
  const { data: profileData, isLoading: isProfileLoading } = useGeneralInfoWidget(
    { userId: id || '' },
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  // Calculate display name using the same logic as GeneralInfoWidget
  const displayName = profileData
    ? profileData.display_name ||
      (profileData.privateData?.first_name && profileData.privateData?.last_name
        ? `${profileData.privateData.first_name} ${profileData.privateData.last_name}`
        : profileData.username)
    : null

  // Determine if viewing own profile
  const isOwnProfile = currentUserId === id

  // Profile view tracking. See the note on the public profile route: depending
  // on the mutation *object* re-runs this effect on the render its own mutate()
  // caused. Here the calls succeed rather than 401, so the loop wrote a view
  // record per render instead of failing loudly (#731).
  const { mutate: recordProfileView } = useRecordViewMutation()
  const recordedProfileId = useRef<string | null>(null)

  useEffect(() => {
    // Don't track own profile views.
    if (!id || isOwnProfile || !currentUserId) return

    if (recordedProfileId.current === id) return
    recordedProfileId.current = id

    // Fire-and-forget; the route handles session id and deduplication.
    recordProfileView({ viewedUserId: id })
  }, [id, isOwnProfile, currentUserId, recordProfileView])

  const breadcrumbs = useMemo<DashboardBreadcrumbSegment[]>(
    () => [
      { route: ROUTES.WORKERS },
      {
        isActive: true,
        label: isOwnProfile ? 'My Profile' : displayName || 'Loading...',
      },
    ],
    [isOwnProfile, displayName]
  )

  if (!id) {
    return null
  }

  return (
    <DashboardPage
      breadcrumbs={breadcrumbs}
      pageTitle={() => {
        if (isProfileLoading || !profileData) {
          return 'User Profile'
        }

        return isOwnProfile ? 'My Profile' : displayName || 'User Profile'
      }}
      pageTitleDeps={[isProfileLoading, profileData, displayName, isOwnProfile]}
      leftContent={
        <Stack gap={16}>
          <GeneralInfoWidget userId={id} showEdit={false} />
          <CommunityBadgesWidget userId={id} showEdit={false} />
          <ExperienceWidget userId={id} showEdit={false} />
          <EducationWidget userId={id} showEdit={false} />
        </Stack>
      }
      rightContent={
        <Stack gap={16}>
          <SkillsWidget userId={id} showEdit={false} />
          <CertificationsWidget userId={id} showEdit={false} />
          <ReviewsWidget userId={id} showEdit />
        </Stack>
      }
    />
  )
}
