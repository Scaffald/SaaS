/**
 * Invitation Landing Page
 * Flexible invitation landing page
 *
 * Landing page for invitation links that handles:
 * - Anonymous users (show signup/signin options)
 * - Authenticated users (show accept/decline options)
 * - Constraint warnings for one-to-one relationships
 * - Success/error states
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Stack, Row, Text, Button, Card, H1, H2, Spinner } from '@scaffald/ui'
import { colors, spacing, fontSize, borderRadius } from '@scaffald/ui'
import Textarea from '../components/Common/Textarea'
import { Mail, UserPlus, Check, X, AlertTriangle, ArrowRight, LogIn, Quote } from 'lucide-react'
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
      <Stack
        style={{
          minHeight: '100vh',
          backgroundColor: colors.gray[50],
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[16],
        }}
      >
        <Card style={{ padding: spacing[32], maxWidth: 500, width: '100%' }}>
          <Stack style={{ alignItems: 'center', gap: spacing[16] }}>
            <Spinner size="lg" />
            <Text style={{ fontSize: fontSize.lg, color: colors.gray[700] }}>
              Loading invitation...
            </Text>
          </Stack>
        </Card>
      </Stack>
    )
  }

  // Invitation not found
  if (error || !invitation) {
    return (
      <Stack
        style={{
          minHeight: '100vh',
          backgroundColor: colors.gray[50],
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[16],
        }}
      >
        <Card style={{ padding: spacing[32], maxWidth: 500, width: '100%' }}>
          <Stack style={{ alignItems: 'center', gap: spacing[16] }}>
            <Stack
              style={{
                width: 64,
                height: 64,
                borderRadius: borderRadius.max,
                backgroundColor: colors.error[100],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={32} color={colors.error[600]} />
            </Stack>
            <H2 style={{ textAlign: 'center' }}>Invitation Not Found</H2>
            <Text
              style={{
                fontSize: fontSize.sm,
                color: colors.gray[700],
                textAlign: 'center',
              }}
            >
              This invitation may have expired, been cancelled, or the link is invalid.
            </Text>
            <Button onPress={() => navigate('/')} style={{ marginTop: spacing[16] }}>
              <Row style={{ alignItems: 'center', gap: spacing[8] }}>
                <ArrowRight size={16} />
                <Text>Go to Home</Text>
              </Row>
            </Button>
          </Stack>
        </Card>
      </Stack>
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
      <Stack
        style={{
          minHeight: '100vh',
          backgroundColor: colors.gray[50],
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[16],
        }}
      >
        <Card style={{ padding: spacing[32], maxWidth: 500, width: '100%' }}>
          <Stack style={{ alignItems: 'center', gap: spacing[16] }}>
            <Stack
              style={{
                width: 64,
                height: 64,
                borderRadius: borderRadius.max,
                backgroundColor: colors.gray[200],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={32} color={colors.gray[600]} />
            </Stack>
            <H2 style={{ textAlign: 'center' }}>Invitation {invitation.status}</H2>
            <Text
              style={{
                fontSize: fontSize.sm,
                color: colors.gray[700],
                textAlign: 'center',
              }}
            >
              {statusMessage}
            </Text>
            <Button onPress={() => navigate('/')} style={{ marginTop: spacing[16] }}>
              <Row style={{ alignItems: 'center', gap: spacing[8] }}>
                <ArrowRight size={16} />
                <Text>Go to Home</Text>
              </Row>
            </Button>
          </Stack>
        </Card>
      </Stack>
    )
  }

  // Success message
  if (successMessage) {
    return (
      <Stack
        style={{
          minHeight: '100vh',
          backgroundColor: colors.gray[50],
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[16],
        }}
      >
        <Card style={{ padding: spacing[32], maxWidth: 500, width: '100%' }}>
          <Stack style={{ alignItems: 'center', gap: spacing[16] }}>
            <Stack
              style={{
                width: 64,
                height: 64,
                borderRadius: borderRadius.max,
                backgroundColor: colors.success[100],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={32} color={colors.success[600]} />
            </Stack>
            <H2 style={{ textAlign: 'center' }}>Success!</H2>
            <Text
              style={{
                fontSize: fontSize.sm,
                color: colors.gray[700],
                textAlign: 'center',
              }}
            >
              {successMessage}
            </Text>
            <Spinner size="sm" style={{ marginTop: spacing[8] }} />
          </Stack>
        </Card>
      </Stack>
    )
  }

  // Anonymous user - show signup/signin options
  if (!user || !profile) {
    return (
      <Stack
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--color-gray-2)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-4)',
        }}
      >
        <Card style={{ padding: 'var(--space-8)', maxWidth: 500, width: '100%' }}>
          <Stack style={{ gap: 'var(--space-6)' }}>
            {/* Header */}
            <Stack style={{ alignItems: 'center', gap: 'var(--space-4)' }}>
              <Stack
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: 'var(--color-blue-3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserPlus size={32} color="var(--color-blue-10)" />
              </Stack>
              <H1 style={{ textAlign: 'center', fontSize: 'var(--font-size-8)' }}>
                You've Been Invited!
              </H1>
              {invitation.inviter?.full_name && (
                <Text
                  style={{
                    fontSize: 'var(--font-size-4)',
                    color: 'var(--color-gray-11)',
                    textAlign: 'center',
                  }}
                >
                  <Text as="span" style={{ fontWeight: 600, color: 'var(--color-gray-12)' }}>
                    {invitation.inviter.full_name}
                  </Text>{' '}
                  has invited you to join ForSured
                  {invitation.rule?.target_role && (
                    <>
                      {' '}
                      as a{' '}
                      <Text as="span" style={{ fontWeight: 600, color: 'var(--color-blue-10)' }}>
                        {invitation.rule.target_role}
                      </Text>
                    </>
                  )}
                  .
                </Text>
              )}
            </Stack>

            {/* Personal Message */}
            {invitation.personal_message && (
              <Stack
                style={{
                  backgroundColor: 'var(--color-blue-2)',
                  border: '1px solid var(--color-blue-6)',
                  borderRadius: 'var(--radius-4)',
                  padding: 'var(--space-4)',
                }}
              >
                <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <Quote size={20} color="var(--color-blue-10)" style={{ marginTop: 2 }} />
                  <Stack style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 'var(--font-size-3)',
                        fontStyle: 'italic',
                        color: 'var(--color-gray-12)',
                        lineHeight: 'var(--line-height-3)',
                      }}
                    >
                      "{invitation.personal_message}"
                    </Text>
                    {invitation.inviter?.full_name && (
                      <Text
                        style={{
                          fontSize: 'var(--font-size-2)',
                          color: 'var(--color-blue-11)',
                          marginTop: 'var(--space-2)',
                        }}
                      >
                        - {invitation.inviter.full_name}
                      </Text>
                    )}
                  </Stack>
                </Row>
              </Stack>
            )}

            {/* Action Buttons */}
            <Stack style={{ gap: 'var(--space-3)' }}>
              <Link to={`/signup?ref=${code}`} style={{ textDecoration: 'none', width: '100%' }}>
                <Button style={{ width: '100%' }} size="lg">
                  <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                    <UserPlus size={18} />
                    <Text style={{ fontSize: 'var(--font-size-4)' }}>Create Account</Text>
                  </Row>
                </Button>
              </Link>
              <Link
                to={`/?ref=${code}&redirect=/invite/${code}`}
                style={{ textDecoration: 'none', width: '100%' }}
              >
                <Button variant="outline" style={{ width: '100%' }} size="lg">
                  <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                    <LogIn size={18} />
                    <Text style={{ fontSize: 'var(--font-size-4)' }}>
                      I Already Have an Account
                    </Text>
                  </Row>
                </Button>
              </Link>
            </Stack>

            {/* Info */}
            <Text
              style={{
                fontSize: 'var(--font-size-2)',
                color: 'var(--color-gray-10)',
                textAlign: 'center',
              }}
            >
              By accepting, you'll be connected with{' '}
              {invitation.inviter?.full_name || 'the inviter'} on ForSured.
            </Text>
          </Stack>
        </Card>
      </Stack>
    )
  }

  // Authenticated user - show accept/decline options
  return (
    <Stack
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-gray-2)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
    >
      <Card style={{ padding: 'var(--space-8)', maxWidth: 500, width: '100%' }}>
        <Stack style={{ gap: 'var(--space-6)' }}>
          {/* Header */}
          <Stack style={{ alignItems: 'center', gap: 'var(--space-4)' }}>
            <Stack
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: 'var(--color-blue-3)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={32} color="var(--color-blue-10)" />
            </Stack>
            <H2 style={{ textAlign: 'center' }}>{invitation.rule?.name || 'Invitation'}</H2>
            {invitation.inviter?.full_name && (
              <Text
                style={{
                  fontSize: 'var(--font-size-3)',
                  color: 'var(--color-gray-11)',
                  textAlign: 'center',
                }}
              >
                From{' '}
                <Text as="span" style={{ fontWeight: 600, color: 'var(--color-gray-12)' }}>
                  {invitation.inviter.full_name}
                </Text>
              </Text>
            )}
          </Stack>

          {/* Error Message */}
          {errorMessage && (
            <Stack
              style={{
                backgroundColor: 'var(--color-red-2)',
                border: '1px solid var(--color-red-6)',
                borderRadius: 'var(--radius-4)',
                padding: 'var(--space-3)',
              }}
            >
              <Text style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-red-11)' }}>
                {errorMessage}
              </Text>
            </Stack>
          )}

          {/* Personal Message */}
          {invitation.personal_message && (
            <Stack
              style={{
                backgroundColor: 'var(--color-blue-2)',
                border: '1px solid var(--color-blue-6)',
                borderRadius: 'var(--radius-4)',
                padding: 'var(--space-4)',
              }}
            >
              <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <Quote size={20} color="var(--color-blue-10)" style={{ marginTop: 2 }} />
                <Stack style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 'var(--font-size-3)',
                      fontStyle: 'italic',
                      color: 'var(--color-gray-12)',
                      lineHeight: 'var(--line-height-3)',
                    }}
                  >
                    "{invitation.personal_message}"
                  </Text>
                </Stack>
              </Row>
            </Stack>
          )}

          {/* Constraint Warning */}
          {invitation.constraint_blocked && (
            <Stack
              style={{
                backgroundColor: 'var(--color-yellow-2)',
                border: '1px solid var(--color-yellow-6)',
                borderRadius: 'var(--radius-4)',
                padding: 'var(--space-4)',
              }}
            >
              <Row style={{ alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <AlertTriangle size={20} color="var(--color-yellow-11)" style={{ marginTop: 2 }} />
                <Stack style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 'var(--font-size-3)',
                      fontWeight: 600,
                      color: 'var(--color-yellow-11)',
                    }}
                  >
                    Relationship Constraint
                  </Text>
                  <Text
                    style={{
                      fontSize: 'var(--font-size-2)',
                      color: 'var(--color-yellow-11)',
                      marginTop: 'var(--space-1)',
                    }}
                  >
                    {invitation.constraint_reason ||
                      'You already have an existing relationship of this type.'}
                  </Text>
                  <Text
                    style={{
                      fontSize: 'var(--font-size-2)',
                      color: 'var(--color-yellow-10)',
                      marginTop: 'var(--space-2)',
                    }}
                  >
                    You can still accept to stay connected, but no new relationship will be created.
                  </Text>
                </Stack>
              </Row>
            </Stack>
          )}

          {/* Decline Reason Form */}
          {showDeclineReason ? (
            <Stack style={{ gap: 'var(--space-4)' }}>
              <Text
                style={{
                  fontSize: 'var(--font-size-3)',
                  fontWeight: 500,
                  color: 'var(--color-gray-12)',
                }}
              >
                Reason for declining (optional)
              </Text>
              <Textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Let them know why you're declining..."
                rows={3}
              />
              <Row style={{ gap: 'var(--space-3)' }}>
                <Button
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() => setShowDeclineReason(false)}
                  disabled={declineMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  style={{ flex: 1, backgroundColor: 'var(--color-red-9)' }}
                  onPress={handleDecline}
                  disabled={declineMutation.isPending}
                >
                  <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                    <X size={16} />
                    <Text>{declineMutation.isPending ? 'Declining...' : 'Decline'}</Text>
                  </Row>
                </Button>
              </Row>
            </Stack>
          ) : (
            /* Action Buttons */
            <Row style={{ gap: 'var(--space-3)' }}>
              <Button
                variant="outline"
                style={{ flex: 1 }}
                onPress={() => setShowDeclineReason(true)}
                disabled={acceptMutation.isPending}
              >
                <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                  <X size={16} />
                  <Text>Decline</Text>
                </Row>
              </Button>
              <Button
                style={{ flex: 1 }}
                onPress={handleAccept}
                disabled={acceptMutation.isPending}
              >
                <Row style={{ alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Check size={16} />
                  <Text>{acceptMutation.isPending ? 'Accepting...' : 'Accept'}</Text>
                </Row>
              </Button>
            </Row>
          )}

          {/* Info */}
          <Text
            style={{
              fontSize: 'var(--font-size-2)',
              color: 'var(--color-gray-10)',
              textAlign: 'center',
            }}
          >
            Logged in as {profile?.email || user.email}
          </Text>
        </Stack>
      </Card>
    </Stack>
  )
}
