import { useUser } from '@app/core/utils/useUser'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES, AUTH_ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'

export default function RootIndex() {
  const { user, isPending } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isPending) {
      return // Still loading
    }

    // Redirect based on authentication status
    if (user) {
      router.replace(DASHBOARD_ROUTES.INDEX?.fullPath || '/dashboard')
    } else {
      router.replace(AUTH_ROUTES.INDEX?.fullPath || '/auth')
    }
  }, [user, isPending, router])

  // Show loading state while redirecting
  return null
}
