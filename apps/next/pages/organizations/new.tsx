import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'

export default function CreateOrganizationRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(
      DASHBOARD_ROUTES.ORGANIZATIONS?.childrenArray?.find(
        (r) => r.path === '/dashboard/organizations/new'
      )?.fullPath || '/dashboard/organizations/new'
    )
  }, [router])

  return null
}
