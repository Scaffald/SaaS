/**
 * Redirect: Background Check was merged into Verification.
 * Old links to /dashboard/profile/background-check go to the verification page.
 * Note: Nested routes (initiate, dispute) remain functional.
 */

import { ROUTES } from '@scf/core/constants/routes'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function BackgroundCheckRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace(ROUTES.DASHBOARD.PROFILE.ID_VERIFICATION.path)
  }, [router])
  return null
}
