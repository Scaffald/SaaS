import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES } from '@app/core/constants/routes'

export default function ResetPasswordRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(ROUTES.CONFIRM)
  }, [router])

  return null
}
