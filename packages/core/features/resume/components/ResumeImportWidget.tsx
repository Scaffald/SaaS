import { useState } from 'react'
import { useRouter } from 'expo-router'
import { FileText, ShieldCheck } from '@tamagui/lucide-icons'
import { Text, XStack, YStack } from 'tamagui'
import { DashboardWidget, spacing } from '@app/ui'
import { api } from '@app/core/utils/api'
import { ResumeUploadButton } from './ResumeUploadButton'
import { ResumeUploadModal } from './ResumeUploadModal'

export function ResumeImportWidget() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const { data, isLoading } = api.resume.hasUploaded.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  const shouldHideWidget = !isLoading && data?.hasUploaded

  if (shouldHideWidget) {
    return null
  }

  return (
    <>
      <DashboardWidget>
        <YStack gap={spacing.md}>
          <XStack gap={spacing.md} items="center">
            <YStack
              width={48}
              height={48}
              items="center"
              justify="center"
              bg="$blue3"
              rounded="$4"
            >
              <FileText color="$blue10" size={26} />
            </YStack>
            <YStack gap="$1">
              <Text fontSize="$5" fontWeight="700" color="$color12">
                Import Your Resume
              </Text>
              <Text color="$color11">
                Upload a PDF or Word document and we’ll auto-fill your profile details for you.
              </Text>
            </YStack>
          </XStack>

          <YStack gap="$2">
            <XStack gap="$2" items="center">
              <ShieldCheck size={18} color="$green10" />
              <Text fontSize="$2" color="$green11">
                Files stay private — only you can access your resume.
              </Text>
            </XStack>
            <Text fontSize="$2" color="$color10">
              Accepted formats: PDF, DOC, DOCX. Maximum size: 1MB.
            </Text>
          </YStack>

          <ResumeUploadButton
            onPress={() => setModalOpen(true)}
            text="Upload Resume"
            size="$4"
          />
        </YStack>
      </DashboardWidget>

      <ResumeUploadModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUploadComplete={(resumeId) => {
          setModalOpen(false)
          router.push(`/dashboard/profile/resume/review?resumeId=${resumeId}`)
        }}
      />
    </>
  )
}
