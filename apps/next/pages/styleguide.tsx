import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function StyleguidePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new dashboard styleguide structure
    router.replace('/dashboard/styleguide/typography')
  }, [router])

  return null
}
