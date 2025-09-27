import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function ProfileBasicInfoRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/profile/general')
  }, [router])

  return null
}
