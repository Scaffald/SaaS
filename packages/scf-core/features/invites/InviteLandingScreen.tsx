/**
 * The page an invite link opens (#1395): who invited you, and one way in.
 *
 * The code is saved on arrival (see pendingInvite.ts) so that whichever way
 * the visitor signs up, their first session can claim it. Signing up itself
 * is the normal auth screen on its "Create account" tab; this page doesn't
 * duplicate the magic-link form.
 */
import { Avatar, Button, Heading, Spinner, Stack, Text } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ROUTES } from '../../constants/routes'
import { useSessionContext } from '../../utils/supabase/useSessionContext'
import { fetchInvitePreview, type InvitePreview } from './invitesApi'
import { normalizeInviteCode, storePendingInvite } from './pendingInvite'

export interface InviteLandingScreenProps {
  code: string
  /** From the SSR loader on web; undefined means "not fetched yet", null means "no such invite". */
  initialPreview?: InvitePreview | null
}

const REASONS = [
  'Get matched to construction jobs that fit your trade and your skills.',
  'Show your certifications, experience and work in one profile.',
  'Hear from employers directly. Free for workers.',
]

export function initials(firstName: string): string {
  return firstName.trim().charAt(0).toUpperCase() || 'S'
}

export function InviteLandingScreen({ code, initialPreview }: InviteLandingScreenProps) {
  const router = useRouter()
  const { session, isLoading: sessionLoading } = useSessionContext()
  const signedIn = Boolean(session?.user)
  const validCode = normalizeInviteCode(code)
  const [preview, setPreview] = useState<InvitePreview | null | undefined>(
    validCode ? initialPreview : null
  )

  // Client fetch when the loader didn't run (native) or didn't answer.
  useEffect(() => {
    if (!validCode || preview !== undefined) return
    let cancelled = false
    fetchInvitePreview(validCode)
      .then((p) => !cancelled && setPreview(p))
      .catch(() => !cancelled && setPreview(null))
    return () => {
      cancelled = true
    }
  }, [validCode, preview])

  // Remember the code for the claim after sign-up, on arrival: before the
  // session or the preview settles. A stale stored session fires SIGNED_OUT
  // on load and the app moves to /auth (AuthStateChangeHandler), so waiting
  // would lose the code for exactly the visitor who is about to sign up.
  // Saving one that turns out not to count is harmless: the claim answers
  // invalid_code (404) or not_new for an existing member, and clears it.
  useEffect(() => {
    if (validCode && !signedIn) void storePendingInvite(validCode)
  }, [validCode, signedIn])

  const join = () => router.push({ pathname: ROUTES.AUTH.LOGIN.path, params: { intent: 'worker' } })

  if (preview === undefined || sessionLoading) {
    return (
      <Stack align="center" justify="center" gap={12} style={{ minHeight: 420 }}>
        <Spinner size="lg" />
        <Text color="gray">Opening your invite…</Text>
      </Stack>
    )
  }

  const name = preview?.inviter.firstName ?? null

  return (
    <Stack
      align="center"
      justify="center"
      style={{ minHeight: 520, paddingVertical: 48, paddingHorizontal: 16 }}
    >
      <Stack
        gap={24}
        align="center"
        style={{ maxWidth: 440, width: '100%' }}
        testID="invite-landing"
      >
        {preview ? (
          <Avatar
            size={72}
            src={preview.inviter.avatarUrl ?? undefined}
            initials={initials(preview.inviter.firstName)}
            alt={preview.inviter.firstName}
          />
        ) : null}

        <Stack gap={8} align="center">
          <Heading level={2} align="center">
            {name ? `${name} invited you to Scaffald` : 'This invite link has expired'}
          </Heading>
          <Text color="gray" align="center">
            {name
              ? 'Scaffald is where construction workers find their next job and get hired on their skills.'
              : "You can still join Scaffald. It's where construction workers find their next job."}
          </Text>
        </Stack>

        {!signedIn ? (
          <Stack gap={12} style={{ width: '100%' }}>
            {REASONS.map((reason) => (
              <Text key={reason} size="sm">
                {`•  ${reason}`}
              </Text>
            ))}
          </Stack>
        ) : null}

        {signedIn ? (
          <Stack gap={12} align="center" style={{ width: '100%' }}>
            <Text align="center">You're already on Scaffald.</Text>
            <Button
              size="lg"
              variant="filled"
              fullWidth
              onPress={() => router.replace(ROUTES.DASHBOARD.path)}
            >
              Go to your dashboard
            </Button>
          </Stack>
        ) : (
          <Stack gap={12} align="center" style={{ width: '100%' }}>
            <Button size="lg" variant="filled" fullWidth onPress={join} testID="invite-join">
              {name ? `Join ${name} on Scaffald` : 'Join Scaffald'}
            </Button>
            <Text size="sm" color="gray" align="center">
              Free for workers. We'll email you a sign-in link; no password needed.
            </Text>
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
