import { ConnectionFollowButtonsInline } from '@app/core/features/connections/components/ConnectionFollowButtonsInline'
import { IdVerificationBadge } from '@app/core/features/id-verification'
import { ReviewWizard } from '@app/core/features/reviews/components/ReviewWizard'
import { api } from '@app/core/utils/api'
import { useUser } from '@app/core/utils/useUser'
import { getAvatarUrl } from '@app/core/utils/supabase/storage'
import {
  DashboardWidget,
  LoadingState,
  ResponsiveModal,
  spacing,
  UIButton,
} from '@scaffald/neue-ui'
import { MessageSquarePlus } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Avatar, Button, Text, XStack, YStack } from 'tamagui'
import type { ProfileWidgetProps } from './types'

interface GeneralInfoWidgetProps extends ProfileWidgetProps {
  /** Show connection/follow buttons in header (for viewing other users' profiles) */
  showButtons?: boolean
  /** Whether this is the current user's own profile */
  isOwnProfile?: boolean
}

/**
 * GeneralInfoWidget
 * Displays user's general profile information including name, contact, location, and about
 *
 * @param userId - User ID to display (defaults to current user)
 * @param showEdit - Show edit button for own profile
 * @param variant - Display variant (compact or full)
 * @param showButtons - Show connection/follow/review buttons in header
 * @param isOwnProfile - Whether this is the current user's own profile
 */
export function GeneralInfoWidget({
  userId,
  variant = 'full',
  showButtons = false,
  isOwnProfile = false,
}: GeneralInfoWidgetProps) {
  const [showReviewModal, setShowReviewModal] = useState(false)
  const { user: currentUser } = useUser()
  const { data, isLoading, error, refetch, isFetching } =
    api.profile.widgets.getGeneralInfo.useQuery(
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
          <UIButton
            variant="primary"
            size="$2"
            onPress={() => {
              void refetch()
            }}
            disabled={isFetching}
          >
            Retry
          </UIButton>
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
  const badge = data.idVerificationBadge

  // Fetch profile data for review modal
  const { data: profile } = api.userProfile.getUserProfile.useQuery(
    { userId: userId || '' },
    { enabled: !!userId && showButtons }
  )

  // Only show "Add Review" button if viewing someone else's profile
  const canLeaveReview = showButtons && !isOwnProfile && currentUser?.id !== userId

  const handleLeaveReview = () => {
    setShowReviewModal(true)
  }

  const handleCloseReview = () => {
    setShowReviewModal(false)
  }

  const handleReviewComplete = async () => {
    setShowReviewModal(false)
  }

  return (
    <>
      <DashboardWidget>
        <YStack gap={spacing.md}>
          {/* Header with Action Buttons */}
          {showButtons && (
            <XStack justify="flex-end" items="center" mb="$2">
              <XStack gap="$2" flexWrap="wrap" justify="flex-end">
                <ConnectionFollowButtonsInline
                  targetUserId={userId || ''}
                  isOwnProfile={isOwnProfile}
                  size="$3"
                />
                {canLeaveReview && (
                  <Button
                    size="$3"
                    theme="info"
                    icon={MessageSquarePlus}
                    onPress={handleLeaveReview}
                  >
                    <Text>Add Review</Text>
                  </Button>
                )}
              </XStack>
            </XStack>
          )}

          {/* Avatar & Name Section */}
          <YStack gap="$3" items="center">
            <Avatar circular size="$10">
              <Avatar.Image
                source={{ uri: getAvatarUrl(data.avatar_path) || data.avatar_url || '' }}
              />
              <Avatar.Fallback bg="$color6" />
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
              {badge && (
                <IdVerificationBadge
                  status={badge.badge_status as 'active' | 'expired' | 'revoked' | null}
                  badgeExpiresAt={badge.badge_expires_at ?? undefined}
                  size="sm"
                  muted={false}
                />
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
                {(() => {
                  const yearsValue =
                    typeof data.calculatedYearsOfExperience === 'number'
                      ? data.calculatedYearsOfExperience
                      : data.years_of_experience
                  const formattedYears =
                    typeof yearsValue === 'number' && !Number.isNaN(yearsValue)
                      ? yearsValue % 1 !== 0
                        ? yearsValue.toFixed(1)
                        : yearsValue
                      : null
                  if (formattedYears === null) return null
                  return (
                    <YStack gap="$1" flex={1} minW={120}>
                      <Text fontSize="$2" color="$color10">
                        Experience
                      </Text>
                      <Text fontSize="$3">
                        {formattedYears} {Number(formattedYears) === 1 ? 'year' : 'years'}
                      </Text>
                    </YStack>
                  )
                })()}

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

      {/* Review Modal */}
      {canLeaveReview && (
        <ResponsiveModal
          open={showReviewModal}
          onOpenChange={setShowReviewModal}
          title={`Review ${profile?.name || 'User'}`}
          size="large"
        >
          <ReviewWizard
            subjectId={userId || ''}
            subjectName={profile?.name || 'this user'}
            onCancel={handleCloseReview}
            onComplete={handleReviewComplete}
          />
        </ResponsiveModal>
      )}
    </>
  )
}
