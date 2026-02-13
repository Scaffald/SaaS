import { ROUTES } from '@scf/core/constants/routes'
import { DashboardPage } from '@scf/core/features/dashboard/DashboardPage'
import {
  CertificationsWidget,
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
import { useEffect, useMemo } from 'react'
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

  // Profile view tracking
  const recordViewMutation = useRecordViewMutation()

  useEffect(() => {
    // Track profile view automatically
    const trackProfileView = () => {
      // Don't track own profile views
      if (!id || isOwnProfile || !currentUserId) {
        return
      }

      try {
        // Record view (fire-and-forget, don't wait for response)
        // The router handles session ID generation and deduplication internally
        recordViewMutation.mutate({
          viewedUserId: id,
        })
      } catch (error) {
        // Silent error handling - don't block page load
        console.warn('Failed to track profile view:', error)
      }
    }

    trackProfileView()
  }, [id, isOwnProfile, currentUserId, recordViewMutation])

  const breadcrumbs = useMemo<DashboardBreadcrumbSegment[]>(
    () => [
      { route: ROUTES.DASHBOARD.DISCOVER.WORKERS },
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
