import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'

export default function ProfileRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(DASHBOARD_ROUTES.PROFILE?.fullPath || '/dashboard/profile')
  }, [router])

  return null
}
