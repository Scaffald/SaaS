import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { Stack } from 'expo-router'

export default function StyleguidePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new dashboard styleguide structure
    router.replace('/dashboard/styleguide/typography')
  }, [router])

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Component Styleguide',
          headerShown: true,
        }}
      />
    </>
  )
}
