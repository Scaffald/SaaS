import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES, AUTH_ROUTES } from '@app/core/constants/routes'

export default function SignInRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(AUTH_ROUTES.INDEX?.fullPath || '/auth')
  }, [router])

  return null
}
