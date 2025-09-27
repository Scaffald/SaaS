import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES } from '@app/core/constants/routes'

export default function ProfileOverviewRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(ROUTES.PROFILE_OVERVIEW)
  }, [router])

  return null
}
