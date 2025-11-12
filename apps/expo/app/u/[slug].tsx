import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { YStack, Spinner, Text } from 'tamagui'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'
import {
  GeneralInfoWidget,
  ExperienceWidget,
  EducationWidget,
  SkillsWidget,
  CertificationsWidget,
  ReviewsWidget,
  WorkLogPortfolioWidget,
} from '@app/core/features/profile/widgets'
import { api } from '@app/core/utils/api'
import { useAuth } from '@app/core/provider/auth/useAuth'
import type { BreadcrumbItem } from '@app/ui'

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
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: false, // Don't retry on 404
    }
  )

  // Redirect to dashboard route if viewing own profile
  useEffect(() => {
    if (profileData && currentUserId && profileData.id === currentUserId) {
      router.replace(`/dashboard/users/${profileData.id}`)
    }
  }, [profileData, currentUserId, router])

  // Calculate display name
  const displayName = profileData
    ? profileData.display_name || profileData.username || 'User Profile'
    : null

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    {
      label: displayName || 'Loading...',
      isActive: true,
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
        rightContent={<QuickLinksSidebar />}
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
        rightContent={<QuickLinksSidebar />}
      />
    )
  }

  // Get visibility settings
  const visibility = profileData.visibility || {
    work_experience: true,
    education: true,
    skills: true,
    certifications: true,
    reviews: true,
    contact_info: false,
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
        <QuickLinksSidebar>
          <YStack gap="$4">
            {visibility.skills && <SkillsWidget userId={profileData.id} showEdit={false} />}
            {visibility.certifications && (
              <CertificationsWidget userId={profileData.id} showEdit={false} />
            )}
            {visibility.reviews && <ReviewsWidget userId={profileData.id} showEdit={false} />}
          </YStack>
        </QuickLinksSidebar>
      }
    />
  )
}
