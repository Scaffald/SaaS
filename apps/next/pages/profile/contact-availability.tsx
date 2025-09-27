import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function ProfileContactAvailabilityRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/profile/contact')
  }, [router])

  return null
}
