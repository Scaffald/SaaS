import { buildPath, ROUTES } from '@scf/core/constants/routes'
import { useAuth } from '@scf/core/provider/auth/useAuth'
import { useRespondToTeamInvitationWithToken } from '@scaffald/sdk/react'
import { AlertTriangle, CheckCircle, LogIn, XCircle } from 'lucide-react-native'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Spinner, Text, Stack } from '@unicornlove/beyond-ui'

type InvitationAction = 'accept' | 'decline'

export default function AcceptTeamInvitationScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>()
  const router = useRouter()
  const { session, isLoading: authLoading } = useAuth()

  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'declined' | 'error'>(
    'idle'
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resultTeamId, setResultTeamId] = useState<string | null>(null)

  const respondMutation = useRespondToTeamInvitationWithToken({
    onError: (error: unknown) => {
      console.error('[teams] Invitation response failed', error)
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to process invitation. Please try again later.'
      setErrorMessage(message)
      setStatus('error')
    },
    onSuccess: (result) => {
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
      token,
      action,
      responderId: session.user.id,
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
        <Stack gap={12} align="center">
          <Spinner size="lg" />
          <Text color="$color11">Preparing secure invitation…</Text>
        </Stack>
      )
    }

    if (!session?.user) {
      return (
        <Stack gap={16}>
          <Text>
            Sign in to continue
          </Text>
          <Text color="$color11">
            You&apos;ll need to sign in so we can confirm your identity and add you to the team.
          </Text>
          <Link
            href={`${ROUTES.AUTH.LOGIN.path}?redirect_to=${encodeURIComponent(redirectPath)}`}
            asChild
          >
            <Button icon={LogIn} size={16}>
              Sign in or create an account
            </Button>
          </Link>
        </Stack>
      )
    }

    if (status === 'success') {
      return (
        <Stack gap={16} align="center">
          <CheckCircle size={48} color="$green9" />
          <Stack gap={8} align="center">
            <Text>
              You&apos;re in!
            </Text>
            <Text color="$color11">
              You now have access to the team workspace. We&apos;ve added it to your dashboard.
            </Text>
          </Stack>
          <Button size={16} onPress={handleViewTeam}>
            Go to team
          </Button>
        </Stack>
      )
    }

    if (status === 'declined') {
      return (
        <Stack gap={16} align="center">
          <XCircle size={48} color="$red9" />
          <Stack gap={8} align="center">
            <Text>
              Invitation declined
            </Text>
            <Text color="$color11">
              You can always accept later from your dashboard if you change your mind.
            </Text>
          </Stack>
          <Button size={16} onPress={() => router.replace(ROUTES.DASHBOARD.path)}>
            Return to dashboard
          </Button>
        </Stack>
      )
    }

    if (status === 'error' && errorMessage) {
      return <ErrorState title="Something went wrong" message={errorMessage} />
    }

    return (
      <Stack gap={20}>
        <Stack gap={8}>
          <Text>
            Join this team
          </Text>
          <Text color="$color11">
            Accepting will give you access to the team workspace, shared jobs, and collaborative
            tools.
          </Text>
        </Stack>
        <Stack gap={12}>
          <Button
            size={16}
            icon={CheckCircle}
            disabled={isProcessing}
            onPress={() => handleRespond('accept')}
          >
            Accept invitation
          </Button>
          <Button
            size={16}
            variant="outline"
            icon={XCircle}
            disabled={isProcessing}
            onPress={() => handleRespond('decline')}
          >
            Decline
          </Button>
        </Stack>
        {isProcessing ? (
          <Stack gap={8} align="center">
            <Spinner size="lg" />
            <Text color="$color11">Processing your response…</Text>
          </Stack>
        ) : null}
      </Stack>
    )
  }

  return (
    <Stack
     
      padding={16}
     
      justify="center"
      align="center"
    >
      <Card
        width="100%"
        maxWidth={480}
        padding={20}
        gap={20}
       
       
      >
        {renderContent()}
      </Card>
    </Stack>
  )
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <Stack gap={12} align="center">
      <AlertTriangle size={48} color="$yellow9" />
      <Stack gap={8} align="center">
        <Text>
          {title}
        </Text>
        <Text color="$color11">{message}</Text>
      </Stack>
    </Stack>
  )
}
