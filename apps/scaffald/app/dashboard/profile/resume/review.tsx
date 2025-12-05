import { ROUTES } from '@scf/core/constants/routes'
import { ProfilePage } from '@scf/core/features/profile/ProfilePage'
import { ResumeStepsSidebar, ResumeWizard, ResumeWizardProvider } from '@scf/core/features/resume'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Button, Text, YStack } from '@unicornlove/ui'

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
      <YStack gap="$3" padding="$4">
        <Text fontSize="$7" fontWeight="700">
          Resume not found
        </Text>
        <Text color="$color11">
          We couldn’t locate a resume session. Upload a resume to begin the review process.
        </Text>
        <Button size="$4" onPress={() => router.push(ROUTES.DASHBOARD.PROFILE.RESUME.path)}>
          Upload Resume
        </Button>
      </YStack>
    )
  }

  return (
    <YStack padding="$4" flex={1}>
      <ResumeWizard resumeId={resumeId} />
    </YStack>
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
