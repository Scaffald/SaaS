import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function ChangeEmailRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/settings/security')
  }, [router])

  return null
}
