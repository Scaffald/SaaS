import { PaymentIntentForm } from '@app/core/features/payments/components/PaymentIntentForm'
import { api } from '@app/core/utils/api'
import { useAllOrganizations } from '@app/core/utils/useAllOrganizations'
import type { AppRouter } from '@app/supabase/client-types'
import { CreditCard, RefreshCcw, ShieldCheck } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import type { inferRouterOutputs } from '@trpc/server'
import { useEffect, useMemo, useState } from 'react'
import { ResponsiveSelect } from '@unicornlove/ui'
import { Button, Input, Label, Text, XStack, YStack } from 'tamagui'

type RouterOutputs = inferRouterOutputs<AppRouter>
type OrganizationOption = RouterOutputs['office']['getOrganizations']['organizations'][number]
type WorkerSummary = RouterOutputs['workers']['getWorkers']['workers'][number]
type PricingOption = RouterOutputs['idVerification']['getPricing'][number]

interface IdVerificationRequestPanelProps {
  selectedOrganizationId: string | null
  onOrganizationChange: (organizationId: string | null) => void
}

type PaymentSession = {
  paymentIntentId: string
  clientSecret: string
  amountCents: number
}

const formatCurrency = (value: number | null | undefined) => {
  if (typeof value !== 'number') return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value / 100)
}

