import { useAuth } from '@app/core/provider/auth/useAuth'
import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import { AlertTriangle, CheckCircle, LogIn, XCircle } from '@tamagui/lucide-icons'
import type { inferRouterOutputs } from '@trpc/server'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Spinner, Text, YStack } from 'tamagui'

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
    onSuccess: (result: RespondInvitationOutput) => {
      if (result.status === 'accepted') {
        setResultTeamId(result.teamId)
        setStatus('success')
      } else {
        setStatus('declined')
      }
    },
    onError: (error: Error) => {
      console.error('[teams] Invitation response failed', error)
      setErrorMessage(error.message || 'Unable to process invitation. Please try again later.')
      setStatus('error')
    },
  })

  const isProcessing = respondMutation.isPending || status === 'pending'

  const redirectPath = useMemo(() => {
    if (!token) return '/dashboard'
    return `/teams/invitations/accept?token=${encodeURIComponent(token)}`
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
      router.replace(`/dashboard/teams/${resultTeamId}`)
    } else {
      router.replace('/dashboard/teams/invitations')
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
        <YStack gap="$3" items="center" py="$6">
          <Spinner size="large" />
          <Text color="$color11">Preparing secure invitation…</Text>
        </YStack>
      )
    }

    if (!session?.user) {
      return (
        <YStack gap="$4">
          <Text fontSize="$6" fontWeight="700">
            Sign in to continue
          </Text>
          <Text color="$color11">
            You&apos;ll need to sign in so we can confirm your identity and add you to the team.
          </Text>
          <Link href={`/auth?redirect_to=${encodeURIComponent(redirectPath)}`} asChild>
            <Button icon={LogIn} size="$4">
              Sign in or create an account
            </Button>
          </Link>
        </YStack>
      )
    }

    if (status === 'success') {
      return (
        <YStack gap="$4" items="center" py="$4">
          <CheckCircle size={48} color="$green9" />
          <YStack gap="$2" items="center">
            <Text fontSize="$7" fontWeight="700">
              You&apos;re in!
            </Text>
            <Text color="$color11">
              You now have access to the team workspace. We&apos;ve added it to your dashboard.
            </Text>
          </YStack>
          <Button size="$4" onPress={handleViewTeam}>
            Go to team
          </Button>
        </YStack>
      )
    }

    if (status === 'declined') {
      return (
        <YStack gap="$4" items="center" py="$4">
          <XCircle size={48} color="$red9" />
          <YStack gap="$2" items="center">
            <Text fontSize="$7" fontWeight="700">
              Invitation declined
            </Text>
            <Text color="$color11">
              You can always accept later from your dashboard if you change your mind.
            </Text>
          </YStack>
          <Button size="$4" onPress={() => router.replace('/dashboard')}>
            Return to dashboard
          </Button>
        </YStack>
      )
    }

    if (status === 'error' && errorMessage) {
      return <ErrorState title="Something went wrong" message={errorMessage} />
    }

    return (
      <YStack gap="$5">
        <YStack gap="$2">
          <Text fontSize="$7" fontWeight="700">
            Join this team
          </Text>
          <Text color="$color11">
            Accepting will give you access to the team workspace, shared jobs, and collaborative
            tools.
          </Text>
        </YStack>
        <YStack gap="$3">
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
        </YStack>
        {isProcessing ? (
          <YStack gap="$2" items="center">
            <Spinner size="large" />
            <Text color="$color11">Processing your response…</Text>
          </YStack>
        ) : null}
      </YStack>
    )
  }

  return (
    <YStack flex={1} p="$4" bg="$color2" justify="center" items="center">
      <Card width="100%" maxWidth={480} p="$5" gap="$5" borderWidth={1} borderColor="$borderColor">
        {renderContent()}
      </Card>
    </YStack>
  )
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <YStack gap="$3" items="center" py="$4">
      <AlertTriangle size={48} color="$yellow9" />
      <YStack gap="$2" items="center">
        <Text fontSize="$7" fontWeight="700">
          {title}
        </Text>
        <Text color="$color11">{message}</Text>
      </YStack>
    </YStack>
  )
}
