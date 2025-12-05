import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { getAvatarUrl } from '@scf/core/utils/supabase/storage'
import { DashboardWidget, spacing } from '@unicornlove/ui'
import { useRouter } from 'expo-router'
import { Avatar, Button, H4, Progress, Spinner, Text, XStack, YStack } from '@unicornlove/ui'

/**
 * ProfileSnapshotWidget
 * Comprehensive profile overview for dashboard
 * Shows stats, skills preview, and quick actions
 */
export function ProfileSnapshotWidget() {
  const router = useRouter()
  const { data: user } = api.profile.general.useUser.useQuery()

  // Fetch all data needed for snapshot
  const { data: generalInfo, isLoading: loadingGeneral } =
    api.profile.widgets.getGeneralInfo.useQuery(
      { userId: user?.id },
      { enabled: !!user?.id, staleTime: 5 * 60 * 1000 }
    )

  const { data: experience, isLoading: loadingExperience } =
    api.profile.widgets.getExperience.useQuery(
      { userId: user?.id },
      { enabled: !!user?.id, staleTime: 5 * 60 * 1000 }
    )

  const { data: skills, isLoading: loadingSkills } = api.profile.widgets.getSkills.useQuery(
    { userId: user?.id },
    { enabled: !!user?.id, staleTime: 5 * 60 * 1000 }
  )

  const { data: certifications, isLoading: loadingCerts } =
    api.profile.widgets.getCertifications.useQuery(
      { userId: user?.id },
      { enabled: !!user?.id, staleTime: 5 * 60 * 1000 }
    )

  const { data: education, isLoading: loadingEducation } =
    api.profile.widgets.getEducation.useQuery(
      { userId: user?.id },
      { enabled: !!user?.id, staleTime: 5 * 60 * 1000 }
    )

  const isLoading =
    loadingGeneral || loadingExperience || loadingSkills || loadingCerts || loadingEducation

  if (isLoading) {
    return (
      <DashboardWidget>
        <YStack gap={spacing.md} alignItems="center" paddingVertical={spacing['2xl']}>
          <Spinner size="large" color="$blue7" />
          <Text color="$color11">Loading profile...</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  if (!generalInfo) {
    return (
      <DashboardWidget>
        <YStack gap={spacing.md} alignItems="center" paddingVertical={spacing['2xl']}>
          <Text color="$color11">Profile data unavailable</Text>
        </YStack>
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
      <YStack gap={spacing.md}>
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <H4>Profile</H4>
          <Button
            size="$2"
            chromeless
            color="$blue7"
            onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.path)}
          >
            View Full Profile
          </Button>
        </XStack>

        {/* Avatar & Name Section */}
        <YStack gap="$3" alignItems="center">
          <Avatar circular size="$8">
            <Avatar.Image
              source={{
                uri: getAvatarUrl(generalInfo.avatar_path) || generalInfo.avatar_url || '',
              }}
            />
            <Avatar.Fallback backgroundColor="$color6" />
          </Avatar>

          <YStack gap="$1" alignItems="center">
            <Text fontSize="$5" fontWeight="600">
              {displayName}
            </Text>
            {generalInfo.headline && (
              <YStack alignItems="center">
                <Text color="$color11" fontSize="$2">
                  {generalInfo.headline}
                </Text>
              </YStack>
            )}
          </YStack>

          {/* Open to Work Badge */}
          {generalInfo.open_to_work && (
            <XStack
              backgroundColor="$green3"
              paddingHorizontal="$3"
              paddingVertical="$1.5"
              borderRadius="$10"
              borderWidth={1}
              borderColor="$green7"
            >
              <Text color="$green11" fontSize="$2" fontWeight="600">
                Open to Work
              </Text>
            </XStack>
          )}
        </YStack>

        {/* Current Role */}
        {currentRole && (
          <YStack gap="$1" backgroundColor="$color2" padding="$3" borderRadius="$3">
            <Text fontSize="$2" color="$color10">
              Current Role
            </Text>
            <Text fontSize="$3" fontWeight="600">
              {currentRole.job_title}
            </Text>
            <Text fontSize="$2" color="$color11">
              {currentRole.company_name}
            </Text>
          </YStack>
        )}

        {/* Stats Grid */}
        <YStack gap="$3">
          <Text fontSize="$3" fontWeight="600">
            Profile Stats
          </Text>

          {/* Completion Bar */}
          <YStack gap="$2">
            <XStack justifyContent="space-between">
              <Text fontSize="$2" color="$color11">
                Completion
              </Text>
              <Text fontSize="$2" fontWeight="600">
                {completion}%
              </Text>
            </XStack>
            <Progress value={completion} max={100}>
              <Progress.Indicator animation="bouncy" backgroundColor="$blue7" />
            </Progress>
          </YStack>

          {/* Stats Row */}
          <XStack gap={spacing.sm} flexWrap="wrap">
            <YStack
              gap="$1"
              flex={1}
              minWidth={80}
              backgroundColor="$color2"
              padding={spacing.sm}
              borderRadius="$3"
              alignItems="center"
            >
              <Text fontSize="$6" fontWeight="700" color="$blue8">
                {skills?.length || 0}
              </Text>
              <Text fontSize="$1" color="$color11">
                Skills
              </Text>
            </YStack>

            <YStack
              gap="$1"
              flex={1}
              minWidth={80}
              backgroundColor="$color2"
              padding={spacing.sm}
              borderRadius="$3"
              alignItems="center"
            >
              <Text fontSize="$6" fontWeight="700" color="$green10">
                {certifications?.length || 0}
              </Text>
              <Text fontSize="$1" color="$color11">
                Certs
              </Text>
            </YStack>

            <YStack
              gap="$1"
              flex={1}
              minWidth={80}
              backgroundColor="$color2"
              padding={spacing.sm}
              borderRadius="$3"
              alignItems="center"
            >
              <Text fontSize="$6" fontWeight="700" color="$blue7">
                {formattedYearsOfExperience}
              </Text>
              <Text fontSize="$1" color="$color11">
                Years
              </Text>
            </YStack>
          </XStack>
        </YStack>

        {/* Top Skills Preview */}
        {topSkills.length > 0 && (
          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$3" fontWeight="600">
                Top Skills
              </Text>
              <Button
                size="$1"
                chromeless
                onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.SKILLS.path)}
              >
                View All
              </Button>
            </XStack>
            <XStack gap="$2" flexWrap="wrap">
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
                  <XStack
                    key={skill.id as string}
                    backgroundColor="$color3"
                    paddingHorizontal="$2.5"
                    paddingVertical="$1.5"
                    borderRadius="$2"
                    borderWidth={1}
                    borderColor={skill.verified ? '$green7' : '$color6'}
                  >
                    {skill.verified && (
                      <Text color="$green10" fontSize="$1" marginRight="$1">
                        ✓
                      </Text>
                    )}
                    <Text fontSize="$2">{chipLabel}</Text>
                  </XStack>
                )
              })}
            </XStack>
          </YStack>
        )}

        {/* Quick Actions */}
        <YStack gap={spacing.xs}>
          <Button
            variant="primary"
            size="$3"
            onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.path)}
            width="100%"
          >
            Edit Profile
          </Button>
          {completion < 100 && (
            <YStack alignItems="center">
              <Text fontSize="$1" color="$color11">
                Complete your profile to attract more opportunities
              </Text>
            </YStack>
          )}
        </YStack>
      </YStack>
    </DashboardWidget>
  )
}
