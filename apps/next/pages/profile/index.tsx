import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES } from '@app/core/constants/routes'

export default function ProfileRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(ROUTES.PROFILE)
  }, [router])

  return null
}
