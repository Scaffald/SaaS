import { api } from '@app/core/utils/api'
import { useUser } from '@app/core/utils/useUser'
import { ResponsiveModal } from '@scaffald/tamagui-ui'
import { AlertTriangle, CheckCircle } from '@tamagui/lucide-icons'
import { useState } from 'react'
import { Button, ScrollView, Spinner, Text, XStack, YStack } from 'tamagui'
import { resetProfileSyncError, useAdaptiveProfileSync } from '../profile/utils/profile-sync-store'
import { ReviewWizard } from '../reviews/components/ReviewWizard'
import { UserProfileAbout } from './user-profile-about'
import { UserProfileCertifications } from './user-profile-certifications'
import { UserProfileEducation } from './user-profile-education'
import { UserProfileExperience } from './user-profile-experience'
import { UserProfileHeader } from './user-profile-header'
import { UserProfileSkills } from './user-profile-skills'

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
  const syncStatus = useAdaptiveProfileSync(300)

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
          <XStack justify="flex-end">
            <YStack
              px="$3"
              py="$2"
              rounded="$4"
              borderWidth={1}
              bg={
                syncStatus === 'syncing' ? '$blue3' : syncStatus === 'error' ? '$red3' : '$green3'
              }
              borderColor={
                syncStatus === 'syncing' ? '$blue6' : syncStatus === 'error' ? '$red7' : '$green6'
              }
              gap="$1"
              style={{ maxWidth: 200 }}
            >
              <XStack gap="$2" items="center">
                {syncStatus === 'syncing' ? (
                  <Spinner size="small" color="$blue10" />
                ) : syncStatus === 'error' ? (
                  <AlertTriangle size={14} color="$red10" />
                ) : (
                  <CheckCircle size={14} color="$green10" />
                )}
                <Text
                  fontSize="$2"
                  fontWeight="600"
                  color={
                    syncStatus === 'syncing'
                      ? '$blue11'
                      : syncStatus === 'error'
                        ? '$red11'
                        : '$green11'
                  }
                >
                  {syncStatus === 'syncing'
                    ? 'Syncing…'
                    : syncStatus === 'error'
                      ? 'Sync failed'
                      : 'Up to date'}
                </Text>
              </XStack>
              {syncStatus === 'error' && (
                <Button size="$2" variant="outlined" onPress={resetProfileSyncError} mt="$2">
                  Dismiss
                </Button>
              )}
            </YStack>
          </XStack>

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
