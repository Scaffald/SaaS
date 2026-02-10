import { PaymentIntentForm } from '@scf/core/features/payments/components/PaymentIntentForm'
import { api } from '@scf/core/utils/api'
import { useUser } from '@scf/core/utils/useUser'
import { AlertCircle } from '@tamagui/lucide-icons'
import { useToast } from '@unicornlove/beyond-ui'
import { formatDistanceToNow } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { Button, Card, ScrollView, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { IdVerificationBadge } from './IdVerificationBadge'

type PricingRow = {
  id: string
  name: string
  description?: string | null
  priceCents: number
  metadata?: Record<string, unknown>
}

type PaymentSession = {
  paymentIntentId: string
  clientSecret: string
  amountCents: number
}

const formatCurrency = (cents?: number | null) => {
  if (typeof cents !== 'number') return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString()
}

const formatDuration = (value?: string | null) => {
  if (!value) return null
  return formatDistanceToNow(new Date(value), { addSuffix: true })
}

export function IdVerificationContent() {
  const { user } = useUser()
  const toast = useToast()

  const pricingQuery = api.idVerification.getPricing.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  })
  const currentVerificationQuery = api.idVerification.getCurrentVerification.useQuery(
    {},
    {
      staleTime: 60 * 1000,
    }
  )

  const requestVerification = api.idVerification.requestVerification.useMutation()
  const confirmVerification = api.idVerification.confirmVerificationPayment.useMutation()

  const [selectedPricingId, setSelectedPricingId] = useState<string | null>(null)
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)

  const pricingOptions: PricingRow[] = useMemo(() => pricingQuery.data ?? [], [pricingQuery.data])

  useEffect(() => {
    if (!selectedPricingId && pricingOptions.length > 0) {
      setSelectedPricingId(pricingOptions[0]?.id ?? null)
    }
  }, [pricingOptions, selectedPricingId])

  useEffect(() => {
    setPaymentSession(null)
    setRequestError(null)
  }, [])

  const selectedPricing = pricingOptions.find((row) => row.id === selectedPricingId) ?? null

  const statusCard = renderStatusCard(currentVerificationQuery)

  const handleCreatePaymentSession = async () => {
    if (!user) {
      toast.show({
          title: 'Sign in required',
          message: 'Please sign in again before starting verification.',
          variant: 'error',
        })
      return
    }

    if (!selectedPricing) {
      toast.show({
          title: 'Select a plan',
          message: 'Choose a verification option to continue.',
        })
      return
    }

    setRequestError(null)

    try {
      const response = await requestVerification.mutateAsync({
        workerUserId: user.id,
        pricingId: selectedPricing.id,
      })
      setPaymentSession(response)
      toast.show({
          title: 'Secure payment ready',
          message: 'Enter your card details below to continue.',
        })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start payment. Try again.'
      setRequestError(message)
      toast.show({
          title: 'Payment setup failed',
          variant: 'error',
        })
    }
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      await confirmVerification.mutateAsync({ paymentIntentId })
      toast.show({
          title: 'Verification scheduled',
          message: "We're creating your Persona inquiry now.",
        })
      setPaymentSession(null)
      void currentVerificationQuery.refetch()
    } catch (error) {
      const _message =
        error instanceof Error ? error.message : 'Unable to confirm payment with Stripe.'
      toast.show({
          title: 'Payment confirmation failed',
          variant: 'error',
        })
    }
  }

  return (
    <Stack gap="$4">
      {statusCard}

      <Card padding="$4" bordered>
        <Stack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            Why verify your identity?
          </Text>
          <Text color="$color11">
            Verified profiles are highlighted across search, inquiries, and background checks,
            giving organizations confidence that you are who you say you are.
          </Text>
          <Stack gap="$1" marginTop="$2">
            <Text color="$color11">• Badge displayed on your profile and worker cards</Text>
            <Text color="$color11">• Valid for 6 months with automated reminders</Text>
            <Text color="$color11">• Powered by Persona, the same provider used by banks</Text>
          </Stack>
        </Stack>
      </Card>

      <PricingSection
        pricingOptions={pricingOptions}
        selectedPricingId={selectedPricingId}
        onSelectPlan={setSelectedPricingId}
        isLoading={pricingQuery.isLoading}
      />

      <PaymentSection
        selectedPricing={selectedPricing}
        paymentSession={paymentSession}
        isRequesting={requestVerification.isPending}
        isConfirming={confirmVerification.isPending}
        requestError={requestError}
        onCreateSession={handleCreatePaymentSession}
        onResetSession={() => {
          if (!confirmVerification.isPending) {
            setPaymentSession(null)
            setRequestError(null)
          }
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </Stack>
  )
}

export function IdVerificationRight() {
  return (
    <Stack gap="$4">
      <Card padding="$4" bordered>
        <Stack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            What happens after payment?
          </Text>
          <Text color="$color11">
            We automatically create a Persona inquiry using your Scaffald profile details. You'll
            receive an email and in-app notification with a secure link to upload your government ID
            and selfie. Most verifications finish within a few minutes.
          </Text>
          <Stack gap="$1">
            <Text color="$color11">1. Complete the Persona flow on web or mobile</Text>
            <Text color="$color11">2. Persona confirms the authenticity of your ID</Text>
            <Text color="$color11">3. Your badge updates instantly across the platform</Text>
          </Stack>
        </Stack>
      </Card>

      <Card padding="$4" bordered backgroundColor="$blue2" borderColor="$blue6">
        <Stack gap="$2">
          <Text fontSize="$4" fontWeight="600" color="$blue12">
            Need help?
          </Text>
          <Text color="$blue11">
            Email support@scaffald.com if you run into issues with Persona, need an invoice, or want
            to request a bulk verification plan for your organization.
          </Text>
        </Stack>
      </Card>
    </Stack>
  )
}

export function IdVerificationFlow() {
  return (
    <Stack flex={1} backgroundColor="$background">
      <ScrollView flex={1}>
        <Stack gap="$4" paddingHorizontal="$4" paddingBottom="$8">
          <IdVerificationContent />
        </Stack>
      </ScrollView>
    </Stack>
  )
}

function renderStatusCard(
  queryReturn: ReturnType<typeof api.idVerification.getCurrentVerification.useQuery>
) {
  if (queryReturn.isLoading) {
    return (
      <Card padding="$4" bordered>
        <Stack gap="$2">
          <IdVerificationBadge status={null} muted size="md" />
          <Text color="$color11">Loading your verification badge…</Text>
        </Stack>
      </Card>
    )
  }

  if (queryReturn.isError) {
    return (
      <Card padding="$4" bordered backgroundColor="$red2" borderColor="$red6">
        <Stack gap="$2">
          <Text fontSize="$5" fontWeight="600" color="$red12">
            Unable to load badge
          </Text>
          <Text color="$red11">
            {queryReturn.error?.message ?? 'Please refresh to try loading your verification badge.'}
          </Text>
        </Stack>
      </Card>
    )
  }

  const badge = queryReturn.data as
    | {
        badgeStatus?: string
        badgeExpiresAt?: string
        verifiedAt?: string
        verificationLevel?: string | null
      }
    | null
    | undefined
  if (!badge) {
    return (
      <Card padding="$4" bordered>
        <Stack gap="$2">
          <IdVerificationBadge status={null} muted size="md" />
          <Text color="$color11">
            Purchase a verification to unlock the "Verified Identity" badge on your profile.
          </Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Card padding="$4" bordered>
      <Stack gap="$2">
        <IdVerificationBadge
          status={badge.badgeStatus as 'active' | 'expired' | 'revoked'}
          badgeExpiresAt={badge.badgeExpiresAt}
        />
        <Text color="$color11">
          {badge.badgeStatus === 'active'
            ? `Valid until ${formatDate(badge.badgeExpiresAt ?? '')} (${formatDuration(
                badge.badgeExpiresAt ?? ''
              )})`
            : badge.badgeStatus === 'expired'
              ? `Expired on ${formatDate(badge.badgeExpiresAt ?? '')}`
              : 'Contact support to resolve revocation.'}
        </Text>
        <Text color="$color10">
          Verified on {formatDate(badge.verifiedAt ?? '')} • Level:{' '}
          {badge.verificationLevel ?? 'N/A'}
        </Text>
      </Stack>
    </Card>
  )
}

type PricingSectionProps = {
  pricingOptions: PricingRow[]
  selectedPricingId: string | null
  onSelectPlan: (id: string) => void
  isLoading: boolean
}

function PricingSection({
  pricingOptions,
  selectedPricingId,
  onSelectPlan,
  isLoading,
}: PricingSectionProps) {
  if (isLoading) {
    return (
      <Card padding="$4" bordered>
        <Stack gap="$2" alignItems="center">
          <Spinner size="small" />
          <Text color="$color11">Loading verification options…</Text>
        </Stack>
      </Card>
    )
  }

  if (pricingOptions.length === 0) {
    return (
      <Card padding="$4" bordered backgroundColor="$color2" borderColor="$borderColor">
        <Stack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            Verification temporarily unavailable
          </Text>
          <Text color="$color11">
            Pricing hasn’t been published yet. Check back soon or contact support@scaffald.com.
          </Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Stack gap="$2">
      <Text fontSize="$5" fontWeight="600">
        Choose a verification option
      </Text>
      <Stack gap="$3">
        {pricingOptions.map((plan) => {
          const isActive = plan.id === selectedPricingId
          return (
            <Card
              key={plan.id}
              padding="$4"
              bordered
              animation="quick"
              backgroundColor={isActive ? '$blue2' : '$color1'}
              borderColor={isActive ? '$blue8' : '$borderColor'}
              onPress={() => onSelectPlan(plan.id)}
            >
              <Stack gap="$2">
                <Row justifyContent="space-between" alignItems="center">
                  <Text fontSize="$4" fontWeight="600">
                    {plan.name}
                  </Text>
                  <Text fontSize="$5" fontWeight="700">
                    {formatCurrency(plan.priceCents)}
                  </Text>
                </Row>
                {plan.description && (
                  <Text color="$color11" fontSize="$3">
                    {plan.description}
                  </Text>
                )}
                <Button
                  size="$3"
                  theme={isActive ? 'blue' : undefined}
                  variant={isActive ? undefined : 'outlined'}
                  onPress={() => onSelectPlan(plan.id)}
                >
                  {isActive ? 'Selected' : 'Select this option'}
                </Button>
              </Stack>
            </Card>
          )
        })}
      </Stack>
    </Stack>
  )
}

type PaymentSectionProps = {
  selectedPricing: PricingRow | null
  paymentSession: PaymentSession | null
  isRequesting: boolean
  isConfirming: boolean
  requestError: string | null
  onCreateSession: () => void
  onResetSession: () => void
  onPaymentSuccess: (paymentIntentId: string) => void
}

function PaymentSection({
  selectedPricing,
  paymentSession,
  isRequesting,
  isConfirming,
  requestError,
  onCreateSession,
  onResetSession,
  onPaymentSuccess,
}: PaymentSectionProps) {
  return (
    <Stack gap="$3">
      <Stack gap="$1">
        <Text fontSize="$5" fontWeight="600">
          Secure payment
        </Text>
        <Text color="$color11">
          Charges are non-refundable and processed via Stripe. Your badge will update immediately
          after Persona confirms your identity.
        </Text>
      </Stack>

      {requestError && (
        <Stack
          gap="$2"
          padding="$3"
          backgroundColor="$red2"
          borderColor="$red6"
          borderWidth={1}
          borderRadius="$4"
        >
          <Row gap="$2" alignItems="center">
            <AlertCircle size={18} color="$red11" />
            <Text color="$red11">{requestError}</Text>
          </Row>
        </Stack>
      )}

      {!paymentSession && (
        <Button
          size="$4"
          theme="blue"
          disabled={!selectedPricing || isRequesting || isConfirming}
          onPress={onCreateSession}
        >
          {isRequesting ? 'Preparing secure checkout…' : 'Continue to payment'}
        </Button>
      )}

      {paymentSession && (
        <Stack gap="$3">
          <PaymentIntentForm
            clientSecret={paymentSession.clientSecret}
            amountCents={paymentSession.amountCents}
            description={selectedPricing?.name ?? 'Identity verification'}
            submitLabel={isConfirming ? 'Processing…' : 'Pay & verify'}
            disabled={isConfirming}
            onSuccess={onPaymentSuccess}
          />
          <Button size="$3" variant="outlined" disabled={isConfirming} onPress={onResetSession}>
            Start over
          </Button>
        </Stack>
      )}
    </Stack>
  )
}
