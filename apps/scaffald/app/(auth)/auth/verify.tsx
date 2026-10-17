import { AuthCard } from '@scf/core/features/auth/components/AuthCard'
import { MagicLinkPending } from '@scf/core/features/auth/components/MagicLinkPending'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const params = useLocalSearchParams<{ email?: string }>()
  // SC-66: email may be absent when the user arrived via the
  // "Use one-time code" link on the login screen. MagicLinkPending
  // renders an inline email Input in that case.
  const email = typeof params.email === 'string' && params.email.trim() ? params.email : undefined

  // The same card as /auth (#1210), so sending the link does not swap the
  // frame the visitor was just looking at.
  return (
    <AuthCard>
      <MagicLinkPending email={email} />
    </AuthCard>
  )
}
