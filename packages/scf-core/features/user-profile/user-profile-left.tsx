import {
  useUserProfile,
  useUserSkills,
  useUserCertifications,
  useUserExperience,
  useUserEducation,
} from "@scf/core/utils/user-profiles-sdk-hooks";
import { useUser } from "@scf/core/utils/useUser";
import { ResponsiveModal } from "@scaffald/ui";
import { AlertTriangle, CheckCircle } from "lucide-react-native";
import { useState } from "react";
import { Button, ScrollView, Spinner, Text, Row, Stack } from "@scaffald/ui";
import {
  resetProfileSyncError,
  useAdaptiveProfileSync,
} from "../profile/utils/profile-sync-store";
import { ReviewWizard } from "../reviews/components/ReviewWizard";
import { UserProfileAbout } from "./user-profile-about";
import { type UserProfileCertification, UserProfileCertifications } from "./user-profile-certifications";
import { type UserProfileEducationEntry, UserProfileEducation } from "./user-profile-education";
import { UserProfileExperience } from "./user-profile-experience";
import { UserProfileHeader } from "./user-profile-header";
import { type UserProfileSkill, UserProfileSkills } from "./user-profile-skills";

interface UserProfileLeftProps {
  userId: string;
}

/**
 * User Profile Left Column
 * Main profile content including header, about, skills, certifications, experience, and education
 */
export function UserProfileLeft({ userId }: UserProfileLeftProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { user: currentUser } = useUser();
  const syncStatus = useAdaptiveProfileSync(300);

  // Fetch all profile data
  const { data: profile, isLoading: profileLoading } = useUserProfile(userId);

  const { data: skills = [], isLoading: skillsLoading } = useUserSkills(userId);

  const { data: certifications = [] } = useUserCertifications(userId);

  const { data: experience = [] } = useUserExperience(userId);

  const { data: education = [] } = useUserEducation(userId);

  const isLoading = profileLoading || skillsLoading;

  // Check if current user can leave a review (not viewing their own profile)
  const canLeaveReview = currentUser?.id !== userId;

  const handleLeaveReview = () => {
    setShowReviewModal(true);
  };

  const handleCloseReview = () => {
    setShowReviewModal(false);
  };

  const handleReviewComplete = () => {
    setShowReviewModal(false);
    // Refresh reviews data
    // TODO: Invalidate queries to refresh reviews
  };

  if (isLoading) {
    return (
      <Stack flex={1} align="center" justify="center" paddingVertical={40}>
        <Spinner size="lg" color="primary" />
        <Text style={{ marginTop: 16, color: "$gray11" }}>
          Loading profile...
        </Text>
      </Stack>
    );
  }

  if (!profile) {
    return (
      <Stack flex={1} align="center" justify="center" paddingVertical={40}>
        <Text color="$red10">Profile not found</Text>
      </Stack>
    );
  }

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Stack gap={24} padding="md" paddingBottom={32}>
          <Row justify="flex-end">
            <Stack
              paddingHorizontal={12}
              paddingVertical={8}
              borderRadius={16}
              borderWidth={1}
              backgroundColor={
                syncStatus === "syncing"
                  ? "$blue3"
                  : syncStatus === "error"
                  ? "$red3"
                  : "$green3"
              }
              borderColor={
                syncStatus === "syncing"
                  ? "$blue6"
                  : syncStatus === "error"
                  ? "$red7"
                  : "$green6"
              }
              gap={4}
              style={{ maxWidth: 200 }}
            >
              <Row gap={8} align="center">
                {syncStatus === "syncing" ? (
                  <Spinner size="sm" color="primary" />
                ) : syncStatus === "error" ? (
                  <AlertTriangle size="md" color="$red10" />
                ) : (
                  <CheckCircle size="md" color="$green10" />
                )}
                <Text
                  color={
                    syncStatus === "syncing"
                      ? "$blue11"
                      : syncStatus === "error"
                      ? "$red11"
                      : "$green11"
                  }
                >
                  {syncStatus === "syncing"
                    ? "Syncing…"
                    : syncStatus === "error"
                    ? "Sync failed"
                    : "Up to date"}
                </Text>
              </Row>
              {syncStatus === "error" && (
                <Button
                  size="sm"
                  variant="outline"
                  onPress={resetProfileSyncError}
                  style={{ marginTop: 8 }}
                >
                  Dismiss
                </Button>
              )}
            </Stack>
          </Row>

          {/* Profile Header */}
          <UserProfileHeader
            profile={profile}
            onLeaveReview={handleLeaveReview}
            canLeaveReview={canLeaveReview}
          />

          {/* About Section */}
          {profile.bio && <UserProfileAbout bio={profile.bio} />}

          {/* Skills Section */}
          {skills.length > 0 && <UserProfileSkills skills={skills as unknown as UserProfileSkill[]} />}

          {/* Certifications Section */}
          {certifications.length > 0 && (
            <UserProfileCertifications certifications={certifications as unknown as UserProfileCertification[]} />
          )}

          {/* Experience Section */}
          {experience.length > 0 && (
            <UserProfileExperience experience={experience} />
          )}

          {/* Education Section */}
          {education.length > 0 && (
            <UserProfileEducation education={education as unknown as UserProfileEducationEntry[]} />
          )}
        </Stack>
      </ScrollView>

      {/* Review Modal */}
      <ResponsiveModal
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        title={`Review ${profile?.name || "User"}`}
        size="lg"
      >
        <ReviewWizard
          subjectId={userId}
          subjectName={profile?.name || "this user"}
          onCancel={handleCloseReview}
          onComplete={handleReviewComplete}
        />
      </ResponsiveModal>
    </>
  );
}
