import { ROUTES } from '@scf/core/constants/routes'
import { useCurrentUser } from '@scf/core/utils/profile-general-sdk-hooks'
import {
  useGeneralInfoWidget,
  useExperienceWidget,
  useSkillsWidget,
  useCertificationsWidget,
  useEducationWidget,
} from '@scf/core/utils/profile-widgets-sdk-hooks'
import { getAvatarUrl } from '@scf/core/utils/supabase/storage'
import { DashboardWidget, spacing } , useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'
import { useRouter } from 'expo-router'
import { Avatar, Button, H4, Progress, Spinner, Text, Row, Stack } , useThemeContext } from '@unicornlove/beyond-ui'

/**
 * ProfileSnapshotWidget
 * Comprehensive profile overview for dashboard
 * Shows stats, skills preview, and quick actions
 */
export function ProfileSnapshotWidget() {
  const { theme } = useThemeContext()
) {
  const router = useRouter()
  const { data: user } = useCurrentUser()

  // Fetch all data needed for snapshot
  const { data: generalInfo, isLoading: loadingGeneral } = useGeneralInfoWidget(
    { userId: user?.id },
    { enabled: !!user?.id, staleTime: 5 * 60 * 1000 }
  )

  const { data: experience, isLoading: loadingExperience } = useExperienceWidget(
    { userId: user?.id },
    { enabled: !!user?.id, staleTime: 5 * 60 * 1000 }
  )

  const { data: skills, isLoading: loadingSkills } = useSkillsWidget(
    { userId: user?.id },
    { enabled: !!user?.id, staleTime: 5 * 60 * 1000 }
  )

  const { data: certifications, isLoading: loadingCerts } = useCertificationsWidget(
    { userId: user?.id },
    { enabled: !!user?.id, staleTime: 5 * 60 * 1000 }
  )

  const { data: education, isLoading: loadingEducation } = useEducationWidget(
    { userId: user?.id },
    { enabled: !!user?.id, staleTime: 5 * 60 * 1000 }
  )

  const isLoading =
    loadingGeneral || loadingExperience || loadingSkills || loadingCerts || loadingEducation

  if (isLoading) {
    return (
      <DashboardWidget>
        <Stack gap={spacing.md} align="center" paddingVertical={spacing['2xl']}>
          <Spinner size="lg" style={{ color: colors.border[theme].info }} />
          <Text style={{ color: colors.text[theme].secondary }}>Loading profile...</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  if (!generalInfo) {
    return (
      <DashboardWidget>
        <Stack gap={spacing.md} align="center" paddingVertical={spacing['2xl']}>
          <Text style={{ color: colors.text[theme].secondary }}>Profile data unavailable</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  // Calculate profile completion
  const calculateCompletion = (): number => {
    let completed = 0
    const total = 7

    if (generalInfo?.about) completed++
    if (generalInfo?.headline) completed++
    if (generalInfo?.years_of_experience !== null) completed++
    if (experience && experience.length > 0) completed++
    if (education && education.length > 0) completed++
    if (skills && skills.length > 0) completed++
    if (certifications && certifications.length > 0) completed++

    return Math.round((completed / total) * 100)
  }

  const completion = calculateCompletion()

  const resolvedYearsOfExperience =
    typeof generalInfo.calculatedYearsOfExperience === 'number'
      ? generalInfo.calculatedYearsOfExperience
      : (generalInfo.years_of_experience ?? 0)

  const formattedYearsOfExperience =
    Number.isFinite(resolvedYearsOfExperience) && resolvedYearsOfExperience % 1 !== 0
      ? resolvedYearsOfExperience.toFixed(1)
      : (resolvedYearsOfExperience ?? 0)

  // Get current role from experience
  const currentRole = experience?.find((exp: Record<string, unknown>) => exp.is_current)

  // Get top skills
  const topSkills = skills?.slice(0, 5) || []

  const displayName =
    generalInfo.display_name ||
    (generalInfo.privateData?.first_name && generalInfo.privateData?.last_name
      ? `${generalInfo.privateData.first_name} ${generalInfo.privateData.last_name}`
      : generalInfo.username)

  return (
    <DashboardWidget>
      <Stack gap={spacing.md}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <H4>Profile</H4>
          <Button
            size="xs"
            chromeless
            style={{ color: colors.border[theme].info }}
            onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.path)}
          >
            View Full Profile
          </Button>
        </Row>

        {/* Avatar & Name Section */}
        <Stack gap={12} align="center">
          <Avatar  size={32}>
            <Avatar.Image
              source={{
                uri: getAvatarUrl(generalInfo.avatar_path) || generalInfo.avatar_url || '',
              }}
            />
            <Avatar.Fallback backgroundColor="$color6" />
          </Avatar>

          <Stack gap={4} align="center">
            <Text>{displayName}</Text>
            {generalInfo.headline && (
              <Stack align="center">
                <Text style={{ color: colors.text[theme].secondary }}>{generalInfo.headline}</Text>
              </Stack>
            )}
          </Stack>

          {/* Open to Work Badge */}
          {generalInfo.open_to_work && (
            <Row
              style={{ backgroundColor: colors.bg[theme].success }}
              paddingHorizontal={12}
              paddingVertical={6}
              borderRadius="$10"
              borderWidth={1}
              style={{ borderColor: colors.border[theme].success }}
            >
              <Text style={{ color: colors.text[theme].success }}>Open to Work</Text>
            </Row>
          )}
        </Stack>

        {/* Current Role */}
        {currentRole && (
          <Stack gap={4} style={{ backgroundColor: colors.bg[theme].subtle }} padding="sm" borderRadius={12}>
            <Text style={{ color: colors.text[theme].secondary }}>Current Role</Text>
            <Text>{currentRole.job_title}</Text>
            <Text style={{ color: colors.text[theme].secondary }}>{currentRole.company_name}</Text>
          </Stack>
        )}

        {/* Stats Grid */}
        <Stack gap={12}>
          <Text>Profile Stats</Text>

          {/* Completion Bar */}
          <Stack gap={8}>
            <Row justify="space-between">
              <Text style={{ color: colors.text[theme].secondary }}>Completion</Text>
              <Text>{completion}%</Text>
            </Row>
            <Progress value={completion} max={100}>
              <Progress.Indicator animation="bouncy" backgroundColor="$blue7" />
            </Progress>
          </Stack>

          {/* Stats Row */}
          <Row gap={spacing.sm} flexWrap="wrap">
            <Stack
              gap={4}
              flex={1}
              minWidth={80}
              style={{ backgroundColor: colors.bg[theme].subtle }}
              padding={spacing.sm}
              borderRadius={12}
              align="center"
            >
              <Text color="$blue8">{skills?.length || 0}</Text>
              <Text style={{ color: colors.text[theme].secondary }}>Skills</Text>
            </Stack>

            <Stack
              gap={4}
              flex={1}
              minWidth={80}
              style={{ backgroundColor: colors.bg[theme].subtle }}
              padding={spacing.sm}
              borderRadius={12}
              align="center"
            >
              <Text style={{ color: colors.text[theme].success }}>{certifications?.length || 0}</Text>
              <Text style={{ color: colors.text[theme].secondary }}>Certs</Text>
            </Stack>

            <Stack
              gap={4}
              flex={1}
              minWidth={80}
              style={{ backgroundColor: colors.bg[theme].subtle }}
              padding={spacing.sm}
              borderRadius={12}
              align="center"
            >
              <Text style={{ color: colors.border[theme].info }}>{formattedYearsOfExperience}</Text>
              <Text style={{ color: colors.text[theme].secondary }}>Years</Text>
            </Stack>
          </Row>
        </Stack>

        {/* Top Skills Preview */}
        {topSkills.length > 0 && (
          <Stack gap={8}>
            <Row justify="space-between" align="center">
              <Text>Top Skills</Text>
              <Button
                size={4}
                chromeless
                onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
              >
                View All
              </Button>
            </Row>
            <Row gap={8} flexWrap="wrap">
              {topSkills.map((skill: Record<string, unknown>) => {
                const displayCode = typeof skill.displayCode === 'string' ? skill.displayCode : null
                const skillName = typeof skill.name === 'string' ? skill.name : 'Skill'
                const chipLabel =
                  typeof skill.label === 'string'
                    ? skill.label
                    : displayCode
                      ? `${displayCode} · ${skillName}`
                      : skillName

                return (
                  <Row
                    key={skill.id as string}
                    backgroundColor={colors.bg[theme].muted}
                    paddingHorizontal={10}
                    paddingVertical={6}
                    borderRadius={8}
                    borderWidth={1}
                    borderColor={skill.verified ? '$green7' : colors.border[theme].subtle}
                  >
                    {skill.verified && (
                      <Text style={{ color: colors.text[theme].success }} marginRight={4}>
                        ✓
                      </Text>
                    )}
                    <Text>{chipLabel}</Text>
                  </Row>
                )
              })}
            </Row>
          </Stack>
        )}

        {/* Quick Actions */}
        <Stack gap={spacing.xs}>
          <Button
            variant="primary"
            size="sm"
            onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.path)}
            width="100%"
          >
            Edit Profile
          </Button>
          {completion < 100 && (
            <Stack align="center">
              <Text style={{ color: colors.text[theme].secondary }}>Complete your profile to attract more opportunities</Text>
            </Stack>
          )}
        </Stack>
      </Stack>
    </DashboardWidget>
  )
}
