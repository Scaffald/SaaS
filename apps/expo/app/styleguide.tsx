import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { Stack } from 'expo-router'

export default function StyleguidePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new styleguide structure
    router.replace('/styleguide/typography')
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
