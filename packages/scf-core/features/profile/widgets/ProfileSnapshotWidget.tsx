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
import { DashboardWidget, spacing } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { Avatar, Button, H4, Progress, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'

/**
 * ProfileSnapshotWidget
 * Comprehensive profile overview for dashboard
 * Shows stats, skills preview, and quick actions
 */
export function ProfileSnapshotWidget() {
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
          <Spinner size="lg" color="$blue7" />
          <Text color="gray">Loading profile...</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  if (!generalInfo) {
    return (
      <DashboardWidget>
        <Stack gap={spacing.md} align="center" paddingVertical={spacing['2xl']}>
          <Text color="gray">Profile data unavailable</Text>
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
            size={8}
            chromeless
            color="$blue7"
            onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.path)}
          >
            View Full Profile
          </Button>
        </Row>

        {/* Avatar & Name Section */}
        <Stack gap={12} align="center">
          <Avatar circular size={32}>
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
                <Text color="gray">{generalInfo.headline}</Text>
              </Stack>
            )}
          </Stack>

          {/* Open to Work Badge */}
          {generalInfo.open_to_work && (
            <Row
              backgroundColor="$green3"
              paddingHorizontal={12}
              paddingVertical={6}
              borderRadius="$10"
              borderWidth={1}
              borderColor="$green7"
            >
              <Text color="$green11">Open to Work</Text>
            </Row>
          )}
        </Stack>

        {/* Current Role */}
        {currentRole && (
          <Stack gap={4} backgroundColor="$color2" padding={12} borderRadius={12}>
            <Text color="gray">Current Role</Text>
            <Text>{currentRole.job_title}</Text>
            <Text color="gray">{currentRole.company_name}</Text>
          </Stack>
        )}

        {/* Stats Grid */}
        <Stack gap={12}>
          <Text>Profile Stats</Text>

          {/* Completion Bar */}
          <Stack gap={8}>
            <Row justify="space-between">
              <Text color="gray">Completion</Text>
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
              backgroundColor="$color2"
              padding={spacing.sm}
              borderRadius={12}
              align="center"
            >
              <Text color="$blue8">{skills?.length || 0}</Text>
              <Text color="gray">Skills</Text>
            </Stack>

            <Stack
              gap={4}
              flex={1}
              minWidth={80}
              backgroundColor="$color2"
              padding={spacing.sm}
              borderRadius={12}
              align="center"
            >
              <Text color="$green10">{certifications?.length || 0}</Text>
              <Text color="gray">Certs</Text>
            </Stack>

            <Stack
              gap={4}
              flex={1}
              minWidth={80}
              backgroundColor="$color2"
              padding={spacing.sm}
              borderRadius={12}
              align="center"
            >
              <Text color="$blue7">{formattedYearsOfExperience}</Text>
              <Text color="gray">Years</Text>
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
                    backgroundColor="$color3"
                    paddingHorizontal={10}
                    paddingVertical={6}
                    borderRadius={8}
                    borderWidth={1}
                    borderColor={skill.verified ? '$green7' : '$color6'}
                  >
                    {skill.verified && (
                      <Text color="$green10" marginRight={4}>
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
            size={12}
            onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.path)}
            width="100%"
          >
            Edit Profile
          </Button>
          {completion < 100 && (
            <Stack align="center">
              <Text color="gray">Complete your profile to attract more opportunities</Text>
            </Stack>
          )}
        </Stack>
      </Stack>
    </DashboardWidget>
  )
}
