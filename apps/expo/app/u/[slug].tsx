import { DashboardLayout } from '@app/core/components/layouts'
import { buildPath, ROUTES } from '@app/core/constants/routes'
import {
  CertificationsWidget,
  EducationWidget,
  ExperienceWidget,
  GeneralInfoWidget,
  ReviewsWidget,
  SkillsWidget,
  WorkLogPortfolioWidget,
} from '@app/core/features/profile/widgets'
import { useAuth } from '@app/core/provider/auth/useAuth'
import { api } from '@app/core/utils/api'
import type { BreadcrumbItem } from '@unicornlove/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Spinner, Text, YStack } from 'tamagui'

/**
 * Public User Profile Route (Vanity URL)
 * Accessible at /u/[slug] - no authentication required
 * Shows public profile view based on user's slug
 */
export default function PublicUserProfilePage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()
  const { session } = useAuth()
  const currentUserId = session?.user?.id

  // Fetch profile by slug
  const {
    data: profileData,
    isLoading,
    error,
  } = api.profile.vanity.bySlug.useQuery(
    { slug: slug || '' },
    {
      enabled: !!slug,
      retry: false, // Don't retry on 404
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  // Profile view tracking
  const recordViewMutation = api.profileViews.recordView.useMutation()

  // Track profile view automatically (before redirect check)
  useEffect(() => {
    const trackProfileView = () => {
      // Don't track if loading, no profile data, or own profile
      if (isLoading || !profileData || !profileData.id) {
        return
      }

      // Don't track own profile views
      const isOwnProfile = currentUserId && profileData.id === currentUserId
      if (isOwnProfile) {
        return
      }

      try {
        // Record view (fire-and-forget, don't wait for response)
        // The router handles session ID generation and deduplication internally
        recordViewMutation.mutate({
          viewedUserId: profileData.id,
        })
      } catch (error) {
        // Silent error handling - don't block page load
        console.warn('Failed to track profile view:', error)
      }
    }

    trackProfileView()
  }, [profileData, currentUserId, isLoading, recordViewMutation])

  // Redirect to dashboard route if viewing own profile
  useEffect(() => {
    if (profileData && currentUserId && profileData.id === currentUserId) {
      router.replace(buildPath(ROUTES.DASHBOARD.USER, { userId: profileData.id }))
    }
  }, [profileData, currentUserId, router])

  // Calculate display name
  const displayName = profileData
    ? profileData.display_name || profileData.username || 'User Profile'
    : null

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { href: ROUTES.HOME.path, label: 'Home' },
    {
      isActive: true,
      label: displayName || 'Loading...',
    },
  ]

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        leftContent={
          <YStack items="center" justify="center" style={{ minHeight: 400 }}>
            <Spinner size="large" />
            <Text mt="$4" color="$color10">
              Loading profile...
            </Text>
          </YStack>
        }
        rightContent={null}
      />
    )
  }

  // Error state (404 or other error)
  if (error || !profileData) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        leftContent={
          <YStack items="center" justify="center" style={{ minHeight: 400 }} gap="$4">
            <Text fontSize="$6" fontWeight="bold" color="$color11">
              Profile Not Found
            </Text>
            <Text color="$color10" style={{ textAlign: 'center' }}>
              The profile you're looking for doesn't exist or has been removed.
            </Text>
          </YStack>
        }
        rightContent={null}
      />
    )
  }

  // Get visibility settings
  const visibility = profileData.visibility || {
    certifications: true,
    contact_info: false,
    education: true,
    reviews: true,
    skills: true,
    work_experience: true,
  }

  // Render profile widgets based on visibility settings
  return (
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      leftContent={
        <YStack gap="$4">
          <GeneralInfoWidget userId={profileData.id} showEdit={false} />
          {visibility.work_experience && (
            <ExperienceWidget userId={profileData.id} showEdit={false} />
          )}
          <WorkLogPortfolioWidget userId={profileData.id} />
          {visibility.education && <EducationWidget userId={profileData.id} showEdit={false} />}
        </YStack>
      }
      rightContent={
        <YStack gap="$4">
          {visibility.skills && <SkillsWidget userId={profileData.id} showEdit={false} />}
          {visibility.certifications && (
            <CertificationsWidget userId={profileData.id} showEdit={false} />
          )}
          {visibility.reviews && <ReviewsWidget userId={profileData.id} showEdit={false} />}
        </YStack>
      }
    />
  )
}
