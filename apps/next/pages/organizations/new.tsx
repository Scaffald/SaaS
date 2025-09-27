import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES } from '@app/core/constants/routes'

export default function CreateOrganizationRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(ROUTES.ORGANIZATIONS_NEW)
  }, [router])

  return null
}
