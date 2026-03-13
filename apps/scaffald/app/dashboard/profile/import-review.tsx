/**
 * Redirect: Import Review was merged into Resumé.
 * Old links to /dashboard/profile/import-review go to the resume page.
 */

import { ROUTES } from '@scf/core/constants/routes'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function ImportReviewRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace(ROUTES.DASHBOARD.PROFILE.RESUME.path)
  }, [router])
  return null
}
