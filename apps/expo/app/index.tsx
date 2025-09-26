import { useUser } from '@app/core/utils/useUser'
import { Redirect } from 'expo-router'

export default function RootIndex() {
  const { user, isPending } = useUser()

  // Show loading state while checking auth
  if (isPending) {
    return null
  }

  // Redirect based on authentication status
  if (user) {
    return <Redirect href="/dashboard" />
  } else {
    return <Redirect href="/auth/onboarding" />
  }
}
