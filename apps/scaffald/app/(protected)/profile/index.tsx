import { ROUTES } from '@scf/core/constants/routes'
import { ProfileStrengthCard } from '@scf/core/features/dashboard/completion'
import { IdVerificationWidget } from '@scf/core/features/id-verification'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { ProfileCertificationsHighlightProvider } from '@scf/core/features/profile/profile-certifications-highlight-context'
import { ProfileCertificationsRight } from '@scf/core/features/profile/profile-certifications-right'
import { ProfileSkillsSection } from '@scf/core/features/profile/components/ProfileSkillsSection'
import { RequestReviewModal } from '@scf/core/features/profile/components/RequestReviewModal'
import { SharePublicProfileModal } from '@scf/core/features/profile/components/SharePublicProfileModal'
import {
  EducationWidget,
  ExperienceWidget,
  GeneralInfoWidget,
  PreferencesWidget,
} from '@scf/core/features/profile/widgets'
import { useGeneralInfoWidget } from '@scf/core/utils/profile-widgets-sdk-hooks'
import { useUser } from '@scf/core/utils/useUser'
import { Button, Row, Stack } from '@scaffald/ui'
import { MessageSquarePlus, Share2 } from 'lucide-react-native'
import { useState } from 'react'

/**
 * Profile Index - Own profile view
 * Shows all profile information in a two-column layout with edit buttons
 */
export default function ProfileIndexScreen() {
  const { user } = useUser()
  const [shareOpen, setShareOpen] = useState(false)
  const [requestReviewOpen, setRequestReviewOpen] = useState(false)
  const { data: profile } = useGeneralInfoWidget()

  if (!user) {
    return null
  }

  return (
    <ProfileCertificationsHighlightProvider>
      <ProfilePage
        breadcrumbs={[{ route: ROUTES.PROFILE }]}
        leftContent={
          <Stack gap={16}>
            {/* SC-40: surface the public profile / QR / share affordance
                above the strength card so it's the first thing the worker
                sees on their own profile. Modal handles the empty-slug
                case with a CTA to /dashboard/settings. */}
            <Row justify="flex-end" gap={8} wrap>
              <Button
                variant="outline"
                iconStart={MessageSquarePlus}
                onPress={() => setRequestReviewOpen(true)}
                accessibilityLabel="Request a review"
              >
                Request review
              </Button>
              <Button
                variant="outline"
                iconStart={Share2}
                onPress={() => setShareOpen(true)}
                accessibilityLabel="Share my public profile"
              >
                Share profile
              </Button>
            </Row>

            {/* SC-39 Phase D: Profile Strength surface on the Profile tab.
                Uses the same canonical algorithm as the dashboard widgets. */}
            <ProfileStrengthCard />
            <GeneralInfoWidget userId={user.id} showEdit />
            <ExperienceWidget userId={user.id} showEdit />
            <EducationWidget userId={user.id} showEdit />
          </Stack>
        }
        rightContent={
          <Stack gap={16}>
            <ProfileSkillsSection userId={user.id} showEdit />
            <IdVerificationWidget />
            <ProfileCertificationsRight />
            <PreferencesWidget showEdit />
          </Stack>
        }
      />
      <SharePublicProfileModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        slug={profile?.slug ?? null}
        displayName={profile?.display_name ?? profile?.username ?? null}
      />
      <RequestReviewModal
        visible={requestReviewOpen}
        onClose={() => setRequestReviewOpen(false)}
      />
    </ProfileCertificationsHighlightProvider>
  )
}
