import {
  useGeneralInfoWidget,
  useExperienceWidget,
  useSkillsWidget,
  useCertificationsWidget,
  useEducationWidget,
  type SkillWidgetEntry,
} from "@scf/core/utils/profile-widgets-sdk-hooks";
import { useUserProfile } from "@scf/core/utils/user-profiles-sdk-hooks";
import { getAvatarUrl } from "@scf/core/utils/supabase/storage";
import { useUser } from "@scf/core/utils/useUser";
import { DashboardWidget, ResponsiveModal, useThemeContext } from "@scaffald/ui";
import { useState } from "react";
import {
  Avatar,
  H4,
  ProgressBar,
  Spinner,
  Text,
  Row,
  Stack,
} from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { CertificationsWidget } from "../profile/widgets/CertificationsWidget";
import { ExperienceWidget } from "../profile/widgets/ExperienceWidget";
import { SkillsWidget } from "../profile/widgets/SkillsWidget";
import { ReviewWizard } from "../reviews/components/ReviewWizard";
import { UserProfileReviews } from "./user-profile-reviews";

interface UserProfileRightProps {
  userId: string;
}

/**
 * User Profile Right Column
 * Profile snapshot, widgets, and reviews
 */
export function UserProfileRight({ userId }: UserProfileRightProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { user: currentUser } = useUser();
  const { theme } = useThemeContext();
  const t = theme;

  const { data: profile } = useUserProfile(userId);

  // Fetch widget data for snapshot
  const { data: generalInfo, isLoading: loadingGeneral } = useGeneralInfoWidget(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  );

  const { data: experience } = useExperienceWidget(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  );

  const { data: skills } = useSkillsWidget(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  );

  const { data: certifications } = useCertificationsWidget(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  );

  const { data: education } = useEducationWidget(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  );

  // Check if current user can leave a review (not viewing their own profile)
  const canLeaveReview = currentUser?.id !== userId;

  const handleLeaveReview = () => {
    setShowReviewModal(true);
  };

  const handleCloseReview = () => {
    setShowReviewModal(false);
  };

  const handleReviewComplete = (_reviewId: string) => {
    setShowReviewModal(false);
    // Reviews component will automatically refetch when modal closes
  };

  // Calculate profile completion
  const calculateCompletion = (): number => {
    if (!generalInfo) return 0;
    let completed = 0;
    const total = 7;

    if (generalInfo?.about) completed++;
    if (generalInfo?.headline) completed++;
    if (generalInfo?.years_of_experience !== null) completed++;
    if (experience && experience.length > 0) completed++;
    if (education && education.length > 0) completed++;
    if (skills && skills.length > 0) completed++;
    if (certifications && certifications.length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  const completion = calculateCompletion();

  // Get current role from experience
  const currentRole = experience?.find((exp) => exp.is_current);

  // Get top skills
  const topSkills = skills?.slice(0, 5) || [];

  const resolvedYearsOfExperience =
    typeof generalInfo?.calculatedYearsOfExperience === "number"
      ? generalInfo.calculatedYearsOfExperience
      : generalInfo?.years_of_experience ?? 0;

  const formattedYearsOfExperience =
    Number.isFinite(resolvedYearsOfExperience) &&
    resolvedYearsOfExperience % 1 !== 0
      ? resolvedYearsOfExperience.toFixed(1)
      : resolvedYearsOfExperience ?? 0;

  const displayName =
    generalInfo?.display_name ||
    (generalInfo?.privateData?.first_name && generalInfo?.privateData?.last_name
      ? `${generalInfo.privateData.first_name} ${generalInfo.privateData.last_name}`
      : generalInfo?.username);

  return (
    <>
      <Stack gap={16}>
        {/* Profile Snapshot Widget */}
        <DashboardWidget>
          {loadingGeneral ? (
            <Stack gap={16} align="center" paddingVertical={32}>
              <Spinner variant="ios" size="lg" />
              <Text style={{ color: colors.text[t].secondary }}>Loading profile...</Text>
            </Stack>
          ) : generalInfo ? (
            <Stack gap={16}>
              {/* Header */}
              <H4>Profile Overview</H4>

              {/* Avatar & Name Section */}
              <Stack gap={12} align="center">
                <Avatar
                  size={32}
                  src={
                    getAvatarUrl(generalInfo.avatar_path) ||
                    generalInfo.avatar_url ||
                    ""
                  }
                  initials={displayName?.charAt(0) || "?"}
                />

                <Stack gap={4} align="center">
                  <Text>{displayName}</Text>
                  {generalInfo.headline && (
                    <Stack align="center">
                      <Text style={{ color: colors.text[t].secondary }}>
                        {generalInfo.headline}
                      </Text>
                    </Stack>
                  )}
                </Stack>

                {/* Open to Work Badge */}
                {generalInfo.open_to_work && (
                  <Row
                    style={{
                      backgroundColor: t === 'dark' ? colors.green[900] : colors.green[50],
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: t === 'dark' ? colors.green[700] : colors.green[200],
                    }}
                  >
                    <Text style={{ color: t === 'dark' ? colors.green[300] : colors.green[600] }}>Open to Work</Text>
                  </Row>
                )}
              </Stack>

              {/* Current Role */}
              {currentRole && (
                <Stack
                  gap={4}
                  style={{
                    backgroundColor: colors.bg[t].muted,
                    padding: 8,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: colors.text[t].secondary }}>Current Role</Text>
                  <Text>{currentRole.job_title as string}</Text>
                  <Text style={{ color: colors.text[t].secondary }}>
                    {currentRole.company_name as string}
                  </Text>
                </Stack>
              )}

              {/* Stats Grid */}
              <Stack gap={12}>
                <Text>Profile Stats</Text>

                {/* Completion Bar */}
                <Stack gap={8}>
                  <Row justify="space-between">
                    <Text style={{ color: colors.text[t].secondary }}>Completion</Text>
                    <Text>{completion}%</Text>
                  </Row>
                  <ProgressBar value={completion} color="success" />
                </Stack>

                {/* Stats Row */}
                <Row gap={12} wrap>
                  <Stack
                    gap={4}
                    flex={1}
                    minWidth={80}
                    style={{
                      backgroundColor: colors.bg[t].muted,
                      padding: 8,
                      borderRadius: 12,
                    }}
                    align="center"
                  >
                    <Text style={{ color: t === 'dark' ? colors.blue[300] : colors.blue[600] }}>
                      {skills?.length || 0}
                    </Text>
                    <Text style={{ color: colors.text[t].secondary }}>Skills</Text>
                  </Stack>

                  <Stack
                    gap={4}
                    flex={1}
                    minWidth={80}
                    style={{
                      backgroundColor: colors.bg[t].muted,
                      padding: 8,
                      borderRadius: 12,
                    }}
                    align="center"
                  >
                    <Text style={{ color: t === 'dark' ? colors.green[300] : colors.green[600] }}>
                      {certifications?.length || 0}
                    </Text>
                    <Text style={{ color: colors.text[t].secondary }}>Certs</Text>
                  </Stack>

                  <Stack
                    gap={4}
                    flex={1}
                    minWidth={80}
                    style={{
                      backgroundColor: colors.bg[t].muted,
                      padding: 8,
                      borderRadius: 12,
                    }}
                    align="center"
                  >
                    <Text style={{ color: colors.text[t].secondary }}>
                      {formattedYearsOfExperience}
                    </Text>
                    <Text style={{ color: colors.text[t].secondary }}>Years</Text>
                  </Stack>
                </Row>
              </Stack>

              {/* Top Skills Preview */}
              {topSkills.length > 0 && (
                <Stack gap={8}>
                  <Text>Top Skills</Text>
                  <Row gap={8} wrap>
                    {topSkills.map((skill: SkillWidgetEntry) => {
                      const chipLabel =
                        typeof skill.label === "string" &&
                        skill.label.length > 0
                          ? skill.label
                          : skill.displayCode
                          ? `${skill.displayCode} · ${skill.name}`
                          : skill.name;

                      return (
                        <Row
                          key={skill.id}
                          style={{
                            backgroundColor: colors.bg[t].muted,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: skill.verified
                              ? (t === 'dark' ? colors.green[700] : colors.green[200])
                              : colors.border[t].default,
                          }}
                        >
                          {skill.verified && (
                            <Text style={{ color: t === 'dark' ? colors.green[300] : colors.green[600], marginRight: 4 }}>
                              ✓
                            </Text>
                          )}
                          <Text>{chipLabel}</Text>
                        </Row>
                      );
                    })}
                  </Row>
                </Stack>
              )}
            </Stack>
          ) : null}
        </DashboardWidget>

        {/* Skills Widget - Compact View */}
        <SkillsWidget userId={userId} showEdit={false} variant="compact" />

        {/* Certifications Widget - Compact View */}
        <CertificationsWidget
          userId={userId}
          showEdit={false}
          variant="compact"
        />

        {/* Experience Widget - Compact View */}
        <ExperienceWidget userId={userId} showEdit={false} variant="compact" />

        {/* Reviews Widget */}
        <DashboardWidget>
          <UserProfileReviews
            userId={userId}
            onLeaveReview={canLeaveReview ? handleLeaveReview : undefined}
          />
        </DashboardWidget>
      </Stack>

      {/* Review Modal */}
      <ResponsiveModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        title={`Review ${profile?.name || "User"}`}
        size="lg"
      >
        <ReviewWizard
          subjectId={userId}
          subjectName={profile?.name || "this user"}
          onCancel={handleCloseReview}
          onComplete={handleReviewComplete}
        />
      </ResponsiveModal>
    </>
  );
}
