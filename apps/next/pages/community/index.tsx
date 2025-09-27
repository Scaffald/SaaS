import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'

export default function CommunityRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(DASHBOARD_ROUTES.COMMUNITY?.fullPath || '/dashboard/community')
  }, [router])

  return null
}
