import { ROUTES } from "@scf/core/constants/routes";
import { useCurrentUser } from "@scf/core/utils/profile-general-sdk-hooks";
import { openPublicProfileInNewTab } from "@scf/core/utils/publicProfileUrl";
import {
  useGeneralInfoWidget,
  useExperienceWidget,
  useCertificationsWidget,
  useEducationWidget,
} from "@scf/core/utils/profile-widgets-sdk-hooks";
import { getAvatarUrl } from "@scf/core/utils/supabase/storage";
import type { ScaffaldError } from "@scaffald/sdk";
import {
  Avatar,
  Button,
  DashboardWidget,
  ProgressBarBase,
  Row,
  Skeleton,
  SkeletonAvatar,
  SkeletonGroup,
  Stack,
  Text,
  useThemeContext,
} from "@scaffald/ui";
import { colors } from "@scaffald/ui/tokens";
import { useRouter } from "expo-router";

/**
 * ProfileSnapshotWidget
 * Profile identity + profile strength card for dashboard.
 * Horizontal avatar layout with action CTAs and completion bar.
 * Aligned with Stitch "Professional Profile" comp.
 */
export function ProfileSnapshotWidget() {
  const { theme } = useThemeContext();
  const router = useRouter();
  const { data: user } = useCurrentUser();

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
    loadingCerts ||
    loadingEducation;

  const isProfileNotFound =
    generalInfoError &&
    generalInfoErr &&
    (generalInfoErr as ScaffaldError).statusCode === 404;

  // Shimmer loading state
  if (isLoading) {
    return (
      <DashboardWidget gap={32}>
        <SkeletonGroup gap={24} animation="wave">
          <Row gap={16} align="center">
            <SkeletonAvatar size={80} animation="wave" />
            <Stack gap={8} flex={1}>
              <Skeleton width={160} height={20} borderRadius={4} />
              <Row gap={12}>
                <Skeleton width={70} height={14} borderRadius={4} />
                <Skeleton width={80} height={14} borderRadius={4} />
              </Row>
              <Row gap={8}>
                <Skeleton width={100} height={28} borderRadius={8} />
                <Skeleton width={120} height={28} borderRadius={8} />
              </Row>
            </Stack>
          </Row>
          <Stack
            gap={16}
            padding={16}
            borderRadius={16}
            style={{ backgroundColor: colors.bg[theme].muted }}
          >
            <Row justify="space-between">
              <Skeleton width={100} height={16} />
              <Skeleton width={80} height={16} />
            </Row>
            <Skeleton height={12} width="100%" borderRadius={99} />
            <Row gap={12}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} width={120} height={36} borderRadius={12} />
              ))}
            </Row>
          </Stack>
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
    const total = 6;
    if (generalInfo?.about) completed++;
    if (generalInfo?.headline) completed++;
    if (generalInfo?.years_of_experience !== null) completed++;
    if (experience && experience.length > 0) completed++;
    if (education && education.length > 0) completed++;
    if (certifications && certifications.length > 0) completed++;
    return Math.round((completed / total) * 100);
  };

  const completion = calculateCompletion();

  const displayName =
    generalInfo.display_name ||
    (generalInfo.privateData?.first_name && generalInfo.privateData?.last_name
      ? `${generalInfo.privateData.first_name} ${generalInfo.privateData.last_name}`
      : generalInfo.username);

  const strengthLabel =
    completion >= 80 ? "Advanced" : completion >= 40 ? "Intermediate" : "Beginner";

  const hasCerts = certifications && certifications.length > 0;
  const hasExperience = experience && experience.length > 0;
  const hasEducation = education && education.length > 0;

  return (
    <DashboardWidget gap={32}>
      {/* Identity Row — horizontal: avatar left, name + CTAs right */}
      <Row gap={16} align="flex-start">
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
        <Stack gap={8} flex={1}>
          <Text
            style={{
              fontWeight: "700",
              fontSize: 18,
              color: colors.text[theme].primary,
              lineHeight: 22,
            }}
          >
            {displayName}
          </Text>

          {/* Secondary text links */}
          <Row gap={16}>
            <Button
              size="sm"
              variant="text"
              color="primary"
              onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.path)}
            >
              Edit profile
            </Button>
            {generalInfo.slug ? (
              <Button
                size="sm"
                variant="text"
                color="primary"
                onPress={() => {
                  const s = generalInfo.slug;
                  if (s) openPublicProfileInNewTab(s);
                }}
              >
                View Profile
              </Button>
            ) : null}
          </Row>

        </Stack>
      </Row>

      {/* Profile Strength */}
      <Stack
        gap={16}
        padding={16}
        borderRadius={16}
        style={{
          backgroundColor: colors.bg[theme].subtle,
          borderWidth: 1,
          borderColor: colors.border[theme].ghost,
        }}
      >
        <Row justify="space-between" align="center">
          <Row align="center" gap={8}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: colors.text[theme].primary,
              }}
            >
              Profile Strength
            </Text>
            <Stack
              paddingHorizontal={8}
              paddingVertical={2}
              borderRadius={6}
              style={{ backgroundColor: colors.indigo[50] }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  color: colors.indigo[700],
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {strengthLabel}
              </Text>
            </Stack>
          </Row>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: colors.primary[600],
            }}
          >
            {completion}% Complete
          </Text>
        </Row>

        <ProgressBarBase value={completion} color="primary" />

        {/* Actions */}
        <Row gap={12} wrap>
          {!hasCerts && (
            <Button
              variant="outline"
              color="gray"
              size="sm"
              onPress={() =>
                router.push(ROUTES.DASHBOARD.PROFILE.path)
              }
            >
              Add Certification
            </Button>
          )}
          {!hasExperience && (
            <Button
              variant="outline"
              color="gray"
              size="sm"
              onPress={() =>
                router.push(ROUTES.DASHBOARD.PROFILE.path)
              }
            >
              Update Experience
            </Button>
          )}
          {!hasEducation && (
            <Button
              variant="outline"
              color="gray"
              size="sm"
              onPress={() =>
                router.push(ROUTES.DASHBOARD.PROFILE.path)
              }
            >
              Add Education
            </Button>
          )}
          <Button variant="outline" color="gray" size="sm">
            Get Verified
          </Button>
          <Button variant="outline" color="gray" size="sm">
            Background Check
          </Button>
        </Row>
      </Stack>
    </DashboardWidget>
  );
}
