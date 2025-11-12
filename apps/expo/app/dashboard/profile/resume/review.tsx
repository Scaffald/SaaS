import { useMemo } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { DashboardLayout, QuickLinksSidebar } from '@app/ui'
import { YStack, Text, Button } from 'tamagui'
import { ResumeWizard } from '@app/core/features/resume'

function ResumeReviewContent() {
  const router = useRouter()
  const params = useLocalSearchParams<{ resumeId?: string }>()

  const resumeId = useMemo(() => {
    const value = params.resumeId
    if (Array.isArray(value)) {
      return value[0]
    }
    return value ?? ''
  }, [params.resumeId])

  if (!resumeId) {
    return (
      <YStack gap="$3" p="$4">
        <Text fontSize="$7" fontWeight="700">
          Resume not found
        </Text>
        <Text color="$color11">
          We couldn’t locate a resume session. Upload a resume to begin the review process.
        </Text>
        <Button size="$4" onPress={() => router.push('/dashboard/profile/resume')}>
          Upload Resume
        </Button>
      </YStack>
    )
  }

  return (
    <YStack p="$4" flex={1}>
      <ResumeWizard resumeId={resumeId} />
    </YStack>
  )
}

export default function ResumeReviewPage() {
  return (
    <DashboardLayout leftContent={<ResumeReviewContent />} rightContent={<QuickLinksSidebar />} />
  )
}
