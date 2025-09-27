import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function ProfileEditRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/profile/edit')
  }, [router])

  return null
}
