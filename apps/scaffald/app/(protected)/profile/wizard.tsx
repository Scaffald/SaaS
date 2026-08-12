import { ROUTES } from '@scf/core/constants/routes'
import { ProfileWizard } from '@scf/core/features/profile-wizard/components/ProfileWizard'
import { useRouter } from 'expo-router'
import { useCallback } from 'react'
import { Stack } from '@scaffald/ui'

/**
 * Guided profile setup.
 *
 * The wizard existed as 15 source files, 12 test files and a live
 * /v1/profile-wizard router, with no route anywhere that rendered it — it was
 * unreachable in the shipped app (#584). This is that route.
 *
 * Deliberately a peer of the section editors rather than a replacement: the
 * wizard is the guided path for a new worker, the editors are how anyone
 * changes one thing later. Both now commit through the same endpoints.
 */
export default function ProfileWizardScreen() {
  const router = useRouter()

  const goToProfile = useCallback(() => {
    router.replace(ROUTES.PROFILE.path)
  }, [router])

  const goToResumeImport = useCallback(() => {
    router.push(ROUTES.PROFILE.RESUME.path)
  }, [router])

  return (
    <Stack flex={1}>
      <ProfileWizard
        onCancel={goToProfile}
        onViewProfile={goToProfile}
        onUploadResume={goToResumeImport}
      />
    </Stack>
  )
}
