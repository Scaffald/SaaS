import { api } from '@scf/core/utils/api'
import {
  useGeneralInfoWidget,
  useExperienceWidget,
  useSkillsWidget,
  useCertificationsWidget,
  useEducationWidget,
} from '@scf/core/utils/profile-widgets-sdk-hooks'
import { getAvatarUrl } from '@scf/core/utils/supabase/storage'
import { useUser } from '@scf/core/utils/useUser'
import { DashboardWidget, ResponsiveModal } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Avatar, H4, Progress, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { CertificationsWidget } from '../profile/widgets/CertificationsWidget'
import { ExperienceWidget } from '../profile/widgets/ExperienceWidget'
import { SkillsWidget } from '../profile/widgets/SkillsWidget'
import { ReviewWizard } from '../reviews/components/ReviewWizard'
import { UserProfileReviews } from './user-profile-reviews'

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
  const { data: generalInfo, isLoading: loadingGeneral } = useGeneralInfoWidget(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  )

  const { data: experience } = useExperienceWidget(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  )

  const { data: skills } = useSkillsWidget({ userId }, { enabled: !!userId, staleTime: 5 * 60 * 1000 })

  const { data: certifications } = useCertificationsWidget(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  )

  const { data: education } = useEducationWidget(
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

  const resolvedYearsOfExperience =
    typeof generalInfo?.calculatedYearsOfExperience === 'number'
      ? generalInfo.calculatedYearsOfExperience
      : (generalInfo?.years_of_experience ?? 0)

  const formattedYearsOfExperience =
    Number.isFinite(resolvedYearsOfExperience) && resolvedYearsOfExperience % 1 !== 0
      ? resolvedYearsOfExperience.toFixed(1)
      : (resolvedYearsOfExperience ?? 0)

  const displayName =
    generalInfo?.display_name ||
    (generalInfo?.privateData?.first_name && generalInfo?.privateData?.last_name
      ? `${generalInfo.privateData.first_name} ${generalInfo.privateData.last_name}`
      : generalInfo?.username)

  return (
    <>
      <Stack gap="$4">
        {/* Profile Snapshot Widget */}
        <DashboardWidget>
          {loadingGeneral ? (
            <Stack gap="$4" alignItems="center" paddingVertical="$8">
              <Spinner size="large" />
              <Text color="$color11">Loading profile...</Text>
            </Stack>
          ) : generalInfo ? (
            <Stack gap="$4">
              {/* Header */}
              <H4>Profile Overview</H4>

              {/* Avatar & Name Section */}
              <Stack gap="$3" alignItems="center">
                <Avatar circular size="$8">
                  <Avatar.Image
                    source={{
                      uri: getAvatarUrl(generalInfo.avatar_path) || generalInfo.avatar_url || '',
                    }}
                  />
                  <Avatar.Fallback backgroundColor="$color6" />
                </Avatar>

                <Stack gap="$1" alignItems="center">
                  <Text fontSize="$5" fontWeight="600">
                    {displayName}
                  </Text>
                  {generalInfo.headline && (
                    <Stack alignItems="center">
                      <Text color="$color11" fontSize="$2">
                        {generalInfo.headline}
                      </Text>
                    </Stack>
                  )}
                </Stack>

                {/* Open to Work Badge */}
                {generalInfo.open_to_work && (
                  <Row
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
                  </Row>
                )}
              </Stack>

              {/* Current Role */}
              {currentRole && (
                <Stack gap="$1" backgroundColor="$color2" padding="$3" borderRadius="$3">
                  <Text fontSize="$2" color="$color10">
                    Current Role
                  </Text>
                  <Text fontSize="$3" fontWeight="600">
                    {currentRole.job_title}
                  </Text>
                  <Text fontSize="$2" color="$color11">
                    {currentRole.company_name}
                  </Text>
                </Stack>
              )}

              {/* Stats Grid */}
              <Stack gap="$3">
                <Text fontSize="$3" fontWeight="600">
                  Profile Stats
                </Text>

                {/* Completion Bar */}
                <Stack gap="$2">
                  <Row justifyContent="space-between">
                    <Text fontSize="$2" color="$color11">
                      Completion
                    </Text>
                    <Text fontSize="$2" fontWeight="600">
                      {completion}%
                    </Text>
                  </Row>
                  <Progress value={completion} max={100}>
                    <Progress.Indicator animation="bouncy" backgroundColor="$green9" />
                  </Progress>
                </Stack>

                {/* Stats Row */}
                <Row gap="$3" flexWrap="wrap">
                  <Stack
                    gap="$1"
                    flex={1}
                    minWidth={80}
                    backgroundColor="$color2"
                    padding="$3"
                    borderRadius="$3"
                    alignItems="center"
                  >
                    <Text fontSize="$6" fontWeight="700" color="$blue10">
                      {skills?.length || 0}
                    </Text>
                    <Text fontSize="$1" color="$color11">
                      Skills
                    </Text>
                  </Stack>

                  <Stack
                    gap="$1"
                    flex={1}
                    minWidth={80}
                    backgroundColor="$color2"
                    padding="$3"
                    borderRadius="$3"
                    alignItems="center"
                  >
                    <Text fontSize="$6" fontWeight="700" color="$green10">
                      {certifications?.length || 0}
                    </Text>
                    <Text fontSize="$1" color="$color11">
                      Certs
                    </Text>
                  </Stack>

                  <Stack
                    gap="$1"
                    flex={1}
                    minWidth={80}
                    backgroundColor="$color2"
                    padding="$3"
                    borderRadius="$3"
                    alignItems="center"
                  >
                    <Text fontSize="$6" fontWeight="700" color="$color10">
                      {formattedYearsOfExperience}
                    </Text>
                    <Text fontSize="$1" color="$color11">
                      Years
                    </Text>
                  </Stack>
                </Row>
              </Stack>

              {/* Top Skills Preview */}
              {topSkills.length > 0 && (
                <Stack gap="$2">
                  <Text fontSize="$3" fontWeight="600">
                    Top Skills
                  </Text>
                  <Row gap="$2" flexWrap="wrap">
                    {topSkills.map((skill: Record<string, unknown>) => {
                      const displayCode =
                        typeof skill.displayCode === 'string' ? skill.displayCode : null
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
                        </Row>
                      )
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
      </Stack>

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
