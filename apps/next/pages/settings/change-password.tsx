import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function ChangePasswordRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/settings/authentication')
  }, [router])

  return null
}
