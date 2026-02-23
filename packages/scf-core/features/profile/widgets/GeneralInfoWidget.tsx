import { ConnectionFollowButtonsInline } from '@scf/core/features/connections/components/ConnectionFollowButtonsInline'
import { IdVerificationBadge } from '@scf/core/features/id-verification'
import { ReviewWizard } from '@scf/core/features/reviews/components/ReviewWizard'
import { useGeneralInfoWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import { useUserProfile } from '@scf/core/utils/user-profiles-sdk-hooks'
import { useUser } from '@scf/core/utils/useUser'
import { getAvatarUrl } from '@scf/core/utils/supabase/storage'
import { DashboardWidget, LoadingState, ResponsiveModal, spacing } from '@scaffald/ui'
import { MessageSquarePlus } from 'lucide-react-native'
import { useState } from 'react'
import { Avatar, Button, Text, Row, Stack } from '@scaffald/ui'
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
  const { data, isLoading, error, refetch, isFetching } = useGeneralInfoWidget(
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
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: '#ef4444' }}>Failed to load profile information</Text>
          <Text style={{ color: '#414e62' }}>{error.message}</Text>
          <Button
            variant="filled" color="primary"
            size="sm"
            onPress={() => {
              void refetch()
            }}
            disabled={isFetching}
          >
            Retry
          </Button>
        </Stack>
      </DashboardWidget>
    )
  }

  if (!data) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: '#414e62' }}>No profile data available</Text>
        </Stack>
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
  const { data: profile } = useUserProfile(userId, {
    enabled: showButtons,
  })

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
        <Stack gap={spacing.md}>
          {/* Header with Action Buttons */}
          {showButtons && (
            <Row justify="flex-end" align="center" marginBottom={8}>
              <Row gap={8} wrap justify="flex-end">
                <ConnectionFollowButtonsInline
                  targetUserId={userId || ''}
                  isOwnProfile={isOwnProfile}
                  size="sm"
                />
                {canLeaveReview && (
                  <Button
                    size="sm"
                    color="primary"
                    iconStart={MessageSquarePlus}
                    onPress={handleLeaveReview}
                  >
                    <Text>Add Review</Text>
                  </Button>
                )}
              </Row>
            </Row>
          )}

          {/* Avatar & Name Section */}
          <Stack gap={12} align="center">
            <Avatar
              size={40}
              src={getAvatarUrl(data.avatar_path) || data.avatar_url || ''}
              initials={displayName?.slice(0, 2).toUpperCase()}
            />

            <Stack gap={4} align="center">
              <Text>{displayName}</Text>
              {data.headline && (
                <Stack align="center" maxWidth="100%">
                  <Text style={{ color: '#414e62' }}>{data.headline}</Text>
                </Stack>
              )}
              {data.username && <Text style={{ color: '#414e62' }}>@{data.username}</Text>}
              {badge && (
                <IdVerificationBadge
                  status={badge.badge_status as 'active' | 'expired' | 'revoked' | null}
                  badgeExpiresAt={badge.badge_expires_at ?? undefined}
                  size="sm"
                  muted={false}
                />
              )}
            </Stack>

            {/* Status Badges */}
            {data.open_to_work && (
              <Row
                backgroundColor="#eff6ff"
                paddingHorizontal={12}
                paddingVertical={6}
                borderRadius={999}
                borderWidth={1}
                borderColor="#93c5fd"
              >
                <Text style={{ color: '#1d4ed8' }}>Open to Work</Text>
              </Row>
            )}
          </Stack>

          {/* About Section */}
          {data.about && variant === 'full' && (
            <Stack gap={8}>
              <Text>About</Text>
              <Text style={{ color: '#414e62', lineHeight: 12 }}>
                {data.about}
              </Text>
            </Stack>
          )}

          {/* Contact Information (Private - only for own profile) */}
          {showPrivateInfo && data.privateData && variant === 'full' && (
            <Stack gap={12}>
              <Text>Contact Information</Text>

              {data.privateData.email && (
                <Stack gap={4}>
                  <Text style={{ color: '#414e62' }}>Email</Text>
                  <Text>{data.privateData.email}</Text>
                </Stack>
              )}

              {data.privateData.phone && (
                <Stack gap={4}>
                  <Text style={{ color: '#414e62' }}>Phone</Text>
                  <Text>{data.privateData.phone}</Text>
                </Stack>
              )}

              {data.privateData.location && (
                <Stack gap={4}>
                  <Text style={{ color: '#414e62' }}>Location</Text>
                  <Text>{data.privateData.location}</Text>
                </Stack>
              )}
            </Stack>
          )}

          {/* Professional Details */}
          {variant === 'full' && (
            <Stack gap={12}>
              <Text>Professional Details</Text>

              <Row gap={16} wrap>
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
                    <Stack gap={4} flex={1} minWidth={120}>
                      <Text style={{ color: '#414e62' }}>Experience</Text>
                      <Text>
                        {formattedYears} {Number(formattedYears) === 1 ? 'year' : 'years'}
                      </Text>
                    </Stack>
                  )
                })()}

                {data.industries && (
                  <Stack gap={4} flex={1} minWidth={120}>
                    <Text style={{ color: '#414e62' }}>Industry</Text>
                    <Text>{data.industries.name}</Text>
                  </Stack>
                )}
              </Row>
            </Stack>
          )}
        </Stack>
      </DashboardWidget>

      {/* Review Modal */}
      {canLeaveReview && (
        <ResponsiveModal
          open={showReviewModal}
          onOpenChange={setShowReviewModal}
          title={`Review ${profile?.name || 'User'}`}
          size="lg"
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
