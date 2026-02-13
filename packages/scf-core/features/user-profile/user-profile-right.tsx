import {
  useGeneralInfoWidget,
  useExperienceWidget,
  useSkillsWidget,
  useCertificationsWidget,
  useEducationWidget,
} from '@scf/core/utils/profile-widgets-sdk-hooks'
import { useUserProfile } from '@scf/core/utils/user-profiles-sdk-hooks'
import { getAvatarUrl } from '@scf/core/utils/supabase/storage'
import { useUser } from '@scf/core/utils/useUser'
import { DashboardWidget, ResponsiveModal } from '@scaffald/ui'
import { useState } from 'react'
import { Avatar, H4, Progress, Spinner, Text, Row, Stack } from '@scaffald/ui'
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

  const { data: profile } = useUserProfile(userId)

  // Fetch widget data for snapshot
  const { data: generalInfo, isLoading: loadingGeneral } = useGeneralInfoWidget(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  )

  const { data: experience } = useExperienceWidget(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  )

  const { data: skills } = useSkillsWidget(
    { userId },
    { enabled: !!userId, staleTime: 5 * 60 * 1000 }
  )

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
      <Stack gap={16}>
        {/* Profile Snapshot Widget */}
        <DashboardWidget>
          {loadingGeneral ? (
            <Stack gap={16} align="center" paddingVertical={32}>
              <Spinner size="lg" />
              <Text color="$gray11">Loading profile...</Text>
            </Stack>
          ) : generalInfo ? (
            <Stack gap={16}>
              {/* Header */}
              <H4>Profile Overview</H4>

              {/* Avatar & Name Section */}
              <Stack gap={12} align="center">
                <Avatar size={32}>
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
                      <Text color="$gray11">{generalInfo.headline}</Text>
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
                <Stack gap={4} backgroundColor="$color2" padding="sm" borderRadius={12}>
                  <Text color="$gray11">Current Role</Text>
                  <Text>{currentRole.job_title}</Text>
                  <Text color="$gray11">{currentRole.company_name}</Text>
                </Stack>
              )}

              {/* Stats Grid */}
              <Stack gap={12}>
                <Text>Profile Stats</Text>

                {/* Completion Bar */}
                <Stack gap={8}>
                  <Row justify="space-between">
                    <Text color="$gray11">Completion</Text>
                    <Text>{completion}%</Text>
                  </Row>
                  <Progress value={completion} max={100}>
                    <Progress.Indicator animation="bouncy" backgroundColor="$green9" />
                  </Progress>
                </Stack>

                {/* Stats Row */}
                <Row gap={12} flexWrap="wrap">
                  <Stack
                    gap={4}
                    flex={1}
                    minWidth={80}
                    backgroundColor="$color2"
                    padding="sm"
                    borderRadius={12}
                    align="center"
                  >
                    <Text color="$blue10">{skills?.length || 0}</Text>
                    <Text color="$gray11">Skills</Text>
                  </Stack>

                  <Stack
                    gap={4}
                    flex={1}
                    minWidth={80}
                    backgroundColor="$color2"
                    padding="sm"
                    borderRadius={12}
                    align="center"
                  >
                    <Text color="$green10">{certifications?.length || 0}</Text>
                    <Text color="$gray11">Certs</Text>
                  </Stack>

                  <Stack
                    gap={4}
                    flex={1}
                    minWidth={80}
                    backgroundColor="$color2"
                    padding="sm"
                    borderRadius={12}
                    align="center"
                  >
                    <Text color="$gray11">{formattedYearsOfExperience}</Text>
                    <Text color="$gray11">Years</Text>
                  </Stack>
                </Row>
              </Stack>

              {/* Top Skills Preview */}
              {topSkills.length > 0 && (
                <Stack gap={8}>
                  <Text>Top Skills</Text>
                  <Row gap={8} flexWrap="wrap">
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
        size="lg"
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