export function IdVerificationRequestPanel({
  selectedOrganizationId,
  onOrganizationChange,
}: IdVerificationRequestPanelProps) {
  const toast = useToastController()
  const utils = api.useUtils()

  const { data: organizationsData } = useAllOrganizations()
  const organizations = useMemo<OrganizationOption[]>(
    () => (organizationsData?.organizations ?? []) as OrganizationOption[],
    [organizationsData?.organizations]
  )

  const [organizationId, setOrganizationId] = useState<string | null>(selectedOrganizationId)
  useEffect(() => {
    setOrganizationId(selectedOrganizationId)
  }, [selectedOrganizationId])

  const handleOrganizationChange = (value: string) => {
    const nextValue = value === '__none__' ? null : value
    setOrganizationId(nextValue)
    onOrganizationChange(nextValue)
  }

  const [workerSearch, setWorkerSearch] = useState('')
  const workersQuery = api.workers.getWorkers.useQuery(
    { search: workerSearch || undefined, limit: 50 },
    { staleTime: 60_000 }
  )
  const workers = useMemo<WorkerSummary[]>(
    () => workersQuery.data?.workers ?? [],
    [workersQuery.data?.workers]
  )

  const pricingQuery = api.idVerification.getPricing.useQuery(undefined, {
    staleTime: 5 * 60_000,
  })
  const pricingOptions = (pricingQuery.data ?? []) as PricingOption[]

  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null)
  const [selectedPricingId, setSelectedPricingId] = useState<string | null>(null)
  useEffect(() => {
    if (!selectedPricingId && pricingOptions.length > 0) {
      setSelectedPricingId(pricingOptions[0]?.id ?? null)
    }
  }, [pricingOptions, selectedPricingId])

  const requestVerification = api.idVerification.requestVerification.useMutation({
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to create payment'
      toast.show('Unable to create payment', {
        message,
        type: 'error',
      })
    },
  })

  const confirmVerification = api.idVerification.confirmVerificationPayment.useMutation({
    onSuccess: async () => {
      toast.show('Verification requested', {
        message: 'Worker receives a Persona link immediately.',
        type: 'success',
      })
      await utils.idVerification.listVerifications.invalidate()
      resetForm()
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Payment confirmation failed'
      toast.show('Payment confirmation failed', {
        message,
        type: 'error',
      })
    },
  })

  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const selectedPricing = pricingOptions.find((option) => option.id === selectedPricingId) ?? null
  const canSubmit =
    Boolean(selectedWorkerId) &&
    Boolean(selectedPricingId) &&
    Boolean(organizationId && selectedPricing)

  const createPaymentSession = async () => {
    if (!organizationId) {
      toast.show('Select an organization', {
        message: 'Choose which organization should be billed.',
        type: 'error',
      })
      return
    }

    if (!selectedWorkerId || !selectedPricingId) {
      toast.show('Missing details', {
        message: 'Select a worker and pricing plan to continue.',
        type: 'error',
      })
      return
    }

    setPaymentError(null)
    try {
      const session = await requestVerification.mutateAsync({
        workerUserId: selectedWorkerId,
        pricingId: selectedPricingId,
        organizationId,
      })
      setPaymentSession(session)
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : 'Unable to create Stripe payment session.'
      )
    }
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    await confirmVerification.mutateAsync({ paymentIntentId })
  }

  const resetForm = () => {
    setSelectedWorkerId(null)
    setWorkerSearch('')
    setPaymentSession(null)
    setPaymentError(null)
  }

  const workerPlaceholder = workersQuery.isLoading ? 'Loading workers…' : 'Select worker'

  return (
    <YStack gap="$4" p="$4" borderWidth={1} borderColor="$borderColor" rounded="$4">
      <YStack gap="$1">
        <Text fontSize="$5" fontWeight="700" color="$color12">
          Trigger Verification
        </Text>
        <Text fontSize="$3" color="$color11">
          Collect payment and generate a Persona inquiry on behalf of an organization.
        </Text>
      </YStack>

      <YStack gap="$2">
        <Label htmlFor="idv-organization">Organization</Label>
        <ResponsiveSelect
          value={organizationId ?? '__none__'}
          onValueChange={handleOrganizationChange}
          placeholder={
            organizationId
              ? (organizations.find((org) => org.id === organizationId)?.name ??
                'Select organization')
              : 'Select organization'
          }
          label="Organization"
          options={[
            { value: '__none__', label: 'Select organization' },
            ...organizations.map((org) => ({
              value: org.id as string,
              label: (org.name as string) ?? 'Untitled org',
            })),
          ]}
        />
      </YStack>

      <YStack gap="$2">
        <Label htmlFor="idv-worker">Worker</Label>
        <Input
          id="idv-worker-search"
          placeholder="Search workers by name or email…"
          value={workerSearch}
          onChangeText={setWorkerSearch}
          autoCapitalize="none"
        />
        <ResponsiveSelect
          value={selectedWorkerId ?? ''}
          onValueChange={(value) => setSelectedWorkerId(value)}
          placeholder={selectedWorkerId ? undefined : workerPlaceholder}
          label="Worker"
          options={
            workers.length === 0
              ? [{ value: '__empty__', label: 'No workers found', disabled: true }]
              : workers.map((worker) => ({
                  value: worker.id as string,
                  label:
                    worker.display_name ??
                    worker.email ??
                    worker.username ??
                    `Worker ${String(worker.id).slice(0, 8)}`,
                }))
          }
        />
      </YStack>

      <YStack gap="$2">
        <Label htmlFor="idv-pricing">Verification plan</Label>
        <ResponsiveSelect
          value={selectedPricingId ?? ''}
          onValueChange={(value) => setSelectedPricingId(value)}
          placeholder={
            selectedPricing
              ? `${selectedPricing.name} (${formatCurrency(selectedPricing.priceCents)})`
              : pricingQuery.isLoading
                ? 'Loading pricing…'
                : 'Select pricing'
          }
          label="Verification plan"
          options={pricingOptions.map((option: PricingOption) => ({
            value: option.id,
            label: `${option.name} · ${formatCurrency(option.priceCents)}`,
          }))}
        />
      </YStack>

      {!paymentSession ? (
        <Button
          size="$4"
          theme="blue"
          icon={CreditCard}
          disabled={!canSubmit || requestVerification.isPending}
          onPress={createPaymentSession}
        >
          {requestVerification.isPending ? 'Preparing payment…' : 'Collect payment'}
        </Button>
      ) : null}

      {paymentError ? (
        <Text color="$red11" fontSize="$3">
          {paymentError}
        </Text>
      ) : null}

      {paymentSession?.clientSecret ? (
        <PaymentIntentForm
          clientSecret={paymentSession.clientSecret}
          amountCents={paymentSession.amountCents}
          description={
            selectedPricing
              ? `ID Verification • ${selectedPricing.name}`
              : 'ID verification payment'
          }
          submitLabel={confirmVerification.isPending ? 'Confirming…' : 'Charge & send Persona link'}
          disabled={confirmVerification.isPending}
          onSuccess={handlePaymentSuccess}
        />
      ) : null}

      {paymentSession ? (
        <Button
          size="$3"
          variant="outlined"
          icon={RefreshCcw}
          disabled={confirmVerification.isPending}
          onPress={resetForm}
        >
          Reset form
        </Button>
      ) : null}

      <YStack gap="$2" bg="$color2" p="$3" rounded="$4">
        <XStack gap="$2" items="center">
          <ShieldCheck size={16} color="$color11" />
          <Text fontWeight="600" color="$color12">
            What happens next?
          </Text>
        </XStack>
        <Text fontSize="$3" color="$color11">
          After payment succeeds we automatically create a Persona inquiry using the worker&apos;s
          profile details. They receive an email and in-app notification with a secure link to
          upload their government ID. Most verifications finish within minutes.
        </Text>
      </YStack>
    </YStack>
  )
}
