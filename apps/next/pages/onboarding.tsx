import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES, AUTH_ROUTES } from '@app/core/constants/routes'

export default function OnboardingRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(AUTH_ROUTES.WELCOME?.fullPath || '/auth/welcome')
  }, [router])

  return null
}
