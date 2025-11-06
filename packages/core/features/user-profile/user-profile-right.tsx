import { useState } from 'react'
import { YStack, XStack, Text, H4, Avatar, Progress, Spinner } from 'tamagui'
import { ResponsiveModal } from '@app/ui'
import { DashboardWidget } from '@app/ui'
import { api } from '@app/core/utils/api'
import { useUser } from '@app/core/utils/useUser'
import { UserProfileReviews } from './user-profile-reviews'
import { ReviewWizard } from '../reviews/components/ReviewWizard'
import { SkillsWidget } from '../profile/widgets/SkillsWidget'
import { CertificationsWidget } from '../profile/widgets/CertificationsWidget'
import { ExperienceWidget } from '../profile/widgets/ExperienceWidget'
import { getAvatarUrl } from '@app/core/utils/supabase/storage'

interface UserProfileRightProps {
  userId: string
}

/**
 * User Profile Right Column
 * Profile snapshot, widgets, and reviews
 */
export function UserProfileRight({ userId }: UserProfileRightProps) {
  const [showReviewModal, setShowReviewModal] = useState(false)
  const { user: currentUser } = useUser()

  const { data: profile } = api.userProfile.getUserProfile.useQuery({ userId })

  // Fetch widget data for snapshot
  const { data: generalInfo, isLoading: loadingGeneral } =
    api.profile.widgets.getGeneralInfo.useQuery(
      { userId },
      { enabled: !!userId, staleTime: 5 * 60 * 1000 }
    )

  const { data: experience } = api.profile.widgets.getExperience.useQuery(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  )

  const { data: skills } = api.profile.widgets.getSkills.useQuery(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  )

  const { data: certifications } = api.profile.widgets.getCertifications.useQuery(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  )

  const { data: education } = api.profile.widgets.getEducation.useQuery(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  )

  // Check if current user can leave a review (not viewing their own profile)
  const canLeaveReview = currentUser?.id !== userId

  const handleLeaveReview = () => {
    setShowReviewModal(true)
  }

  const handleCloseReview = () => {
    setShowReviewModal(false)
  }

  const handleReviewComplete = () => {
    setShowReviewModal(false)
    // Reviews component will automatically refetch when modal closes
  }

  // Calculate profile completion
  const calculateCompletion = (): number => {
    if (!generalInfo) return 0
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

  // Get current role from experience
  const currentRole = experience?.find((exp: Record<string, unknown>) => exp.is_current)

  // Get top skills
  const topSkills = skills?.slice(0, 5) || []

  // Helper to get skill name
  const getSkillName = (skill: Record<string, unknown>): string => {
    if (skill.metadata && typeof skill.metadata === 'object') {
      const metadata = skill.metadata as Record<string, unknown>
      const name = metadata.name
      const title = metadata.title
      if (typeof name === 'string') return name
      if (typeof title === 'string') return title
    }
    return 'Skill'
  }

  const displayName =
    generalInfo?.display_name ||
    (generalInfo?.privateData?.first_name && generalInfo?.privateData?.last_name
      ? `${generalInfo.privateData.first_name} ${generalInfo.privateData.last_name}`
      : generalInfo?.username)

  return (
    <>
      <YStack gap="$4">
        {/* Profile Snapshot Widget */}
        <DashboardWidget>
          {loadingGeneral ? (
            <YStack gap="$4" items="center" py="$8">
              <Spinner size="large" />
              <Text color="$color11">Loading profile...</Text>
            </YStack>
          ) : generalInfo ? (
            <YStack gap="$4">
              {/* Header */}
              <H4>Profile Overview</H4>

              {/* Avatar & Name Section */}
              <YStack gap="$3" items="center">
                <Avatar circular size="$8">
                  <Avatar.Image
                    source={{
                      uri: getAvatarUrl(generalInfo.avatar_path) || generalInfo.avatar_url || '',
                    }}
                  />
                  <Avatar.Fallback backgroundColor="$color6" />
                </Avatar>

                <YStack gap="$1" items="center">
                  <Text fontSize="$5" fontWeight="600">
                    {displayName}
                  </Text>
                  {generalInfo.headline && (
                    <YStack items="center">
                      <Text color="$color11" fontSize="$2">
                        {generalInfo.headline}
                      </Text>
                    </YStack>
                  )}
                </YStack>

                {/* Open to Work Badge */}
                {generalInfo.open_to_work && (
                  <XStack
                    bg="$green3"
                    px="$3"
                    py="$1.5"
                    rounded="$10"
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
                <YStack gap="$1" bg="$color2" p="$3" rounded="$3">
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
                  <XStack justify="space-between">
                    <Text fontSize="$2" color="$color11">
                      Completion
                    </Text>
                    <Text fontSize="$2" fontWeight="600">
                      {completion}%
                    </Text>
                  </XStack>
                  <Progress value={completion} max={100}>
                    <Progress.Indicator animation="bouncy" bg="$green9" />
                  </Progress>
                </YStack>

                {/* Stats Row */}
                <XStack gap="$3" flexWrap="wrap">
                  <YStack
                    gap="$1"
                    flex={1}
                    minW={80}
                    bg="$color2"
                    p="$3"
                    rounded="$3"
                    items="center"
                  >
                    <Text fontSize="$6" fontWeight="700" color="$blue10">
                      {skills?.length || 0}
                    </Text>
                    <Text fontSize="$1" color="$color11">
                      Skills
                    </Text>
                  </YStack>

                  <YStack
                    gap="$1"
                    flex={1}
                    minW={80}
                    bg="$color2"
                    p="$3"
                    rounded="$3"
                    items="center"
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
                    minW={80}
                    bg="$color2"
                    p="$3"
                    rounded="$3"
                    items="center"
                  >
                    <Text fontSize="$6" fontWeight="700" color="$color10">
                      {generalInfo.years_of_experience || 0}
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
                  <Text fontSize="$3" fontWeight="600">
                    Top Skills
                  </Text>
                  <XStack gap="$2" flexWrap="wrap">
                    {topSkills.map((skill: Record<string, unknown>) => (
                      <XStack
                        key={skill.id as string}
                        bg="$color3"
                        px="$2.5"
                        py="$1.5"
                        rounded="$2"
                        borderWidth={1}
                        borderColor={skill.verified ? '$green7' : '$color6'}
                      >
                        {skill.verified && (
                          <Text color="$green10" fontSize="$1" mr="$1">
                            ✓
                          </Text>
                        )}
                        <Text fontSize="$2">{getSkillName(skill)}</Text>
                      </XStack>
                    ))}
                  </XStack>
                </YStack>
              )}
            </YStack>
          ) : null}
        </DashboardWidget>

        {/* Skills Widget - Compact View */}
        <SkillsWidget userId={userId} showEdit={false} variant="compact" />

        {/* Certifications Widget - Compact View */}
        <CertificationsWidget userId={userId} showEdit={false} variant="compact" />

        {/* Experience Widget - Compact View */}
        <ExperienceWidget userId={userId} showEdit={false} variant="compact" />

        {/* Reviews Widget */}
        <DashboardWidget>
          <UserProfileReviews
            userId={userId}
            onLeaveReview={canLeaveReview ? handleLeaveReview : undefined}
          />
        </DashboardWidget>
      </YStack>

      {/* Review Modal */}
      <ResponsiveModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        title={`Review ${profile?.name || 'User'}`}
        size="large"
      >
        <ReviewWizard
          subjectId={userId}
          subjectName={profile?.name || 'this user'}
          onCancel={handleCloseReview}
          onComplete={handleReviewComplete}
        />
      </ResponsiveModal>
    </>
  )
}
