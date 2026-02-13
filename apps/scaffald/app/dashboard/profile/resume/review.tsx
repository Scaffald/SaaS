import { ROUTES } from '@scf/core/constants/routes'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { ResumeStepsSidebar, ResumeWizard, ResumeWizardProvider } from '@scf/core/features/resume'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Button, Stack, Text } from '@unicornlove/beyond-ui'

function useResumeIdFromParams() {
  const params = useLocalSearchParams<{ resumeId?: string }>()

  return useMemo(() => {
    const value = params.resumeId
    if (Array.isArray(value)) {
      return value[0]
    }
    return value ?? ''
  }, [params.resumeId])
}

interface ResumeReviewContentProps {
  resumeId?: string
}

function ResumeReviewContent({ resumeId }: ResumeReviewContentProps) {
  const router = useRouter()

  if (!resumeId) {
    return (
      <Stack gap={12} padding={16}>
        <Text size="lg" weight="bold">
          Resume not found
        </Text>
        <Text color="gray">
          We couldn't locate a resume session. Upload a resume to begin the review process.
        </Text>
        <Button
          size="md"
          variant="filled"
          color="primary"
          onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.RESUME.path)}
        >
          Upload Resume
        </Button>
      </Stack>
    )
  }

  return (
    <Stack padding={16}>
      <ResumeWizard resumeId={resumeId} />
    </Stack>
  )
}

export default function ResumeReviewPage() {
  const resumeId = useResumeIdFromParams()

  const breadcrumbs = [
    { route: ROUTES.DASHBOARD.PROFILE },
    { route: ROUTES.DASHBOARD.PROFILE.RESUME },
    { route: ROUTES.DASHBOARD.PROFILE.RESUME.REVIEW },
  ]

  if (!resumeId) {
    return (
      <ProfilePage
        breadcrumbs={breadcrumbs}
        leftContent={<ResumeReviewContent />}
        rightContent={null}
      />
    )
  }

  return (
    <ResumeWizardProvider resumeId={resumeId}>
      <ProfilePage
        breadcrumbs={breadcrumbs}
        leftContent={<ResumeReviewContent resumeId={resumeId} />}
        rightContent={<ResumeStepsSidebar />}
      />
    </ResumeWizardProvider>
  )
}
