import { ROUTES } from '@app/core/constants/routes'
import { DashboardPage } from '@app/core/features/dashboard/DashboardPage'
import type { DashboardBreadcrumbSegment } from '@app/core/utils/navigation/buildDashboardBreadcrumbs'
import {
  CertificationsWidget,
  EducationWidget,
  ExperienceWidget,
  GeneralInfoWidget,
  ReviewsWidget,
  SkillsWidget,
} from '@app/core/features/profile/widgets'
import { useAuth } from '@app/core/provider/auth/useAuth'
import { api } from '@app/core/utils/api'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo } from 'react'
import { YStack } from 'tamagui'

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
  const { data: profileData, isLoading: isProfileLoading } =
    api.profile.widgets.getGeneralInfo.useQuery(
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
  const recordViewMutation = api.profileViews.recordView.useMutation()

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isOwnProfile, currentUserId])

  const breadcrumbs = useMemo<DashboardBreadcrumbSegment[]>(
    () => [
      { route: ROUTES.DASHBOARD.DISCOVER.WORKERS },
      {
        label: isOwnProfile ? 'My Profile' : displayName || 'Loading...',
        isActive: true,
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
        <YStack gap="$4">
          <GeneralInfoWidget userId={id} showEdit={false} />
          <ExperienceWidget userId={id} showEdit={false} />
          <EducationWidget userId={id} showEdit={false} />
        </YStack>
      }
      rightContent={
        <YStack gap="$4">
          <SkillsWidget userId={id} showEdit={false} />
          <CertificationsWidget userId={id} showEdit={false} />
          <ReviewsWidget userId={id} showEdit />
        </YStack>
      }
    />
  )
}
