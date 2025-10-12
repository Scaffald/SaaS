import { useState } from 'react'
import { ScrollView, YStack, Spinner, Text } from 'tamagui'
import { ResponsiveModal } from '@app/ui'
import { api } from '@app/core/utils/api'
import { useUser } from '@app/core/utils/useUser'
import { UserProfileHeader } from './user-profile-header'
import { UserProfileAbout } from './user-profile-about'
import { UserProfileSkills } from './user-profile-skills'
import { UserProfileCertifications } from './user-profile-certifications'
import { UserProfileExperience } from './user-profile-experience'
import { UserProfileEducation } from './user-profile-education'
import { ReviewWizard } from '../reviews/components/ReviewWizard'

interface UserProfileLeftProps {
  userId: string
}

/**
 * User Profile Left Column
 * Main profile content including header, about, skills, certifications, experience, and education
 */
export function UserProfileLeft({ userId }: UserProfileLeftProps) {
  const [showReviewModal, setShowReviewModal] = useState(false)
  const { user: currentUser } = useUser()

  // Fetch all profile data
  const { data: profile, isLoading: profileLoading } = api.userProfile.getUserProfile.useQuery({
    userId,
  })

  const { data: skills = [], isLoading: skillsLoading } = api.userProfile.getUserSkills.useQuery({
    userId,
  })

  const { data: certifications = [] } = api.userProfile.getUserCertifications.useQuery({ userId })

  const { data: experience = [] } = api.userProfile.getUserExperience.useQuery({ userId })

  const { data: education = [] } = api.userProfile.getUserEducation.useQuery({ userId })

  const isLoading = profileLoading || skillsLoading

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
    // Refresh reviews data
    // TODO: Invalidate queries to refresh reviews
  }

  if (isLoading) {
    return (
      <YStack flex={1} items="center" justify="center" py="$10">
        <Spinner size="large" color="$blue10" />
        <Text mt="$4" color="$color11">
          Loading profile...
        </Text>
      </YStack>
    )
  }

  if (!profile) {
    return (
      <YStack flex={1} items="center" justify="center" py="$10">
        <Text color="$red10" fontSize="$6" fontWeight="600">
          Profile not found
        </Text>
      </YStack>
    )
  }

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack gap="$6" p="$4" pb="$8">
          {/* Profile Header */}
          <UserProfileHeader
            profile={profile}
            onLeaveReview={handleLeaveReview}
            canLeaveReview={canLeaveReview}
          />

          {/* About Section */}
          {profile.bio && <UserProfileAbout bio={profile.bio} />}

          {/* Skills Section */}
          {skills.length > 0 && <UserProfileSkills skills={skills} />}

          {/* Certifications Section */}
          {certifications.length > 0 && (
            <UserProfileCertifications certifications={certifications} />
          )}

          {/* Experience Section */}
          {experience.length > 0 && <UserProfileExperience experience={experience} />}

          {/* Education Section */}
          {education.length > 0 && <UserProfileEducation education={education} />}
        </YStack>
      </ScrollView>

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
