import { ROUTES } from '@scf/core/constants/routes'
import { useCurrentUser } from '@scf/core/utils/profile-general-sdk-hooks'
import {
  useGeneralInfoWidget,
  useExperienceWidget,
  useSkillsWidget,
  useCertificationsWidget,
  useEducationWidget,
} from '@scf/core/utils/profile-widgets-sdk-hooks'
import { openPublicProfileInNewTab } from '@scf/core/utils/publicProfileUrl'
import { getAvatarUrl } from '@scf/core/utils/supabase/storage'
import type { ScaffaldError } from '@scaffald/sdk'
import {
  Avatar,
  Button,
  DashboardWidget,
  ProgressBarBase,
  Row,
  Skeleton,
  SkeletonAvatar,
  SkeletonGroup,
  SkeletonText,
  Stack,
  Text,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { ScrollView } from 'react-native'

function calculateCompletion(
  generalInfo: Record<string, unknown> | null,
  experience: unknown[] | undefined,
  education: unknown[] | undefined,
  skills: unknown[] | undefined,
  certifications: unknown[] | undefined
): number {
  if (!generalInfo) return 0
  let completed = 0
  const total = 7
  if (generalInfo.about) completed++
  if (generalInfo.headline) completed++
  if (generalInfo.years_of_experience !== null && generalInfo.years_of_experience !== undefined) completed++
  if (experience && experience.length > 0) completed++
  if (education && education.length > 0) completed++
  if (skills && skills.length > 0) completed++
  if (certifications && certifications.length > 0) completed++
  return Math.round((completed / total) * 100)
}

function getCompletionLabel(pct: number): string {
  if (pct >= 80) return 'Advanced'
  if (pct >= 50) return 'Intermediate'
  return 'Beginner'
}

export function ProfileIdentityWidget() {
  const { theme } = useThemeContext()
  const router = useRouter()
  const { data: user } = useCurrentUser()

  const { data: generalInfo, isLoading: loadingGeneral, isError: generalInfoError, error: generalInfoErr, refetch: refetchGeneral } =
    useGeneralInfoWidget({ userId: user?.id }, { enabled: !!user?.id, staleTime: 5 * 60 * 1000 })
  const { data: experience, isLoading: loadingExperience } =
    useExperienceWidget({ userId: user?.id }, { enabled: !!user?.id, staleTime: 5 * 60 * 1000 })
  const { data: skills, isLoading: loadingSkills } =
    useSkillsWidget({ userId: user?.id }, { enabled: !!user?.id, staleTime: 5 * 60 * 1000 })
  const { data: certifications, isLoading: loadingCerts } =
    useCertificationsWidget({ userId: user?.id }, { enabled: !!user?.id, staleTime: 5 * 60 * 1000 })
  const { data: education, isLoading: loadingEducation } =
    useEducationWidget({ userId: user?.id }, { enabled: !!user?.id, staleTime: 5 * 60 * 1000 })

  const isLoading = loadingGeneral || loadingExperience || loadingSkills || loadingCerts || loadingEducation

  // Loading skeleton
  if (isLoading) {
    return (
      <DashboardWidget>
        <SkeletonGroup gap={24} animation="wave">
          <Row gap={16} align="flex-start">
            <SkeletonAvatar size={80} animation="wave" />
            <Stack gap={8} flex={1}>
              <SkeletonText lines={2} lastLineWidth="60%" animation="wave" />
              <Row gap={8}>
                <Skeleton width={80} height={28} borderRadius={12} />
                <Skeleton width={100} height={28} borderRadius={12} />
              </Row>
            </Stack>
          </Row>
          <Stack gap={8}>
            <Row justify="space-between">
              <Skeleton width={120} height={16} />
              <Skeleton width={80} height={16} />
            </Row>
            <Skeleton height={12} width="100%" borderRadius={99} />
          </Stack>
          <Row gap={12} wrap>
            <Skeleton width={120} height={36} borderRadius={12} />
            <Skeleton width={140} height={36} borderRadius={12} />
            <Skeleton width={110} height={36} borderRadius={12} />
          </Row>
        </SkeletonGroup>
      </DashboardWidget>
    )
  }

  // Error state
  const isProfileNotFound =
    generalInfoError && generalInfoErr && (generalInfoErr as ScaffaldError).statusCode === 404

  if (generalInfoError && !generalInfo) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={24}>
          {isProfileNotFound ? (
            <>
              <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
                Complete your profile to get started
              </Text>
              <Button variant="filled" color="primary" onPress={() => router.push(ROUTES.PROFILE.path)}>
                Complete Profile
              </Button>
            </>
          ) : (
            <>
              <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
                We couldn't load your profile. Try again.
              </Text>
              <Button variant="filled" color="primary" size="sm" onPress={() => refetchGeneral()}>
                Retry
              </Button>
            </>
          )}
        </Stack>
      </DashboardWidget>
    )
  }

  if (!generalInfo) {
    return (
      <DashboardWidget>
        <Stack gap={16} align="center" paddingVertical={24}>
          <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
            Complete your profile to get started
          </Text>
          <Button variant="filled" color="primary" onPress={() => router.push(ROUTES.PROFILE.path)}>
            Complete Profile
          </Button>
        </Stack>
      </DashboardWidget>
    )
  }

  const displayName =
    generalInfo.display_name ||
    (generalInfo.privateData?.first_name && generalInfo.privateData?.last_name
      ? `${generalInfo.privateData.first_name} ${generalInfo.privateData.last_name}`
      : generalInfo.username)

  const completion = calculateCompletion(
    generalInfo as unknown as Record<string, unknown>,
    experience as unknown[] | undefined,
    education as unknown[] | undefined,
    skills as unknown[] | undefined,
    certifications as unknown[] | undefined
  )

  const completionLabel = getCompletionLabel(completion)
  const badgeColor = completion >= 80
    ? { bg: colors.emerald[100], text: colors.emerald[700] }
    : completion >= 50
      ? { bg: colors.indigo[50], text: colors.indigo[700] }
      : { bg: colors.amber[100], text: colors.amber[700] }

  return (
    <DashboardWidget>
      <Stack gap={32}>
        {/* Identity Section */}
        <Row gap={16} align="flex-start" wrap>
          {/* Avatar */}
          <Avatar
            size={80}
            src={getAvatarUrl(generalInfo.avatar_path) || generalInfo.avatar_url || undefined}
            initials={
              displayName
                ?.split(/\s+/)
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) ?? ''
            }
            color="gray"
          />
          <Stack gap={12} flex={1} minWidth={200}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.text[theme].primary,
              }}
            >
              {displayName}
            </Text>

            {/* Action links */}
            <Row gap={16}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.primary[700],
                }}
                onPress={() => router.push(ROUTES.PROFILE.path)}
              >
                Edit profile
              </Text>
              {generalInfo.slug ? (
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.primary[600],
                    opacity: 0.8,
                  }}
                  onPress={() => {
                    const s = generalInfo.slug
                    if (s) openPublicProfileInNewTab(s)
                  }}
                >
                  View Profile
                </Text>
              ) : null}
            </Row>

          </Stack>
        </Row>

        {/* Profile Strength Section */}
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
            <Row gap={8} align="center">
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: colors.text[theme].primary,
                }}
              >
                Profile Strength
              </Text>
              <Stack
                paddingHorizontal={8}
                paddingVertical={2}
                borderRadius={6}
                style={{ backgroundColor: badgeColor.bg }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: badgeColor.text,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {completionLabel}
                </Text>
              </Stack>
            </Row>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: colors.emerald[700],
              }}
            >
              {completion}% Complete
            </Text>
          </Row>

          <ProgressBarBase value={completion} color="primary" />

          {/* Action CTAs — scrollable row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {(!certifications || certifications.length === 0) && (
              <Button
                variant="outline"
                color="gray"
                size="sm"
                onPress={() => router.push(ROUTES.PROFILE.CERTIFICATIONS.path)}
              >
                Add Certification
              </Button>
            )}
            {(!experience || experience.length === 0) && (
              <Button
                variant="outline"
                color="gray"
                size="sm"
                onPress={() => router.push(ROUTES.PROFILE.EMPLOYMENT.path)}
              >
                Update Experience
              </Button>
            )}
            {(!education || education.length === 0) && (
              <Button
                variant="outline"
                color="gray"
                size="sm"
                onPress={() => router.push(ROUTES.PROFILE.path)}
              >
                Add Education
              </Button>
            )}
            <Button
              variant="outline"
              color="gray"
              size="sm"
              onPress={() => router.push(ROUTES.PROFILE.ID_VERIFICATION.path)}
            >
              Get Verified
            </Button>
            <Button
              variant="outline"
              color="gray"
              size="sm"
              onPress={() => router.push(ROUTES.PROFILE.BACKGROUND_CHECK.path)}
            >
              Background Check
            </Button>
          </ScrollView>
        </Stack>
      </Stack>
    </DashboardWidget>
  )
}
