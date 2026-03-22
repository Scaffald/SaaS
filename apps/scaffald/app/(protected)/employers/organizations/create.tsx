/**
 * Redirect: /dashboard/organizations/create → /employers/create
 */

import { ROUTES } from '@scf/core/constants/routes'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function OrganizationsCreateRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace(ROUTES.EMPLOYERS.CREATE.path)
  }, [router])
  return null
}
