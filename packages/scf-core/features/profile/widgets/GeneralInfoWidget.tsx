import { ConnectionFollowButtonsInline } from "@scf/core/features/connections/components/ConnectionFollowButtonsInline";
import { IdVerificationBadge } from "@scf/core/features/id-verification";
import { ReviewWizard } from "@scf/core/features/reviews/components/ReviewWizard";
import { useGeneralInfoWidget } from "@scf/core/utils/profile-widgets-sdk-hooks";
import { useUserProfile } from "@scf/core/utils/user-profiles-sdk-hooks";
import { useUser } from "@scf/core/utils/useUser";
import { openPublicProfileInNewTab } from "@scf/core/utils/publicProfileUrl";
import { getAvatarUrl } from "@scf/core/utils/supabase/storage";
import {
  Avatar,
  Button,
  DashboardWidget,
  ResponsiveModal,
  Skeleton,
  SkeletonAvatar,
  SkeletonBox,
  SkeletonText,
  Text,
  Row,
  Stack,
  useThemeContext,
} from "@scaffald/ui";
import { MessageSquarePlus } from "lucide-react-native";
import { useState } from "react";
import { colors } from "@scaffald/ui/tokens";
import type { ProfileWidgetProps } from "./types";

interface GeneralInfoWidgetProps extends ProfileWidgetProps {
  /** Show connection/follow buttons in header (for viewing other users' profiles) */
  showButtons?: boolean;
  /** Whether this is the current user's own profile */
  isOwnProfile?: boolean;
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
  variant = "full",
  showEdit = false,
  showButtons = false,
  isOwnProfile = false,
}: GeneralInfoWidgetProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { theme } = useThemeContext();
  const { user: currentUser } = useUser();
  const { data, isLoading, error, refetch, isFetching } = useGeneralInfoWidget(
    { userId },
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );
  // Call unconditionally so hook order is stable (needed for review modal when showButtons is true)
  const { data: profile } = useUserProfile(userId, {
    enabled: showButtons,
  });

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={12} align="center">
          <SkeletonAvatar size={40} />
          <Skeleton width={160} height={16} shape="text" />
          <Skeleton width={120} height={14} shape="text" />
          <SkeletonBox width={100} height={28} borderRadius={99} />
        </Stack>
        <Stack gap={12} style={{ marginTop: 12 }}>
          <Skeleton width={60} height={14} shape="text" />
          <SkeletonText lines={3} lastLineWidth="80%" />
        </Stack>
        <Stack gap={8} style={{ marginTop: 12 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Stack key={i} gap={4}>
              <Skeleton width="30%" height={12} shape="text" />
              <Skeleton width="100%" height={14} shape="text" />
            </Stack>
          ))}
        </Stack>
      </DashboardWidget>
    );
  }

  if (error) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: colors.fg[theme].error }}>
            Failed to load profile information
          </Text>
          <Text style={{ color: colors.text[theme].secondary }}>{error.message}</Text>
          <Button
            variant="filled"
            color="primary"
            size="sm"
            onPress={() => {
              void refetch();
            }}
            disabled={isFetching}
          >
            Retry
          </Button>
        </Stack>
      </DashboardWidget>
    );
  }

  if (!data) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={32}>
          <Text style={{ color: colors.text[theme].secondary }}>No profile data available</Text>
        </Stack>
      </DashboardWidget>
    );
  }

  const displayName =
    data.display_name ||
    (data.privateData?.first_name && data.privateData?.last_name
      ? `${data.privateData.first_name} ${data.privateData.last_name}`
      : data.username);

  const showPrivateInfo = !!data.privateData;
  const badge = data.idVerificationBadge;

  // Only show "Add Review" button if viewing someone else's profile
  const canLeaveReview =
    showButtons && !isOwnProfile && currentUser?.id !== userId;

  const handleLeaveReview = () => {
    setShowReviewModal(true);
  };

  const handleCloseReview = () => {
    setShowReviewModal(false);
  };

  const handleReviewComplete = async (_reviewId: string) => {
    setShowReviewModal(false);
  };

  return (
    <>
      <DashboardWidget>
        <Stack gap={12}>
          {/* Header with Action Buttons */}
          {(showButtons || (showEdit && data.slug)) && (
            <Row justify="flex-end" align="center" marginBottom={8}>
              <Row gap={8} wrap justify="flex-end">
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
                <ConnectionFollowButtonsInline
                  targetUserId={userId || ""}
                  isOwnProfile={isOwnProfile}
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
              src={getAvatarUrl(data.avatar_path) || data.avatar_url || ""}
              initials={displayName ? displayName.slice(0, 2).toUpperCase() : undefined}
            />

            <Stack gap={4} align="center">
              <Text>{displayName}</Text>
              {data.headline && (
                <Stack align="center" maxWidth="100%">
                  <Text style={{ color: colors.text[theme].secondary }}>{data.headline}</Text>
                </Stack>
              )}
              {data.username && (
                <Text style={{ color: colors.text[theme].secondary }}>@{data.username}</Text>
              )}
              {badge && (
                <IdVerificationBadge
                  status={
                    badge.badge_status as
                      | "active"
                      | "expired"
                      | "revoked"
                      | null
                  }
                  badgeExpiresAt={badge.badge_expires_at ?? undefined}
                  size="sm"
                  muted={false}
                />
              )}
            </Stack>

            {/* Status Badges */}
            {data.open_to_work && (
              <Row
                backgroundColor={colors.blue[50]}
                paddingHorizontal={12}
                paddingVertical={6}
                borderRadius={999}
                borderWidth={1}
                borderColor={colors.blue[300]}
              >
                <Text style={{ color: colors.blue[700] }}>Open to Work</Text>
              </Row>
            )}
          </Stack>

          {/* About Section */}
          {data.about && variant === "full" && (
            <Stack gap={8}>
              <Text>About</Text>
              <Text style={{ color: colors.text[theme].secondary, lineHeight: 12 }}>
                {data.about}
              </Text>
            </Stack>
          )}

          {/* Contact Information (Private - only for own profile) */}
          {showPrivateInfo && data.privateData && variant === "full" && (
            <Stack gap={12}>
              <Text>Contact Information</Text>

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

          {/* Professional Details */}
          {variant === "full" && (
            <Stack gap={12}>
              <Text>Professional Details</Text>

              <Row gap={16} wrap>
                {(() => {
                  const yearsValue =
                    typeof data.calculatedYearsOfExperience === "number"
                      ? data.calculatedYearsOfExperience
                      : data.years_of_experience;
                  const formattedYears =
                    typeof yearsValue === "number" && !Number.isNaN(yearsValue)
                      ? yearsValue % 1 !== 0
                        ? yearsValue.toFixed(1)
                        : yearsValue
                      : null;
                  if (formattedYears === null) return null;
                  return (
                    <Stack gap={4} flex={1} minWidth={120}>
                      <Text style={{ color: colors.text[theme].secondary }}>Experience</Text>
                      <Text>
                        {formattedYears}{" "}
                        {Number(formattedYears) === 1 ? "year" : "years"}
                      </Text>
                    </Stack>
                  );
                })()}

                {data.industries && (
                  <Stack gap={4} flex={1} minWidth={120}>
                    <Text style={{ color: colors.text[theme].secondary }}>Industry</Text>
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
          title={`Review ${profile?.name || "User"}`}
          size="lg"
        >
          <ReviewWizard
            subjectId={userId || ""}
            subjectName={profile?.name || "this user"}
            onCancel={handleCloseReview}
            onComplete={handleReviewComplete}
          />
        </ResponsiveModal>
      )}
    </>
  );
}
