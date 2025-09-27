import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function GeneralSettingsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/settings/general')
  }, [router])

  return null
}
