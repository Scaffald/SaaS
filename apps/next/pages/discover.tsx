import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES } from '@app/core/constants/routes'

export default function DiscoverRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(ROUTES.WORKERS_MAP)
  }, [router])

  return null
}
