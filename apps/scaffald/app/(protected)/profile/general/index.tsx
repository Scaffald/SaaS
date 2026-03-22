/**
 * Redirect: General was merged into Resumé.
 * Old links to /profile/general go to the resume page.
 */

import { ROUTES } from '@scf/core/constants/routes'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function GeneralRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace(ROUTES.PROFILE.RESUME.path)
  }, [router])
  return null
}
