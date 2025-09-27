import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ROUTES, DASHBOARD_ROUTES } from '@app/core/constants/routes'

export default function SettingsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace(DASHBOARD_ROUTES.SETTINGS?.fullPath || '/dashboard/settings')
  }, [router])

  return null
}
