import { DashboardLayout } from '@scf/core/components/layouts'
import { buildPath, ROUTES } from '@scf/core/constants/routes'
import {
  CertificationsWidget,
  CommunityBadgesWidget,
  EducationWidget,
  ExperienceWidget,
  GeneralInfoWidget,
  ReviewsWidget,
  SkillsWidget,
  WorkLogPortfolioWidget,
} from '@scf/core/features/profile/widgets'
import { PublicProfilePrintButton } from '@scf/core/features/profile/components/PublicProfilePrintButton'
import { PublishedPostsGallery } from '@scf/core/features/communities/components/PublishedPostsGallery'
import { ProfileScaffoldScore } from '@scf/core/features/communities/components/ProfileScaffoldScore'
import { useAuth } from '@scf/core/provider/auth/useAuth'
import { useProfileBySlug } from '@scf/core/utils/profile-general-sdk-hooks'
import { useRecordViewMutation } from '@scf/core/utils/profile-views-sdk-hooks'
import type { BreadcrumbItemData } from '@scaffald/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import type { GenerateMetadataFunction, LoaderFunction } from 'expo-server'
import { useEffect } from 'react'
import { Row, Spinner, Text, Stack } from '@scaffald/ui'
import {
  fetchPublicProfileBySlug,
  firstParam,
  SITE_ORIGIN,
  truncate,
  type PublicProfile,
} from '../../../utils/public-content-loader'
import { useRouteLoaderData } from '../../../utils/use-route-loader-data'
import { ProfileJsonLd } from '../../../components/ProfileJsonLd'

const profileDisplayName = (profile: PublicProfile) =>
  profile.full_name || profile.username || 'Profile'

const profileDescription = (profile: PublicProfile) =>
  truncate(
    profile.current_position ||
      profile.bio ||
      `${profileDisplayName(profile)}'s professional profile on Scaffald — modern hiring for technical trades.`,
    200
  )

export const loader: LoaderFunction<{ profile: PublicProfile | null }> = async (
  _request,
  params
) => {
  const profile = await fetchPublicProfileBySlug(params.slug)
  return { profile }
}

export const generateMetadata: GenerateMetadataFunction = async (_request, params) => {
  const profile = await fetchPublicProfileBySlug(params.slug)
  if (!profile) {
    // The server renderer has no route-level status override yet (always 200),
    // so keep missing profiles out of the index explicitly.
    return { title: 'Profile Not Found | Scaffald', robots: { index: false } }
  }
  const name = profileDisplayName(profile)
  const description = profileDescription(profile)
  const url = `${SITE_ORIGIN}/users/${firstParam(params.slug)}`
  return {
    title: `${name} | Scaffald`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: name,
      description,
      url,
      siteName: 'Scaffald',
      type: 'profile',
      ...(profile.avatar_url ? { images: profile.avatar_url } : {}),
    },
    twitter: {
      card: 'summary',
      title: name,
      description,
    },
  }
}

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
  const loaderData = useRouteLoaderData<{ profile: PublicProfile | null }>()

  // Fetch profile by slug
  const {
    data: queriedProfile,
    isLoading: isQueryLoading,
    error,
  } = useProfileBySlug(slug || undefined, {
    enabled: !!slug,
    retry: false, // Don't retry on 404
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  // Server render (and first client paint) uses the route loader's data;
  // the client query takes over once it resolves.
  const loaderProfile = loaderData?.profile
    ? {
        ...loaderData.profile,
        display_name: loaderData.profile.full_name,
        visibility: undefined,
      }
    : undefined
  const profileData = queriedProfile ?? loaderProfile
  const isLoading = isQueryLoading && !profileData

  // Profile view tracking
  const recordViewMutation = useRecordViewMutation()

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
  const breadcrumbItems: BreadcrumbItemData[] = [
    { href: ROUTES.HOME.path, label: 'Home' },
    {
      label: displayName || 'Loading...',
    },
  ]

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbItems={breadcrumbItems}
        leftContent={
          <Stack align="center" justify="center" style={{ minHeight: 400 }}>
            <Spinner size="lg" />
            <Text color="gray">Loading profile...</Text>
          </Stack>
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
          <Stack align="center" justify="center" style={{ minHeight: 400 }} gap={16}>
            <Text color="gray">Profile Not Found</Text>
            <Text color="gray" style={{ textAlign: 'center' }}>
              The profile you're looking for doesn't exist or has been removed.
            </Text>
          </Stack>
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
        <Stack gap={16}>
          {/* Server-rendered structured data — generateMetadata can only emit
              <meta>, so JSON-LD has to come from the tree. */}
          {loaderData?.profile ? (
            <ProfileJsonLd
              profile={loaderData.profile}
              canonicalUrl={`${SITE_ORIGIN}/users/${slug}`}
              description={profileDescription(loaderData.profile)}
            />
          ) : null}
          {/* SC-40 Phase B: Download PDF via browser print. Web-only;
              hidden during print via the `data-print-hide` attribute. */}
          <Row justify="flex-end">
            <PublicProfilePrintButton />
          </Row>
          <GeneralInfoWidget userId={profileData.id} showEdit={false} />
          <CommunityBadgesWidget userId={profileData.id} showEdit={false} />
          {visibility.work_experience && (
            <ExperienceWidget userId={profileData.id} showEdit={false} />
          )}
          <WorkLogPortfolioWidget userId={profileData.id} />
          <PublishedPostsGallery userId={profileData.id} />
          {visibility.education && <EducationWidget userId={profileData.id} showEdit={false} />}
        </Stack>
      }
      rightContent={
        <Stack gap={16}>
          <ProfileScaffoldScore userId={profileData.id} />
          {visibility.skills && <SkillsWidget userId={profileData.id} showEdit={false} />}
          {visibility.certifications && (
            <CertificationsWidget userId={profileData.id} showEdit={false} />
          )}
          {visibility.reviews && <ReviewsWidget userId={profileData.id} showEdit={false} />}
        </Stack>
      }
    />
  )
}
