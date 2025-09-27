import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'

export default function OrganizationsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(DASHBOARD_ROUTES.ORGANIZATIONS?.fullPath || '/dashboard/organizations')
  }, [router])

  return null
}
