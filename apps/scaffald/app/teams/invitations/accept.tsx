import { buildPath, ROUTES } from '@scf/core/constants/routes'
import { useAuth } from '@scf/core/provider/auth/useAuth'
import { api } from '@scf/core/utils/api'
import type { AppRouter } from '@scf/supabase/client-types'
import { AlertTriangle, CheckCircle, LogIn, XCircle } from 'lucide-react-native'
import type { inferRouterOutputs } from '@trpc/server'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Spinner, Text, Stack } from '@unicornlove/beyond-ui'

type InvitationAction = 'accept' | 'decline'
type RespondInvitationOutput = inferRouterOutputs<AppRouter>['teams']['respondToInvitation']

export default function AcceptTeamInvitationScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>()
  const router = useRouter()
  const { session, isLoading: authLoading } = useAuth()

  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'declined' | 'error'>(
    'idle'
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resultTeamId, setResultTeamId] = useState<string | null>(null)

  const respondMutation = api.teams.respondToInvitation.useMutation({
    onError: (error: unknown) => {
      console.error('[teams] Invitation response failed', error)
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to process invitation. Please try again later.'
      setErrorMessage(message)
      setStatus('error')
    },
    onSuccess: (result: RespondInvitationOutput) => {
      if (result.status === 'accepted') {
        setResultTeamId(result.teamId)
        setStatus('success')
      } else {
        setStatus('declined')
      }
    },
  })

  const isProcessing = respondMutation.isPending || status === 'pending'

  const redirectPath = useMemo(() => {
    if (!token) return ROUTES.DASHBOARD.path
    return `${ROUTES.TEAMS.INVITATIONS.ACCEPT.path}?token=${encodeURIComponent(token)}`
  }, [token])

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMessage('This invitation link is missing a token.')
    }
  }, [token])

  const handleRespond = async (action: InvitationAction) => {
    if (!token || !session?.user?.id) return

    setStatus('pending')
    setErrorMessage(null)

    await respondMutation.mutateAsync({
      action,
      responderId: session.user.id,
      token,
    })
  }

  const handleViewTeam = () => {
    if (resultTeamId) {
      router.replace(buildPath(ROUTES.DASHBOARD.TEAMS.DETAIL, { teamId: resultTeamId }))
    } else {
      router.replace(ROUTES.DASHBOARD.TEAMS.INVITATIONS.path)
    }
  }

  const renderContent = () => {
    if (!token) {
      return (
        <ErrorState
          title="Missing invitation token"
          message="We could not find the invitation token in this link. Please check the URL provided in your email."
        />
      )
    }

    if (authLoading) {
      return (
        <Stack gap="$3" alignItems="center" paddingVertical="$6">
          <Spinner size="large" />
          <Text color="$color11">Preparing secure invitation…</Text>
        </Stack>
      )
    }

    if (!session?.user) {
      return (
        <Stack gap="$4">
          <Text fontSize="$6" fontWeight="700">
            Sign in to continue
          </Text>
          <Text color="$color11">
            You&apos;ll need to sign in so we can confirm your identity and add you to the team.
          </Text>
          <Link
            href={`${ROUTES.AUTH.LOGIN.path}?redirect_to=${encodeURIComponent(redirectPath)}`}
            asChild
          >
            <Button icon={LogIn} size="$4">
              Sign in or create an account
            </Button>
          </Link>
        </Stack>
      )
    }

    if (status === 'success') {
      return (
        <Stack gap="$4" alignItems="center" paddingVertical="$4">
          <CheckCircle size={48} color="$green9" />
          <Stack gap="$2" alignItems="center">
            <Text fontSize="$7" fontWeight="700">
              You&apos;re in!
            </Text>
            <Text color="$color11">
              You now have access to the team workspace. We&apos;ve added it to your dashboard.
            </Text>
          </Stack>
          <Button size="$4" onPress={handleViewTeam}>
            Go to team
          </Button>
        </Stack>
      )
    }

    if (status === 'declined') {
      return (
        <Stack gap="$4" alignItems="center" paddingVertical="$4">
          <XCircle size={48} color="$red9" />
          <Stack gap="$2" alignItems="center">
            <Text fontSize="$7" fontWeight="700">
              Invitation declined
            </Text>
            <Text color="$color11">
              You can always accept later from your dashboard if you change your mind.
            </Text>
          </Stack>
          <Button size="$4" onPress={() => router.replace(ROUTES.DASHBOARD.path)}>
            Return to dashboard
          </Button>
        </Stack>
      )
    }

    if (status === 'error' && errorMessage) {
      return <ErrorState title="Something went wrong" message={errorMessage} />
    }

    return (
      <Stack gap="$5">
        <Stack gap="$2">
          <Text fontSize="$7" fontWeight="700">
            Join this team
          </Text>
          <Text color="$color11">
            Accepting will give you access to the team workspace, shared jobs, and collaborative
            tools.
          </Text>
        </Stack>
        <Stack gap="$3">
          <Button
            size="$4"
            icon={CheckCircle}
            disabled={isProcessing}
            onPress={() => handleRespond('accept')}
          >
            Accept invitation
          </Button>
          <Button
            size="$4"
            variant="outlined"
            icon={XCircle}
            disabled={isProcessing}
            onPress={() => handleRespond('decline')}
          >
            Decline
          </Button>
        </Stack>
        {isProcessing ? (
          <Stack gap="$2" alignItems="center">
            <Spinner size="large" />
            <Text color="$color11">Processing your response…</Text>
          </Stack>
        ) : null}
      </Stack>
    )
  }

  return (
    <Stack
      flex={1}
      padding="$4"
      backgroundColor="$color2"
      justifyContent="center"
      alignItems="center"
    >
      <Card
        width="100%"
        maxWidth={480}
        padding="$5"
        gap="$5"
        borderWidth={1}
        borderColor="$borderColor"
      >
        {renderContent()}
      </Card>
    </Stack>
  )
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <Stack gap="$3" alignItems="center" paddingVertical="$4">
      <AlertTriangle size={48} color="$yellow9" />
      <Stack gap="$2" alignItems="center">
        <Text fontSize="$7" fontWeight="700">
          {title}
        </Text>
        <Text color="$color11">{message}</Text>
      </Stack>
    </Stack>
  )
}
