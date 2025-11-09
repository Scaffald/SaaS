import { useState } from 'react'
import { useRouter } from 'expo-router'
import { DashboardLayout } from '@app/ui'
import { YStack, Text, Paragraph, Button, Spinner, XStack } from 'tamagui'
import {
  ResumeImportWidget,
  ResumeUploadButton,
  ResumeUploadModal,
} from '@app/core/features/resume'
import { api } from '@app/core/utils/api'

function ResumeImportContent() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const { data, isLoading } = api.resume.hasUploaded.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  const hasUploaded = data?.hasUploaded ?? false

  return (
    <YStack gap="$6" p="$4">
      <ResumeUploadModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUploadComplete={(resumeId: string) => {
          setModalOpen(false)
          router.push(`/dashboard/profile/resume/review?resumeId=${resumeId}`)
        }}
      />

      <YStack gap="$2">
        <Text fontSize="$8" fontWeight="700">
          Import Your Resume
        </Text>
        <Paragraph size="$4" color="$color11">
          Upload a PDF or Word document (max 1MB) to automatically populate your experience,
          education, skills, and preferences. You’ll confirm everything before it’s saved to your
          profile.
        </Paragraph>
      </YStack>

      {isLoading ? (
        <YStack gap="$2" items="center" py="$6">
          <Spinner size="large" />
          <Text color="$color11">Checking for existing uploads...</Text>
        </YStack>
      ) : hasUploaded ? (
        <YStack gap="$3" bg="$green3" p="$4" rounded="$4">
          <Text fontWeight="700" color="$green11">
            You’ve already uploaded a resume.
          </Text>
          <Text color="$green11">
            Head over to the review wizard to finish importing the details or upload a new resume to
            replace it.
          </Text>
          <XStack gap="$2">
            <Button
              size="$4"
              theme="blue"
              onPress={() => router.push('/dashboard/profile/resume/review')}
            >
              Continue Review
            </Button>
            <ResumeUploadButton
              onPress={() => setModalOpen(true)}
              size="$4"
              label="Upload New Resume"
            />
          </XStack>
        </YStack>
      ) : (
        <YStack gap="$3">
          <ResumeUploadButton onPress={() => setModalOpen(true)} size="$4" />
          <Text color="$color11">Or use the dashboard widget to import from your home screen:</Text>
          <ResumeImportWidget />
        </YStack>
      )}
    </YStack>
  )
}

export default function ResumeImportPage() {
  return <DashboardLayout leftContent={<ResumeImportContent />} rightContent={null} />
}
