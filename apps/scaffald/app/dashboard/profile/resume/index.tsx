import { ROUTES } from '@scf/core/constants/routes'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import {
  ResumeImportWidget,
  ResumeUploadButton,
  ResumeUploadModal,
} from '@scf/core/features/resume'
import { useHasUploadedResume } from '@scf/core/utils/resume-sdk-hooks'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Button, Paragraph, Row, Spinner, Stack, Text } from '@scaffald/ui'

function ResumeImportContent() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const handleResumeUploadComplete = useCallback(
    (resumeId: string) => {
      setModalOpen(false)
      router.push({
        params: { resumeId },
        pathname: ROUTES.DASHBOARD.PROFILE.RESUME.REVIEW.path,
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
          <Text weight="bold" color="#065f46">
            You've already uploaded a resume.
          </Text>
          <Text color="#065f46">
            Head over to the review wizard to finish importing the details or upload a new resume to
            replace it.
          </Text>
          <Row gap={8}>
            <Button
              size="md"
              variant="filled"
              color="primary"
              onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.RESUME.REVIEW.path)}
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
          <Text color="gray">Or use the dashboard widget to import from your home screen:</Text>
          <ResumeImportWidget />
        </Stack>
      )}
    </Stack>
  )
}

export default function ResumeImportPage() {
  return (
    <ProfilePage
      breadcrumbs={[
        { route: ROUTES.DASHBOARD.PROFILE },
        { route: ROUTES.DASHBOARD.PROFILE.RESUME },
      ]}
      leftContent={<ResumeImportContent />}
      rightContent={null}
    />
  )
}
