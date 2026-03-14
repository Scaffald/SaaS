/**
 * Redirect: /dashboard/organizations → /org (My Organizations)
 */

import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function OrganizationsRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/org')
  }, [router])
  return null
}
