import { ConnectionFollowButtonsInline } from '@scf/core/features/connections/components/ConnectionFollowButtonsInline'
import { IdVerificationBadge } from '@scf/core/features/id-verification'
import { ReviewWizard } from '@scf/core/features/reviews/components/ReviewWizard'
import { useGeneralInfoWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import { useUserProfile } from '@scf/core/utils/user-profiles-sdk-hooks'
import { useUser } from '@scf/core/utils/useUser'
import { openPublicProfileInNewTab } from '@scf/core/utils/publicProfileUrl'
import { getAvatarUrl } from '@scf/core/utils/supabase/storage'
import { getInitials } from '@scf/core/features/discover/utils/getInitials'
import {
  Avatar,
  Button,
  DashboardWidget,
  H3,
  ResponsiveModal,
  Skeleton,
  SkeletonAvatar,
  SkeletonBox,
  SkeletonGroup,
  SkeletonText,
  Text,
  Row,
  Stack,
  useResponsive,
  useThemeContext,
} from '@scaffald/ui'
import { MessageSquarePlus } from 'lucide-react-native'
import { useState } from 'react'
import { colors } from '@scaffald/ui/tokens'
import { workerPalette } from '@scf/core/components/ui/styles'
import { Pill } from '@scf/core/components/ui/CardPrimitives'
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
  showEdit = false,
  showButtons = false,
  isOwnProfile = false,
}: GeneralInfoWidgetProps) {
  const [showReviewModal, setShowReviewModal] = useState(false)
  const { theme } = useThemeContext()
  const { isMobile } = useResponsive()
  const t = theme === 'dark' ? 'dark' : ('light' as const)
  const pal = workerPalette[t]
  const { user: currentUser } = useUser()
  const { data, isLoading, error, refetch, isFetching } = useGeneralInfoWidget(
    { userId },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  )
  // Call unconditionally so hook order is stable (needed for review modal when showButtons is true)
  const { data: profile } = useUserProfile(userId, {
    enabled: showButtons,
  })

  if (isLoading) {
    return (
      <DashboardWidget>
        <SkeletonGroup gap={12} animation="wave">
          <Stack gap={12} align="center">
            <SkeletonAvatar size={40} />
            <Skeleton width={160} height={16} shape="text" />
            <Skeleton width={120} height={14} shape="text" />
            <SkeletonBox width={100} height={28} borderRadius={99} />
          </Stack>
          <Stack gap={12}>
            <Skeleton width={60} height={14} shape="text" />
            <SkeletonText lines={3} lastLineWidth="80%" />
          </Stack>
          <Stack gap={8}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Stack key={i} gap={4}>
                <Skeleton width="30%" height={12} shape="text" />
                <Skeleton width="100%" height={14} shape="text" />
              </Stack>
            ))}
          </Stack>
        </SkeletonGroup>
      </DashboardWidget>
    )
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: colors.fg[theme].error }}>Failed to load profile information</Text>
          <Text style={{ color: colors.text[theme].secondary }}>{error.message}</Text>
          <Button
            variant="filled"
            color="primary"
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
          <Text style={{ color: colors.text[theme].secondary }}>No profile data available</Text>
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

  // Treat the viewed profile as "self" when it's the current user's, even if the
  // caller didn't pass isOwnProfile (e.g. the profile overview passes only userId).
  const isSelf = isOwnProfile || (!!currentUser?.id && currentUser.id === userId)

  // Trade · location · years, the prototype's facts line. Location is private
  // data, so it appears only where privateData does (the owner's own view).
  const yearsValue =
    typeof data.calculatedYearsOfExperience === 'number'
      ? data.calculatedYearsOfExperience
      : data.years_of_experience
  const years =
    typeof yearsValue === 'number' && !Number.isNaN(yearsValue) && yearsValue > 0
      ? Number.isInteger(yearsValue)
        ? yearsValue
        : Number(yearsValue.toFixed(1))
      : null
  const facts = [
    data.industries?.name,
    data.privateData?.location,
    years !== null ? `${years} ${years === 1 ? 'year' : 'years'} in the trade` : null,
  ].filter((fact): fact is string => !!fact)

  // Only show "Add Review" button if viewing someone else's profile
  const canLeaveReview = showButtons && !isSelf

  const handleLeaveReview = () => {
    setShowReviewModal(true)
  }

  const handleCloseReview = () => {
    setShowReviewModal(false)
  }

  const handleReviewComplete = async (_reviewId: string) => {
    setShowReviewModal(false)
  }

  return (
    <>
      <DashboardWidget>
        <Stack gap={12}>
          {/* One identity block (#1034): avatar beside name, headline, a
              facts line and the badges, with the actions on the same row —
              the prototype's shape. It was a centred avatar alone in a card,
              actions floating above it, and "Professional Details" further
              down repeating the years and the industry as loose label/value
              pairs; those two facts are on the facts line now. */}
          {/* Side by side from tablet up; stacked on a phone, where a wrapping
              row squeezed the name column to a few characters a line. */}
          <Stack gap={16} style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start' }}>
            <Avatar
              size={64}
              src={getAvatarUrl(data.avatar_path) || data.avatar_url || ''}
              // slice(0, 2) rendered "MA" for "Marcus Rivera" — use the shared
              // helper so every surface shows first+last initials (#384).
              initials={displayName ? getInitials(displayName) : undefined}
            />

            <Stack gap={6} style={isMobile ? undefined : { flex: 1, minWidth: 0 }}>
              <H3 style={{ color: colors.text[theme].primary }}>{displayName}</H3>
              {data.headline ? (
                <Text style={{ color: colors.text[theme].secondary }}>{data.headline}</Text>
              ) : null}
              {facts.length > 0 ? (
                <Text style={{ color: colors.text[theme].primary }}>{facts.join(' · ')}</Text>
              ) : null}
              {badge || data.open_to_work ? (
                <Row gap={8} align="center" wrap>
                  {badge && (
                    <IdVerificationBadge
                      status={badge.badge_status as 'active' | 'expired' | 'revoked' | null}
                      badgeExpiresAt={badge.badge_expires_at ?? undefined}
                      size="sm"
                      muted={false}
                    />
                  )}
                  {data.open_to_work && (
                    <Pill label="Open to Work" bgColor={pal.pillBg} textColor={pal.pillText} />
                  )}
                </Row>
              ) : null}
            </Stack>

            {showButtons || (showEdit && data.slug) ? (
              <Row gap={8} wrap>
                {showEdit && data.slug ? (
                  <Button
                    size="sm"
                    variant="outline"
                    color="primary"
                    onPress={() => {
                      const s = data.slug
                      if (s) openPublicProfileInNewTab(s)
                    }}
                  >
                    <Text>View public profile</Text>
                  </Button>
                ) : null}
                <ConnectionFollowButtonsInline targetUserId={userId || ''} isOwnProfile={isSelf} />
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
            ) : null}
          </Stack>

          {/* About Section */}
          {data.about && variant === 'full' && (
            <Stack gap={8}>
              <H3 style={{ color: colors.text[theme].primary }}>About</H3>
              <Text style={{ color: colors.text[theme].secondary, lineHeight: 20 }}>
                {data.about}
              </Text>
            </Stack>
          )}

          {/* Contact Information (Private - only for own profile) */}
          {showPrivateInfo && data.privateData && variant === 'full' && (
            <Stack gap={12}>
              <H3 style={{ color: colors.text[theme].primary }}>Contact information</H3>

              {data.privateData.email && (
                <Stack gap={4}>
                  <Text style={{ color: colors.text[theme].secondary }}>Email</Text>
                  <Text>{data.privateData.email}</Text>
                </Stack>
              )}

              {data.privateData.phone && (
                <Stack gap={4}>
                  <Text style={{ color: colors.text[theme].secondary }}>Phone</Text>
                  <Text>{data.privateData.phone}</Text>
                </Stack>
              )}

              {data.privateData.location && (
                <Stack gap={4}>
                  <Text style={{ color: colors.text[theme].secondary }}>Location</Text>
                  <Text>{data.privateData.location}</Text>
                </Stack>
              )}
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
