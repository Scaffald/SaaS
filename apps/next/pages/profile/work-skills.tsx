import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function ProfileWorkSkillsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/profile/skills')
  }, [router])

  return null
}
