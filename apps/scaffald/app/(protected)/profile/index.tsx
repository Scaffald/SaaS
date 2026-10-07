import { ROUTES } from '@scf/core/constants/routes'
import { BuildProfileBlock } from '@scf/core/features/dashboard/components'
import { IdVerificationWidget } from '@scf/core/features/id-verification'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { ProfileCertificationsHighlightProvider } from '@scf/core/features/profile/profile-certifications-highlight-context'
import { ProfileCertificationsRight } from '@scf/core/features/profile/profile-certifications-right'
import { ProfileMetrics } from '@scf/core/features/profile/components/ProfileMetrics'
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
import { Button, Row, Stack, useResponsive } from '@scaffald/ui'
import { MessageSquarePlus, Share2, Wand2 } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'

/**
 * Profile Index - Own profile view
 * Shows all profile information in a two-column layout with edit buttons
 */
export default function ProfileIndexScreen() {
  const { user } = useUser()
  const router = useRouter()
  const [shareOpen, setShareOpen] = useState(false)
  const [requestReviewOpen, setRequestReviewOpen] = useState(false)
  const { data: profile } = useGeneralInfoWidget()
  const { isMobile, width } = useResponsive()

  if (!user) {
    return null
  }

  return (
    <ProfileCertificationsHighlightProvider>
      <ProfilePage
        breadcrumbs={[{ route: ROUTES.PROFILE }]}
        screenKicker="Your record"
        screenTip="What employers see when they open your profile. Verified skills and certifications carry the most weight."
        screenActions={
          // The header's action slot never shrinks, by design, so on a
          // phone the row is capped at the content width (16 px gutters) to
          // let the three buttons wrap instead of running off the edge.
          <Row gap={8} wrap style={isMobile ? { maxWidth: width - 32 } : undefined}>
            {/* The guided setup path. It existed as a full feature with no
                route rendering it, so nobody could reach it (#584). */}
            <Button
              size="sm"
              variant="outline"
              iconStart={Wand2}
              onPress={() => router.push(ROUTES.PROFILE.WIZARD.path)}
              accessibilityLabel="Open guided profile setup"
            >
              Guided setup
            </Button>
            <Button
              size="sm"
              variant="outline"
              iconStart={MessageSquarePlus}
              onPress={() => setRequestReviewOpen(true)}
              accessibilityLabel="Request a review"
            >
              Request review
            </Button>
            {/* SC-40: the share affordance stays first-class; the modal
                handles the empty-slug case with a CTA to settings. */}
            <Button
              size="sm"
              variant="outline"
              iconStart={Share2}
              onPress={() => setShareOpen(true)}
              accessibilityLabel="Share my public profile"
            >
              Share profile
            </Button>
          </Row>
        }
        leftContent={
          // #1034: header actions instead of a button row floating over the
          // cards; one identity block, then the figures, then the record.
          // The strength card became BuildProfileBlock in the right column.
          <Stack gap={16}>
            <GeneralInfoWidget userId={user.id} showEdit />
            <ProfileMetrics userId={user.id} />
            <ExperienceWidget userId={user.id} showEdit />
            <EducationWidget userId={user.id} showEdit />
          </Stack>
        }
        rightContent={
          <Stack gap={16}>
            <BuildProfileBlock />
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
