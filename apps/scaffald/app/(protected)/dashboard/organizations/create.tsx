/**
 * Redirect: /dashboard/organizations/create → /dashboard/employers/create
 */

import { ROUTES } from '@scf/core/constants/routes'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function OrganizationsCreateRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace(ROUTES.DASHBOARD.DISCOVER.EMPLOYERS.CREATE.path)
  }, [router])
  return null
}
