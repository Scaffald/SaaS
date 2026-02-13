import { ROUTES } from '@scf/core/constants/routes'
import { api } from '@scf/core/utils/api'
import { DashboardWidget, spacing } from '@unicornlove/beyond-ui'
import { FileText, ShieldCheck } from 'lucide-react-native'
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
          <Row gap={spacing.md} align="center">
            <Stack
              width={48}
              height={48}
              align="center"
              justify="center"
              backgroundColor="$blue3"
              borderRadius={16}
            >
              <FileText color="$blue10" size={26} />
            </Stack>
            <Stack gap={4}>
              <Text color="gray">
                Import Your Resume
              </Text>
              <Text color="gray">
                Upload a PDF or Word document and we’ll auto-fill your profile details for you.
              </Text>
            </Stack>
          </Row>

          <Stack gap={8}>
            <Row gap={8} align="center">
              <ShieldCheck size={18} color="$green10" />
              <Text color="$green11">
                Files stay private — only you can access your resume.
              </Text>
            </Row>
            <Text color="gray">
              Accepted formats: PDF, DOC, DOCX. Maximum size: 1MB.
            </Text>
          </Stack>

          <ResumeUploadButton onPress={() => setModalOpen(true)} label="Upload Resume" size={16} />
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
