import { YStack, XStack, Text, Spinner, Avatar } from 'tamagui'
import { DashboardWidget, Button, Heading, LoadingState, spacing } from '@app/ui'
import { api } from '@app/core/utils/api'
import { useRouter } from 'expo-router'
import { getAvatarUrl } from '@app/core/utils/supabase/storage'
import type { ProfileWidgetProps } from './types'

/**
 * GeneralInfoWidget
 * Displays user's general profile information including name, contact, location, and about
 *
 * @param userId - User ID to display (defaults to current user)
 * @param showEdit - Show edit button for own profile
 * @param variant - Display variant (compact or full)
 */
export function GeneralInfoWidget({
  userId,
  showEdit = false,
  variant = 'full',
}: ProfileWidgetProps) {
  const router = useRouter()
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = api.profile.widgets.getGeneralInfo.useQuery(
    { userId },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )

  if (isLoading) {
    return (
      <DashboardWidget>
        <LoadingState message="Loading profile..." />
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <YStack gap="$4" items="center" py="$8">
          <Text color="$red10">Failed to load profile information</Text>
          <Text color="$color11" fontSize="$2">
            {error.message}
          </Text>
          <Button
            variant="primary"
            size="small"
            onPress={() => {
              void refetch()
            }}
            disabled={isFetching}
          >
            Retry
          </Button>
        </YStack>
      </DashboardWidget>
    )
  }

  if (!data) {
    return (
      <DashboardWidget>
        <YStack gap="$4" items="center" py="$8">
          <Text color="$color11">No profile data available</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  const displayName =
    data.display_name ||
    (data.privateData?.first_name && data.privateData?.last_name
      ? `${data.privateData.first_name} ${data.privateData.last_name}`
      : data.username)

  const showPrivateInfo = !!data.privateData

  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        {/* Header */}
        <XStack justify="space-between" items="center">
          <Heading variant="h4">General Information</Heading>
          {showEdit && (
            <Button
              variant="outlined"
              size="small"
              onPress={() => router.push('/dashboard/profile/general')}
            >
              Edit
            </Button>
          )}
        </XStack>

        {/* Avatar & Name Section */}
        <YStack gap="$3" items="center">
          <Avatar circular size="$10">
            <Avatar.Image
              source={{ uri: getAvatarUrl(data.avatar_path) || data.avatar_url || '' }}
            />
            <Avatar.Fallback backgroundColor="$color6" />
          </Avatar>

          <YStack gap="$1" items="center">
            <Text fontSize="$6" fontWeight="600">
              {displayName}
            </Text>
            {data.headline && (
              <YStack items="center" maxW="100%">
                <Text color="$color11" fontSize="$3">
                  {data.headline}
                </Text>
              </YStack>
            )}
            {data.username && (
              <Text color="$color10" fontSize="$2">
                @{data.username}
              </Text>
            )}
          </YStack>

          {/* Status Badges */}
          {data.open_to_work && (
            <XStack
              bg="$blue2"
              px="$3"
              py="$1.5"
              rounded="$10"
              borderWidth={1}
              borderColor="$blue7"
            >
              <Text color="$blue11" fontSize="$2" fontWeight="600">
                Open to Work
              </Text>
            </XStack>
          )}
        </YStack>

        {/* About Section */}
        {data.about && variant === 'full' && (
          <YStack gap="$2">
            <Text fontWeight="600" fontSize="$3">
              About
            </Text>
            <Text color="$color11" fontSize="$3" lineHeight="$3">
              {data.about}
            </Text>
          </YStack>
        )}

        {/* Contact Information (Private - only for own profile) */}
        {showPrivateInfo && data.privateData && variant === 'full' && (
          <YStack gap="$3">
            <Text fontWeight="600" fontSize="$3">
              Contact Information
            </Text>

            {data.privateData.email && (
              <YStack gap="$1">
                <Text fontSize="$2" color="$color10">
                  Email
                </Text>
                <Text fontSize="$3">{data.privateData.email}</Text>
              </YStack>
            )}

            {data.privateData.phone && (
              <YStack gap="$1">
                <Text fontSize="$2" color="$color10">
                  Phone
                </Text>
                <Text fontSize="$3">{data.privateData.phone}</Text>
              </YStack>
            )}

            {data.privateData.location && (
              <YStack gap="$1">
                <Text fontSize="$2" color="$color10">
                  Location
                </Text>
                <Text fontSize="$3">{data.privateData.location}</Text>
              </YStack>
            )}
          </YStack>
        )}

        {/* Professional Details */}
        {variant === 'full' && (
          <YStack gap="$3">
            <Text fontWeight="600" fontSize="$3">
              Professional Details
            </Text>

            <XStack gap="$4" flexWrap="wrap">
              {data.years_of_experience !== null && data.years_of_experience !== undefined && (
                <YStack gap="$1" flex={1} minW={120}>
                  <Text fontSize="$2" color="$color10">
                    Experience
                  </Text>
                  <Text fontSize="$3">
                    {data.years_of_experience} {data.years_of_experience === 1 ? 'year' : 'years'}
                  </Text>
                </YStack>
              )}

              {data.industries && (
                <YStack gap="$1" flex={1} minW={120}>
                  <Text fontSize="$2" color="$color10">
                    Industry
                  </Text>
                  <Text fontSize="$3">{data.industries.name}</Text>
                </YStack>
              )}
            </XStack>
          </YStack>
        )}
      </YStack>
    </DashboardWidget>
  )
}
