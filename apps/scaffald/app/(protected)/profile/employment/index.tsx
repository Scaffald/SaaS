/**
 * Redirect: Employment was merged into Resumé.
 * Old links to /dashboard/profile/employment go to the resume page.
 */

import { ROUTES } from '@scf/core/constants/routes'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function EmploymentRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace(ROUTES.PROFILE.RESUME.path)
  }, [router])
  return null
}
