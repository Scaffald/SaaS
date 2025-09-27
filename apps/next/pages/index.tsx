import { useUser } from '@app/core/utils/useUser'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES } from '@app/core/constants/routes'

export default function RootIndex() {
  const { user, isPending } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isPending) {
      return // Still loading
    }

    // Redirect based on authentication status
    if (user) {
      router.replace(ROUTES.DASHBOARD)
    } else {
      router.replace(ROUTES.AUTH)
    }
  }, [user, isPending, router])

  // Show loading state while redirecting
  return null
}
