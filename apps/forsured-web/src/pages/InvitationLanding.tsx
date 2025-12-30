/**
 * Invitation Landing Page
 * REQ-128: Flexible Invitation System - Task 7
 *
 * Landing page for invitation links that handles:
 * - Anonymous users (show signup/signin options)
 * - Authenticated users (show accept/decline options)
 * - Constraint warnings for one-to-one relationships
 * - Success/error states
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  YStack,
  XStack,
  Text,
  Button,
  Card,
  H1,
  H2,
  SizableText,
  Spinner,
  TextArea,
} from '@unicornlove/ui'
import {
  Mail,
  UserPlus,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
  LogIn,
  Quote,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { trpc } from '../lib/trpc'

export default function InvitationLandingPage() {
  const { code } = useParams<{ code: string }>()
  const [searchParams] = useSearchParams()
  const action = searchParams.get('action')
  const navigate = useNavigate()
  const { user, profile, isLoading: authLoading } = useAuth()

  // State for decline reason
  const [showDeclineReason, setShowDeclineReason] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fetch invitation by code (public procedure)
  const {
    data: invitation,
    isLoading,
    error,
    refetch,
  } = trpc.genericInvitations.getByCode.useQuery(
    { code: code || '' },
    { enabled: !!code, retry: false }
  )

  // Accept mutation
  const acceptMutation = trpc.genericInvitations.accept.useMutation({
    onSuccess: () => {
      setSuccessMessage('Invitation accepted! Redirecting to your dashboard...')
      // Redirect to appropriate dashboard after short delay
      setTimeout(() => {
        if (profile?.user_type) {
          const dashboardPath =
            profile.user_type === 'gc'
              ? '/manager/dashboard'
              : profile.user_type === 'contractor'
                ? '/subcontractor/dashboard'
                : `/${profile.user_type}/dashboard`
          navigate(dashboardPath)
        } else {
          navigate('/')
        }
      }, 2000)
    },
    onError: (err) => {
      setErrorMessage(err.message || 'Failed to accept invitation')
    },
  })

  // Decline mutation
  const declineMutation = trpc.genericInvitations.decline.useMutation({
    onSuccess: () => {
      setSuccessMessage('Invitation declined.')
      setTimeout(() => {
        navigate('/')
      }, 2000)
    },
    onError: (err) => {
      setErrorMessage(err.message || 'Failed to decline invitation')
    },
  })

  // Handle auto-accept/decline if action is in URL
  useEffect(() => {
    if (!invitation || !user || !profile) return

    if (action === 'accept' && !acceptMutation.isPending && !successMessage) {
      // Auto-trigger accept (user can still cancel)
    } else if (action === 'decline' && !declineMutation.isPending && !successMessage) {
      // Auto-show decline form
      setShowDeclineReason(true)
    }
  }, [action, invitation, user, profile])

  const handleAccept = () => {
    if (!invitation?.id) return
    setErrorMessage(null)
    acceptMutation.mutate({ invitationId: invitation.id })
  }

  const handleDecline = () => {
    if (!invitation?.id) return
    setErrorMessage(null)
    declineMutation.mutate({
      invitationId: invitation.id,
      reason: declineReason.trim() || undefined,
    })
  }

  // Loading states
  if (isLoading || authLoading) {
    return (
      <YStack
        minHeight="100vh"
        backgroundColor="$gray2"
        alignItems="center"
        justifyContent="center"
        padding="$4"
      >
        <Card padding="$8" maxWidth={500} width="100%">
          <YStack alignItems="center" gap="$4">
            <Spinner size="large" color="$blue10" />
            <SizableText fontSize="$4" color="$gray11">
              Loading invitation...
            </SizableText>
          </YStack>
        </Card>
      </YStack>
    )
  }

  // Invitation not found
  if (error || !invitation) {
    return (
      <YStack
        minHeight="100vh"
        backgroundColor="$gray2"
        alignItems="center"
        justifyContent="center"
        padding="$4"
      >
        <Card padding="$8" maxWidth={500} width="100%">
          <YStack alignItems="center" gap="$4">
            <YStack
              width={64}
              height={64}
              borderRadius={32}
              backgroundColor="$red3"
              alignItems="center"
              justifyContent="center"
            >
              <X size={32} color="var(--red10)" />
            </YStack>
            <H2 textAlign="center">Invitation Not Found</H2>
            <SizableText fontSize="$3" color="$gray11" textAlign="center">
              This invitation may have expired, been cancelled, or the link is invalid.
            </SizableText>
            <Button onPress={() => navigate('/')} marginTop="$4">
              <XStack alignItems="center" gap="$2">
                <ArrowRight size={16} />
                <Text>Go to Home</Text>
              </XStack>
            </Button>
          </YStack>
        </Card>
      </YStack>
    )
  }

  // Already processed invitation
  if (invitation.status !== 'pending') {
    const statusMessage = {
      accepted: 'This invitation has already been accepted.',
      declined: 'This invitation was declined.',
      expired: 'This invitation has expired.',
    }[invitation.status as 'accepted' | 'declined' | 'expired']

    return (
      <YStack
        minHeight="100vh"
        backgroundColor="$gray2"
        alignItems="center"
        justifyContent="center"
        padding="$4"
      >
        <Card padding="$8" maxWidth={500} width="100%">
          <YStack alignItems="center" gap="$4">
            <YStack
              width={64}
              height={64}
              borderRadius={32}
              backgroundColor="$gray4"
              alignItems="center"
              justifyContent="center"
            >
              <Mail size={32} color="var(--gray10)" />
            </YStack>
            <H2 textAlign="center">Invitation {invitation.status}</H2>
            <SizableText fontSize="$3" color="$gray11" textAlign="center">
              {statusMessage}
            </SizableText>
            <Button onPress={() => navigate('/')} marginTop="$4">
              <XStack alignItems="center" gap="$2">
                <ArrowRight size={16} />
                <Text>Go to Home</Text>
              </XStack>
            </Button>
          </YStack>
        </Card>
      </YStack>
    )
  }

  // Success message
  if (successMessage) {
    return (
      <YStack
        minHeight="100vh"
        backgroundColor="$gray2"
        alignItems="center"
        justifyContent="center"
        padding="$4"
      >
        <Card padding="$8" maxWidth={500} width="100%">
          <YStack alignItems="center" gap="$4">
            <YStack
              width={64}
              height={64}
              borderRadius={32}
              backgroundColor="$green3"
              alignItems="center"
              justifyContent="center"
            >
              <Check size={32} color="var(--green10)" />
            </YStack>
            <H2 textAlign="center">Success!</H2>
            <SizableText fontSize="$3" color="$gray11" textAlign="center">
              {successMessage}
            </SizableText>
            <Spinner size="small" color="$blue10" marginTop="$2" />
          </YStack>
        </Card>
      </YStack>
    )
  }

  // Anonymous user - show signup/signin options
  if (!user || !profile) {
    return (
      <YStack
        minHeight="100vh"
        backgroundColor="$gray2"
        alignItems="center"
        justifyContent="center"
        padding="$4"
      >
        <Card padding="$8" maxWidth={500} width="100%">
          <YStack gap="$6">
            {/* Header */}
            <YStack alignItems="center" gap="$4">
              <YStack
                width={64}
                height={64}
                borderRadius={32}
                backgroundColor="$blue3"
                alignItems="center"
                justifyContent="center"
              >
                <UserPlus size={32} color="var(--blue10)" />
              </YStack>
              <H1 textAlign="center" fontSize="$8">
                You've Been Invited!
              </H1>
              {invitation.inviter?.full_name && (
                <SizableText fontSize="$4" color="$gray11" textAlign="center">
                  <SizableText fontWeight="600" color="$gray12">
                    {invitation.inviter.full_name}
                  </SizableText>{' '}
                  has invited you to join ForSured
                  {invitation.rule?.target_role && (
                    <>
                      {' '}
                      as a{' '}
                      <SizableText fontWeight="600" color="$blue10">
                        {invitation.rule.target_role}
                      </SizableText>
                    </>
                  )}
                  .
                </SizableText>
              )}
            </YStack>

            {/* Personal Message */}
            {invitation.personal_message && (
              <YStack
                backgroundColor="$blue2"
                borderWidth={1}
                borderColor="$blue6"
                borderRadius="$4"
                padding="$4"
              >
                <XStack alignItems="flex-start" gap="$3">
                  <Quote size={20} color="var(--blue10)" style={{ marginTop: 2 }} />
                  <YStack flex={1}>
                    <SizableText
                      fontSize="$3"
                      fontStyle="italic"
                      color="$gray12"
                      lineHeight="$3"
                    >
                      "{invitation.personal_message}"
                    </SizableText>
                    {invitation.inviter?.full_name && (
                      <SizableText fontSize="$2" color="$blue11" marginTop="$2">
                        — {invitation.inviter.full_name}
                      </SizableText>
                    )}
                  </YStack>
                </XStack>
              </YStack>
            )}

            {/* Action Buttons */}
            <YStack gap="$3">
              <Link
                to={`/signup?ref=${code}`}
                style={{ textDecoration: 'none', width: '100%' }}
              >
                <Button width="100%" size="$5">
                  <XStack alignItems="center" gap="$2">
                    <UserPlus size={18} />
                    <Text fontSize="$4">Create Account</Text>
                  </XStack>
                </Button>
              </Link>
              <Link
                to={`/?ref=${code}&redirect=/invite/${code}`}
                style={{ textDecoration: 'none', width: '100%' }}
              >
                <Button variant="outlined" width="100%" size="$5">
                  <XStack alignItems="center" gap="$2">
                    <LogIn size={18} />
                    <Text fontSize="$4">I Already Have an Account</Text>
                  </XStack>
                </Button>
              </Link>
            </YStack>

            {/* Info */}
            <SizableText fontSize="$2" color="$gray10" textAlign="center">
              By accepting, you'll be connected with {invitation.inviter?.full_name || 'the inviter'}{' '}
              on ForSured.
            </SizableText>
          </YStack>
        </Card>
      </YStack>
    )
  }

  // Authenticated user - show accept/decline options
  return (
    <YStack
      minHeight="100vh"
      backgroundColor="$gray2"
      alignItems="center"
      justifyContent="center"
      padding="$4"
    >
      <Card padding="$8" maxWidth={500} width="100%">
        <YStack gap="$6">
          {/* Header */}
          <YStack alignItems="center" gap="$4">
            <YStack
              width={64}
              height={64}
              borderRadius={32}
              backgroundColor="$blue3"
              alignItems="center"
              justifyContent="center"
            >
              <Mail size={32} color="var(--blue10)" />
            </YStack>
            <H2 textAlign="center">
              {invitation.rule?.name || 'Invitation'}
            </H2>
            {invitation.inviter?.full_name && (
              <SizableText fontSize="$3" color="$gray11" textAlign="center">
                From{' '}
                <SizableText fontWeight="600" color="$gray12">
                  {invitation.inviter.full_name}
                </SizableText>
              </SizableText>
            )}
          </YStack>

          {/* Error Message */}
          {errorMessage && (
            <YStack
              backgroundColor="$red2"
              borderWidth={1}
              borderColor="$red6"
              borderRadius="$4"
              padding="$3"
            >
              <SizableText fontSize="$3" color="$red11">
                {errorMessage}
              </SizableText>
            </YStack>
          )}

          {/* Personal Message */}
          {invitation.personal_message && (
            <YStack
              backgroundColor="$blue2"
              borderWidth={1}
              borderColor="$blue6"
              borderRadius="$4"
              padding="$4"
            >
              <XStack alignItems="flex-start" gap="$3">
                <Quote size={20} color="var(--blue10)" style={{ marginTop: 2 }} />
                <YStack flex={1}>
                  <SizableText
                    fontSize="$3"
                    fontStyle="italic"
                    color="$gray12"
                    lineHeight="$3"
                  >
                    "{invitation.personal_message}"
                  </SizableText>
                </YStack>
              </XStack>
            </YStack>
          )}

          {/* Constraint Warning */}
          {invitation.constraint_blocked && (
            <YStack
              backgroundColor="$yellow2"
              borderWidth={1}
              borderColor="$yellow6"
              borderRadius="$4"
              padding="$4"
            >
              <XStack alignItems="flex-start" gap="$3">
                <AlertTriangle size={20} color="var(--yellow11)" style={{ marginTop: 2 }} />
                <YStack flex={1}>
                  <SizableText fontSize="$3" fontWeight="600" color="$yellow11">
                    Relationship Constraint
                  </SizableText>
                  <SizableText fontSize="$2" color="$yellow11" marginTop="$1">
                    {invitation.constraint_reason ||
                      'You already have an existing relationship of this type.'}
                  </SizableText>
                  <SizableText fontSize="$2" color="$yellow10" marginTop="$2">
                    You can still accept to stay connected, but no new relationship will be created.
                  </SizableText>
                </YStack>
              </XStack>
            </YStack>
          )}

          {/* Decline Reason Form */}
          {showDeclineReason ? (
            <YStack gap="$4">
              <SizableText fontSize="$3" fontWeight="500" color="$gray12">
                Reason for declining (optional)
              </SizableText>
              <TextArea
                value={declineReason}
                onChangeText={setDeclineReason}
                placeholder="Let them know why you're declining..."
                numberOfLines={3}
              />
              <XStack gap="$3">
                <Button
                  variant="outlined"
                  flex={1}
                  onPress={() => setShowDeclineReason(false)}
                  disabled={declineMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  flex={1}
                  backgroundColor="$red9"
                  onPress={handleDecline}
                  disabled={declineMutation.isPending}
                >
                  <XStack alignItems="center" gap="$2">
                    <X size={16} />
                    <Text>{declineMutation.isPending ? 'Declining...' : 'Decline'}</Text>
                  </XStack>
                </Button>
              </XStack>
            </YStack>
          ) : (
            /* Action Buttons */
            <XStack gap="$3">
              <Button
                variant="outlined"
                flex={1}
                onPress={() => setShowDeclineReason(true)}
                disabled={acceptMutation.isPending}
              >
                <XStack alignItems="center" gap="$2">
                  <X size={16} />
                  <Text>Decline</Text>
                </XStack>
              </Button>
              <Button
                flex={1}
                onPress={handleAccept}
                disabled={acceptMutation.isPending}
              >
                <XStack alignItems="center" gap="$2">
                  <Check size={16} />
                  <Text>{acceptMutation.isPending ? 'Accepting...' : 'Accept'}</Text>
                </XStack>
              </Button>
            </XStack>
          )}

          {/* Info */}
          <SizableText fontSize="$2" color="$gray10" textAlign="center">
            Logged in as {profile?.email || user.email}
          </SizableText>
        </YStack>
      </Card>
    </YStack>
  )
}
