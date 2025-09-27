import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES, AUTH_ROUTES } from '@app/core/constants/routes'

export default function ResetPasswordRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(AUTH_ROUTES.CONFIRM?.fullPath || '/auth/confirm')
  }, [router])

  return null
}
