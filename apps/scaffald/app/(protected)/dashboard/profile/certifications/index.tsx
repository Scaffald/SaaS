/**
 * Redirect: Certifications was merged into Skills.
 * Old links to /dashboard/profile/certifications go to the skills page.
 */

import { ROUTES } from '@scf/core/constants/routes'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function CertificationsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace(ROUTES.DASHBOARD.PROFILE.SKILLS.path)
  }, [router])
  return null
}
