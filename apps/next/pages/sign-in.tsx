import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES } from '@app/core/constants/routes'

export default function SignInRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(ROUTES.AUTH)
  }, [router])

  return null
}
