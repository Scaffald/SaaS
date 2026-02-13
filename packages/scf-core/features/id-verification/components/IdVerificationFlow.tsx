import { PaymentIntentForm } from '@scf/core/features/payments/components/PaymentIntentForm'
import { api } from '@scf/core/utils/api'
import { useUser } from '@scf/core/utils/useUser'
import { AlertCircle } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { formatDistanceToNow } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { Button, Card, ScrollView, Spinner, Text, Row, Stack } from '@scaffald/ui'
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
    <Stack gap={16}>
      {statusCard}

      <Card padding="md" bordered>
        <Stack gap={8}>
          <Text>Why verify your identity?</Text>
          <Text color="$gray11">
            Verified profiles are highlighted across search, inquiries, and background checks,
            giving organizations confidence that you are who you say you are.
          </Text>
          <Stack gap={4} marginTop={8}>
            <Text color="$gray11">• Badge displayed on your profile and worker cards</Text>
            <Text color="$gray11">• Valid for 6 months with automated reminders</Text>
            <Text color="$gray11">• Powered by Persona, the same provider used by banks</Text>
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
    <Stack gap={16}>
      <Card padding="md" bordered>
        <Stack gap={8}>
          <Text>What happens after payment?</Text>
          <Text color="$gray11">
            We automatically create a Persona inquiry using your Scaffald profile details. You'll
            receive an email and in-app notification with a secure link to upload your government ID
            and selfie. Most verifications finish within a few minutes.
          </Text>
          <Stack gap={4}>
            <Text color="$gray11">1. Complete the Persona flow on web or mobile</Text>
            <Text color="$gray11">2. Persona confirms the authenticity of your ID</Text>
            <Text color="$gray11">3. Your badge updates instantly across the platform</Text>
          </Stack>
        </Stack>
      </Card>

      <Card padding="md" bordered backgroundColor="$blue2" borderColor="$blue6">
        <Stack gap={8}>
          <Text color="$blue12">Need help?</Text>
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
        <Stack gap={16} paddingHorizontal={16} paddingBottom={32}>
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
      <Card padding="md" bordered>
        <Stack gap={8}>
          <IdVerificationBadge status={null} muted size="md" />
          <Text color="$gray11">Loading your verification badge…</Text>
        </Stack>
      </Card>
    )
  }

  if (queryReturn.isError) {
    return (
      <Card padding="md" bordered backgroundColor="$red2" borderColor="$red6">
        <Stack gap={8}>
          <Text color="$red12">Unable to load badge</Text>
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
      <Card padding="md" bordered>
        <Stack gap={8}>
          <IdVerificationBadge status={null} muted size="md" />
          <Text color="$gray11">
            Purchase a verification to unlock the "Verified Identity" badge on your profile.
          </Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Card padding="md" bordered>
      <Stack gap={8}>
        <IdVerificationBadge
          status={badge.badgeStatus as 'active' | 'expired' | 'revoked'}
          badgeExpiresAt={badge.badgeExpiresAt}
        />
        <Text color="$gray11">
          {badge.badgeStatus === 'active'
            ? `Valid until ${formatDate(badge.badgeExpiresAt ?? '')} (${formatDuration(
                badge.badgeExpiresAt ?? ''
              )})`
            : badge.badgeStatus === 'expired'
              ? `Expired on ${formatDate(badge.badgeExpiresAt ?? '')}`
              : 'Contact support to resolve revocation.'}
        </Text>
        <Text color="$gray11">
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
      <Card padding="md" bordered>
        <Stack gap={8} align="center">
          <Spinner size="sm" />
          <Text color="$gray11">Loading verification options…</Text>
        </Stack>
      </Card>
    )
  }

  if (pricingOptions.length === 0) {
    return (
      <Card padding="md" bordered backgroundColor="$color2" borderColor="$borderColor">
        <Stack gap={8}>
          <Text>Verification temporarily unavailable</Text>
          <Text color="$gray11">
            Pricing hasn’t been published yet. Check back soon or contact support@scaffald.com.
          </Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Stack gap={8}>
      <Text>Choose a verification option</Text>
      <Stack gap={12}>
        {pricingOptions.map((plan) => {
          const isActive = plan.id === selectedPricingId
          return (
            <Card
              key={plan.id}
              padding="md"
              bordered
              animation="quick"
              backgroundColor={isActive ? '$blue2' : '$color1'}
              borderColor={isActive ? '$blue8' : '$borderColor'}
              onPress={() => onSelectPlan(plan.id)}
            >
              <Stack gap={8}>
                <Row justify="space-between" align="center">
                  <Text>{plan.name}</Text>
                  <Text>{formatCurrency(plan.priceCents)}</Text>
                </Row>
                {plan.description && <Text color="$gray11">{plan.description}</Text>}
                <Button
                  size="sm"
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
    <Stack gap={12}>
      <Stack gap={4}>
        <Text>Secure payment</Text>
        <Text color="$gray11">
          Charges are non-refundable and processed via Stripe. Your badge will update immediately
          after Persona confirms your identity.
        </Text>
      </Stack>

      {requestError && (
        <Stack
          gap={8}
          padding="sm"
          backgroundColor="$red2"
          borderColor="$red6"
          borderWidth={1}
          borderRadius={16}
        >
          <Row gap={8} align="center">
            <AlertCircle size={18} color="$red11" />
            <Text color="$red11">{requestError}</Text>
          </Row>
        </Stack>
      )}

      {!paymentSession && (
        <Button
          size="md"
          color="primary"
          disabled={!selectedPricing || isRequesting || isConfirming}
          onPress={onCreateSession}
        >
          {isRequesting ? 'Preparing secure checkout…' : 'Continue to payment'}
        </Button>
      )}

      {paymentSession && (
        <Stack gap={12}>
          <PaymentIntentForm
            clientSecret={paymentSession.clientSecret}
            amountCents={paymentSession.amountCents}
            description={selectedPricing?.name ?? 'Identity verification'}
            submitLabel={isConfirming ? 'Processing…' : 'Pay & verify'}
            disabled={isConfirming}
            onSuccess={onPaymentSuccess}
          />
          <Button size="sm" variant="outline" disabled={isConfirming} onPress={onResetSession}>
            Start over
          </Button>
        </Stack>
      )}
    </Stack>
  )
}
