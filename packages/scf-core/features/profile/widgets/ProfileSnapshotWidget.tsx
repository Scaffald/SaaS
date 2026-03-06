import { ROUTES } from "@scf/core/constants/routes";
import { useCurrentUser } from "@scf/core/utils/profile-general-sdk-hooks";
import {
  useGeneralInfoWidget,
  useExperienceWidget,
  useSkillsWidget,
  useCertificationsWidget,
  useEducationWidget,
} from "@scf/core/utils/profile-widgets-sdk-hooks";
import { getAvatarUrl } from "@scf/core/utils/supabase/storage";
import type { ScaffaldError } from "@scaffald/sdk";
import {
  Avatar,
  Button,
  DashboardWidget,
  H4,
  ProgressBarBase,
  Row,
  Skeleton,
  SkeletonAvatar,
  SkeletonGroup,
  SkeletonText,
  Stack,
  Text,
  useHoverState,
  useThemeContext,
} from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";

/**
 * ProfileSnapshotWidget
 * Comprehensive profile overview for dashboard.
 * Shows stats, skills preview, and quick actions.
 * Aligned with Stitch "Reimagined Branded Profile Card" design.
 */
export function ProfileSnapshotWidget() {
  const { theme } = useThemeContext();
  const router = useRouter();
  const { data: user } = useCurrentUser();

  const skillsHover = useHoverState();
  const certsHover = useHoverState();
  const yearsHover = useHoverState();

  const {
    data: generalInfo,
    isLoading: loadingGeneral,
    isError: generalInfoError,
    error: generalInfoErr,
    refetch: refetchGeneral,
  } = useGeneralInfoWidget(
    { userId: user?.id },
    { enabled: !!user?.id, staleTime: 5 * 60 * 1000 }
  );

  const { data: experience, isLoading: loadingExperience } =
    useExperienceWidget(
      { userId: user?.id },
      { enabled: !!user?.id, staleTime: 5 * 60 * 1000 }
    );

  const { data: skills, isLoading: loadingSkills } = useSkillsWidget(
    { userId: user?.id },
    { enabled: !!user?.id, staleTime: 5 * 60 * 1000 }
  );

  const { data: certifications, isLoading: loadingCerts } =
    useCertificationsWidget(
      { userId: user?.id },
      { enabled: !!user?.id, staleTime: 5 * 60 * 1000 }
    );

  const { data: education, isLoading: loadingEducation } = useEducationWidget(
    { userId: user?.id },
    { enabled: !!user?.id, staleTime: 5 * 60 * 1000 }
  );

  const isLoading =
    loadingGeneral ||
    loadingExperience ||
    loadingSkills ||
    loadingCerts ||
    loadingEducation;

  const isProfileNotFound =
    generalInfoError &&
    generalInfoErr &&
    (generalInfoErr as ScaffaldError).statusCode === 404;

  // Shimmer loading state (Stitch-aligned structure)
  if (isLoading) {
    return (
      <DashboardWidget>
        <SkeletonGroup gap={24} animation="wave">
          <Row justify="space-between" align="center">
            <Skeleton width={100} height={28} borderRadius={4} />
            <Skeleton width={120} height={20} borderRadius={4} />
          </Row>
          <Stack gap={16} align="center">
            <SkeletonAvatar size={80} animation="wave" />
            <SkeletonText lines={2} lastLineWidth="60%" animation="wave" />
          </Stack>
          <Stack gap={8}>
            <Row justify="space-between">
              <Skeleton width={80} height={16} />
              <Skeleton width={36} height={16} />
            </Row>
            <Skeleton height={10} width="100%" borderRadius={99} />
          </Stack>
          <Row gap={12} wrap>
            {[1, 2, 3].map((i) => (
              <Stack
                key={i}
                gap={4}
                flex={1}
                minWidth={80}
                align="center"
                style={{ padding: 16, backgroundColor: colors.bg[theme].muted, borderRadius: 16 }}
              >
                <Skeleton width={32} height={24} />
                <Skeleton width={48} height={10} />
              </Stack>
            ))}
          </Row>
          <Stack gap={8}>
            <Row justify="space-between">
              <Skeleton width={80} height={14} />
              <Skeleton width={50} height={14} />
            </Row>
            <Row gap={8} wrap>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} width={100} height={28} borderRadius={8} />
              ))}
            </Row>
          </Stack>
          <Skeleton height={44} width="100%" borderRadius={16} />
        </SkeletonGroup>
      </DashboardWidget>
    );
  }

  // Error state: 404 → "Complete your profile" CTA; other errors → message + Retry
  if (generalInfoError && !generalInfo) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={24}>
          {isProfileNotFound ? (
            <>
              <Text style={{ color: colors.text[theme].secondary, textAlign: "center" }}>
                Complete your profile to get started
              </Text>
              <Button
                variant="filled"
                color="primary"
                onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.path)}
              >
                Complete Profile
              </Button>
            </>
          ) : (
            <>
              <Text style={{ color: colors.text[theme].secondary, textAlign: "center" }}>
                We couldn't load your profile. Try again.
              </Text>
              <Button
                variant="filled"
                color="primary"
                size="sm"
                onPress={() => refetchGeneral()}
              >
                Retry
              </Button>
            </>
          )}
        </Stack>
      </DashboardWidget>
    );
  }

  // Empty state (no error but no data)
  if (!generalInfo) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={24}>
          <Text style={{ color: colors.text[theme].secondary, textAlign: "center" }}>
            Complete your profile to get started
          </Text>
          <Button
            variant="filled"
            color="primary"
            onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.path)}
          >
            Complete Profile
          </Button>
        </Stack>
      </DashboardWidget>
    );
  }

  // Calculate profile completion
  const calculateCompletion = (): number => {
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
  const resolvedYearsOfExperience =
    typeof generalInfo.calculatedYearsOfExperience === "number"
      ? generalInfo.calculatedYearsOfExperience
      : generalInfo.years_of_experience ?? 0;
  const formattedYearsOfExperience =
    Number.isFinite(resolvedYearsOfExperience) &&
    resolvedYearsOfExperience % 1 !== 0
      ? resolvedYearsOfExperience.toFixed(1)
      : resolvedYearsOfExperience ?? 0;

  const currentRole = experience?.find((exp) => exp.is_current);
  const topSkills = skills?.slice(0, 5) || [];

  const displayName =
    generalInfo.display_name ||
    (generalInfo.privateData?.first_name && generalInfo.privateData?.last_name
      ? `${generalInfo.privateData.first_name} ${generalInfo.privateData.last_name}`
      : generalInfo.username);

  return (
    <DashboardWidget>
      <Stack gap={24}>
        {/* Header - Stitch: Profile + View Full Profile */}
        <Row justify="space-between" align="center">
          <H4>Profile</H4>
          <Button
            size="sm"
            variant="text"
            color="primary"
            onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.path)}
          >
            View Full Profile
          </Button>
        </Row>

        {/* Avatar & Name - Stitch: centered, larger avatar */}
        <Stack gap={16} align="center">
          <Avatar
            size={80}
            src={
              getAvatarUrl(generalInfo.avatar_path) ||
              generalInfo.avatar_url ||
              undefined
            }
            initials={
              displayName
                ?.split(/\s+/)
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) ?? ""
            }
            color="gray"
          />
          <Stack gap={4} align="center">
            <Text style={{ fontWeight: "700", fontSize: 20 }}>{displayName}</Text>
            {generalInfo.headline && (
              <Text style={{ color: colors.text[theme].secondary }}>
                {generalInfo.headline}
              </Text>
            )}
          </Stack>
          {generalInfo.open_to_work && (
            <Row
              paddingHorizontal={12}
              paddingVertical={6}
              borderRadius={10}
              style={{
                backgroundColor: colors.green[100],
                borderWidth: 1,
                borderColor: colors.green[600],
              }}
            >
              <Text style={{ color: colors.green[800] }}>Open to Work</Text>
            </Row>
          )}
        </Stack>

        {/* Current Role - Stitch: centered label + role + company */}
        {currentRole && (
          <Stack gap={4} align="center" style={{ marginBottom: 8 }}>
            <Text
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontWeight: "700",
                color: colors.text[theme].tertiary,
              }}
            >
              Current Role
            </Text>
            <Text style={{ fontWeight: "700", fontSize: 18 }}>
              {currentRole.job_title}
            </Text>
            <Text style={{ color: colors.text[theme].secondary }}>
              {currentRole.company_name}
            </Text>
          </Stack>
        )}

        {/* Completion + Stats - Stitch: completion bar then 3-col stats */}
        <Stack gap={16}>
          <Stack gap={8}>
            <Row justify="space-between" align="center">
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 14,
                  color: colors.text[theme].primary,
                }}
              >
                Completion
              </Text>
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 14,
                  color: theme === "light" ? colors.blue[700] : colors.blue[300],
                }}
              >
                {completion}%
              </Text>
            </Row>
            <ProgressBarBase value={completion} color="primary" />
          </Stack>
          <Row gap={12} wrap>
            <Pressable
              onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
              {...skillsHover.hoverProps}
              style={({ pressed }) => [
                {
                  flex: 1,
                  minWidth: 80,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor:
                    skillsHover.isHovered || pressed
                      ? colors.bg[theme].active
                      : colors.bg[theme].muted,
                },
                pressed && { opacity: 0.9 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Skills. Navigate to profile skills"
            >
              <Stack gap={4} align="center">
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: colors.text[theme].primary,
                  }}
                >
                  {skills?.length ?? 0}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: colors.text[theme].secondary,
                  }}
                >
                  Skills
                </Text>
              </Stack>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push(ROUTES.DASHBOARD.PROFILE.CERTIFICATIONS.path)
              }
              {...certsHover.hoverProps}
              style={({ pressed }) => [
                {
                  flex: 1,
                  minWidth: 80,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor:
                    certsHover.isHovered || pressed
                      ? colors.bg[theme].active
                      : colors.bg[theme].muted,
                },
                pressed && { opacity: 0.9 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Certifications. Navigate to profile certifications"
            >
              <Stack gap={4} align="center">
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: colors.text[theme].primary,
                  }}
                >
                  {certifications?.length ?? 0}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: colors.text[theme].secondary,
                  }}
                >
                  Certs
                </Text>
              </Stack>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push(ROUTES.DASHBOARD.PROFILE.GENERAL.path)
              }
              {...yearsHover.hoverProps}
              style={({ pressed }) => [
                {
                  flex: 1,
                  minWidth: 80,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor:
                    yearsHover.isHovered || pressed
                      ? colors.bg[theme].active
                      : colors.bg[theme].muted,
                },
                pressed && { opacity: 0.9 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Years of experience. Navigate to profile general"
            >
              <Stack gap={4} align="center">
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: colors.text[theme].primary,
                  }}
                >
                  {formattedYearsOfExperience}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    color: colors.text[theme].secondary,
                  }}
                >
                  Years
                </Text>
              </Stack>
            </Pressable>
          </Row>
        </Stack>

        {/* Top Skills - Stitch: Top Skills + View All, chips */}
        {topSkills.length > 0 && (
          <Stack gap={8}>
            <Row justify="space-between" align="center">
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: colors.text[theme].primary,
                }}
              >
                Top Skills
              </Text>
              <Button
                size="sm"
                variant="text"
                color="primary"
                onPress={() =>
                  router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)
                }
              >
                View All
              </Button>
            </Row>
            <Row gap={8} wrap>
              {topSkills.map((skill) => {
                const displayCode =
                  typeof skill.displayCode === "string"
                    ? skill.displayCode
                    : null;
                const skillName =
                  typeof skill.name === "string" ? skill.name : "Skill";
                const chipLabel =
                  typeof skill.label === "string"
                    ? skill.label
                    : displayCode
                      ? `${displayCode} · ${skillName}`
                      : skillName;
                const isVerified = skill.verified === true;

                return (
                  <Row
                    key={skill.id as string}
                    paddingHorizontal={10}
                    paddingVertical={6}
                    borderRadius={999}
                    style={{
                      backgroundColor: colors.bg[theme].muted,
                      borderWidth: 1,
                      borderColor: isVerified
                        ? colors.green[600]
                        : colors.gray[300],
                    }}
                  >
                    {isVerified && (
                      <Text
                        style={{ color: colors.green[700], marginRight: 4 }}
                      >
                        ✓
                      </Text>
                    )}
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: colors.text[theme].primary,
                      }}
                    >
                      {chipLabel}
                    </Text>
                  </Row>
                );
              })}
            </Row>
          </Stack>
        )}

        {/* Edit Profile CTA - Stitch: full-width button + helper text */}
        <Stack gap={8}>
          <Button
            variant="filled"
            color="primary"
            size="md"
            onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.path)}
            style={{ width: "100%" }}
          >
            Edit Profile
          </Button>
          {completion < 100 && (
            <Text
              style={{
                fontSize: 12,
                color: colors.text[theme].secondary,
                textAlign: "center",
              }}
            >
              Complete your profile to attract more opportunities
            </Text>
          )}
        </Stack>
      </Stack>
    </DashboardWidget>
  );
}
