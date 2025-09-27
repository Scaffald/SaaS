import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES } from '@app/core/constants/routes'

export default function OrganizationsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(ROUTES.ORGANIZATIONS)
  }, [router])

  return null
}
