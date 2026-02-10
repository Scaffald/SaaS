import { ROUTES } from '@scf/core/constants/routes'
import { ResumeUploadButton, ResumeUploadModal } from '@scf/core/features/resume'
import { DashboardWidget, spacing } from '@unicornlove/beyond-ui'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { H3, H4, Text, Stack } from '@unicornlove/beyond-ui'
import { VanityUrlSection } from './components/VanityUrlSection'

/**
 * Profile General Right Component
 * Navigation and overview for general profile settings with animated tips
 */
export function ProfileGeneralRight() {
  const router = useRouter()
  const [resumeModalOpen, setResumeModalOpen] = useState(false)
  const handleResumeUploadComplete = useCallback(
    (resumeId: string) => {
      setResumeModalOpen(false)
      router.push({
        pathname: ROUTES.DASHBOARD.PROFILE.RESUME.REVIEW.path,
        params: { resumeId },
      })
    },
    [router]
  )

  return (
    <>
      <Stack gap="$4">
        <DashboardWidget>
          <H3>General Information</H3>
          <Text color="$color11" fontSize="$3">
            Update your basic profile information including your name, photo, and contact details.
          </Text>
        </DashboardWidget>

        <DashboardWidget>
          <Stack gap={spacing.sm}>
            <H4>Import from your resume</H4>
            <Text color="$color11" fontSize="$3">
              Upload a PDF or Word document under 1MB and we’ll walk you through reviewing the
              details before they’re saved to your profile.
            </Text>
            <Text color="$color10" fontSize="$2">
              Accepted formats: PDF, DOC, DOCX. You can re-import your resume at any time.
            </Text>
            <ResumeUploadButton onPress={() => setResumeModalOpen(true)} size="$4" />
          </Stack>
        </DashboardWidget>

        <VanityUrlSection />
        {/* TODO: Uncomment this when we implement fully */}
        {/* <WorkLogVisibilitySettingsCard /> */}
      </Stack>

      <ResumeUploadModal
        open={resumeModalOpen}
        onOpenChange={setResumeModalOpen}
        onUploadComplete={handleResumeUploadComplete}
      />
    </>
  )
}
