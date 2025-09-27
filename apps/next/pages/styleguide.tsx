import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function StyleguidePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new styleguide structure
    router.replace('/styleguide/typography')
  }, [router])

  return null
}
