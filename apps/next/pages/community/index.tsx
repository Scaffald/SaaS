import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES } from '@app/core/constants/routes'

export default function CommunityRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(ROUTES.COMMUNITY)
  }, [router])

  return null
}
