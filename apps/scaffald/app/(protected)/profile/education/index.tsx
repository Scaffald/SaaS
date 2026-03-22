/**
 * Redirect: Education was merged into Experience.
 * Old links to /profile/education go to the experience page.
 */

import { ROUTES } from '@scf/core/constants/routes'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function EducationRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace(ROUTES.PROFILE.EXPERIENCE.path)
  }, [router])
  return null
}
