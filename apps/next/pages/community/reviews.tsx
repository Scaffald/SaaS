import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'

export default function CommunityReviewsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(
      DASHBOARD_ROUTES.COMMUNITY?.childrenArray?.find(
        (r) => r.path === '/dashboard/community/reviews'
      )?.fullPath || '/dashboard/community/reviews'
    )
  }, [router])

  return null
}
