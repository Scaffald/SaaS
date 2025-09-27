import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'

export default function ProfileOverviewRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(
      DASHBOARD_ROUTES.PROFILE?.childrenArray?.find((r) => r.path === '/dashboard/profile/overview')
        ?.fullPath || '/dashboard/profile/overview'
    )
  }, [router])

  return null
}
