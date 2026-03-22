/**
 * Redirect: ID Verification was renamed to Verification.
 * Old path /profile/id-verification → /profile/verification
 */

import { ROUTES } from '@scf/core/constants/routes'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function IdVerificationRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace(ROUTES.PROFILE.ID_VERIFICATION.path)
  }, [router])
  return null
}
