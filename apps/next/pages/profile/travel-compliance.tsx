import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function ProfileTravelComplianceRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/profile/preferences')
  }, [router])

  return null
}
