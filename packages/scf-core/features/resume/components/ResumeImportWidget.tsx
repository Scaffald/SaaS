import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { DashboardWidget, spacing } from '@unicornlove/beyond-ui'
import { FileText, ShieldCheck } from '@tamagui/lucide-icons'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Text, Row, Stack } from '@unicornlove/beyond-ui'
import { ResumeUploadButton } from './ResumeUploadButton'
import { ResumeUploadModal } from './ResumeUploadModal'

export function ResumeImportWidget() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const handleResumeUploadComplete = useCallback(
    (resumeId: string) => {
      setModalOpen(false)
      router.push({
        pathname: ROUTES.DASHBOARD.PROFILE.RESUME.REVIEW.path,
        params: { resumeId },
      })
    },
    [router]
  )
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
        <Stack gap={spacing.md}>
          <Row gap={spacing.md} alignItems="center">
            <Stack
              width={48}
              height={48}
              alignItems="center"
              justifyContent="center"
              backgroundColor="$blue3"
              borderRadius="$4"
            >
              <FileText color="$blue10" size={26} />
            </Stack>
            <Stack gap="$1">
              <Text fontSize="$5" fontWeight="700" color="$color12">
                Import Your Resume
              </Text>
              <Text color="$color11">
                Upload a PDF or Word document and we’ll auto-fill your profile details for you.
              </Text>
            </Stack>
          </Row>

          <Stack gap="$2">
            <Row gap="$2" alignItems="center">
              <ShieldCheck size={18} color="$green10" />
              <Text fontSize="$2" color="$green11">
                Files stay private — only you can access your resume.
              </Text>
            </Row>
            <Text fontSize="$2" color="$color10">
              Accepted formats: PDF, DOC, DOCX. Maximum size: 1MB.
            </Text>
          </Stack>

          <ResumeUploadButton onPress={() => setModalOpen(true)} label="Upload Resume" size="$4" />
        </Stack>
      </DashboardWidget>

      <ResumeUploadModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUploadComplete={handleResumeUploadComplete}
      />
    </>
  )
}
