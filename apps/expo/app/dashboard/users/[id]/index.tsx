import { useLocalSearchParams } from 'expo-router'
import { useNavigation } from '@react-navigation/native'
import { useEffect, useMemo } from 'react'
import { YStack } from 'tamagui'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'
import {
  GeneralInfoWidget,
  ExperienceWidget,
  EducationWidget,
  SkillsWidget,
  CertificationsWidget,
  ReviewsWidget,
} from '@app/core/features/profile/widgets'
import { api } from '@app/core/utils/api'
import { useAuth } from '@app/core/provider/auth/useAuth'
import type { BreadcrumbItem } from '@app/ui'

/**
 * Dynamic User Profile Route
 * Shows comprehensive profile view for any user
 * Uses same widgets as own profile but with showEdit={false}
 */
export default function UserProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
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

  // Update header title dynamically
  useEffect(() => {
    if (isProfileLoading) {
      navigation.setOptions({
        title: 'User Profile',
      })
      return
    }

    if (!profileData) {
      navigation.setOptions({
        title: 'User Profile',
      })
      return
    }

    // Show "My Profile" for own profile, otherwise show display name
    const title = isOwnProfile ? 'My Profile' : displayName || 'User Profile'
    navigation.setOptions({
      title,
    })
  }, [profileData, displayName, isOwnProfile, isProfileLoading, navigation])

  // Build custom breadcrumb items with dynamic user name
  const breadcrumbItems = useMemo<BreadcrumbItem[]>(
    () => [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Discover Workers', href: '/dashboard/discover/workers' },
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
    <DashboardLayout
      breadcrumbItems={breadcrumbItems}
      leftContent={
        <YStack gap="$4">
          <GeneralInfoWidget userId={id} showEdit={false} />
          <ExperienceWidget userId={id} showEdit={false} />
          <EducationWidget userId={id} showEdit={false} />
        </YStack>
      }
      rightContent={
        <QuickLinksSidebar>
          <YStack gap="$4">
            <SkillsWidget userId={id} showEdit={false} />
            <CertificationsWidget userId={id} showEdit={false} />
            <ReviewsWidget userId={id} showEdit />
          </YStack>
        </QuickLinksSidebar>
      }
    />
  )
}
