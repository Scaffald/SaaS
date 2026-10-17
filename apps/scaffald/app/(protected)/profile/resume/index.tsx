import { ROUTES } from '@scf/core/constants/routes'
import { BuildProfileBlock } from '@scf/core/features/dashboard/components'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { ProfileEmploymentLeft } from '@scf/core/features/profile/profile-employment-left'
import { ProfileGeneralLeft } from '@scf/core/features/profile/profile-general-left'
import { ProfileGeneralRight } from '@scf/core/features/profile/profile-general-right'
import { ImportReviewScreen } from '@scf/core/features/profile-import/components/ImportReviewScreen'
import { ResumeUploadButton, ResumeUploadModal } from '@scf/core/features/resume'
import { useHasUploadedResume } from '@scf/core/utils/resume-sdk-hooks'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  Accordion,
  Button,
  Paragraph,
  Row,
  Separator,
  Spinner,
  Stack,
  Text,
  useResponsive,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

function ResumeImportContent() {
  const router = useRouter()
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [modalOpen, setModalOpen] = useState(false)
  const handleResumeUploadComplete = useCallback(
    (resumeId: string) => {
      setModalOpen(false)
      router.push({
        params: { resumeId },
        pathname: ROUTES.PROFILE.RESUME.REVIEW.path,
      })
    },
    [router]
  )
  const { data, isLoading } = useHasUploadedResume({
    refetchOnWindowFocus: false,
  })

  const hasUploaded = data?.hasUploaded ?? false

  return (
    <Stack gap={24} padding={16}>
      <ResumeUploadModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUploadComplete={handleResumeUploadComplete}
      />

      <Stack gap={8}>
        <Text size="xl" weight="bold">
          Import Your Resume
        </Text>
        <Paragraph size="md" color="gray">
          Upload a PDF or Word document (max 1MB) to automatically populate your experience,
          education, skills, and preferences. You'll confirm everything before it's saved to your
          profile.
        </Paragraph>
      </Stack>

      {isLoading ? (
        <Stack gap={8} align="center">
          <Spinner size="lg" />
          <Text color="gray">Checking for existing uploads...</Text>
        </Stack>
      ) : hasUploaded ? (
        <Stack gap={12} padding={16}>
          {/* The success foreground token, not a fixed green that sank into
              the dark ground (#1189). */}
          <Text weight="bold" style={{ color: colors.fg[t].success }}>
            You've already uploaded a resume.
          </Text>
          <Text style={{ color: colors.fg[t].success }}>
            Head over to the review wizard to finish importing the details or upload a new resume to
            replace it.
          </Text>
          <Row gap={8}>
            <Button
              size="md"
              variant="filled"
              color="primary"
              onPress={() => router.push(ROUTES.PROFILE.RESUME.REVIEW.path)}
            >
              Continue Review
            </Button>
            <ResumeUploadButton
              onPress={() => setModalOpen(true)}
              size="md"
              label="Upload New Resume"
            />
          </Row>
        </Stack>
      ) : (
        <Stack gap={12}>
          <ResumeUploadButton onPress={() => setModalOpen(true)} size="md" />
          <Text color="gray">Accepted formats: PDF, DOC, DOCX. You can re-import at any time.</Text>
        </Stack>
      )}

      <Separator />

      <Stack gap={12}>
        <Text size="xl" weight="bold">
          Review Imported Data
        </Text>
        <Paragraph size="md" color="gray">
          Edit and confirm experience, education, skills, and other details parsed from your resume
          before saving to your profile.
        </Paragraph>
        <ImportReviewScreen />
      </Stack>
    </Stack>
  )
}

export default function ResumeProfilePage() {
  const { isDesktop } = useResponsive()

  // The tab is named for the résumé, so it opens on the import (#1189). It
  // was the third section, a full page under the general-info form.
  const leftContent = (
    <Accordion mode="multiple" defaultValue={['resume', 'general', 'employment']}>
      <Accordion.Item value="resume">
        <Accordion.Trigger>Resume Import</Accordion.Trigger>
        <Accordion.Content>
          <ResumeImportContent />
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="general">
        <Accordion.Trigger>General Information</Accordion.Trigger>
        <Accordion.Content>
          <ProfileGeneralLeft />
          {!isDesktop && <ProfileGeneralRight />}
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="employment">
        <Accordion.Trigger>Employment Preferences</Accordion.Trigger>
        <Accordion.Content>
          <ProfileEmploymentLeft />
        </Accordion.Content>
      </Accordion.Item>
    </Accordion>
  )

  // One rail: what is left to do, then the public-URL setting. The two cards
  // that restated the section titles beside the sections are gone (#1190).
  const rightContent = isDesktop ? (
    <Stack gap={24}>
      <BuildProfileBlock />
      <ProfileGeneralRight />
    </Stack>
  ) : null

  return <ProfilePage leftContent={leftContent} rightContent={rightContent} />
}
