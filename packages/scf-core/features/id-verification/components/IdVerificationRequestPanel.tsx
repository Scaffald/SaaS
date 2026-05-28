import { PaymentIntentForm } from '@scf/core/features/payments/components/PaymentIntentForm'
import {
  useIdVerificationPricing,
  useIdVerificationRequest,
  useIdVerificationConfirm,
} from '@scf/core/utils/id-verification-sdk-hooks'
import type { IdVerificationPricingItem } from '@scf/core/utils/id-verification-sdk-hooks'
import { useAllOrganizations } from '@scf/core/utils/useAllOrganizations'
import { useWorkers } from '@scf/core/utils/workers-sdk-hooks'
import type { AppRouter } from '@scf/supabase/client-types'
import type { Worker } from '@scaffald/sdk'
import { CreditCard, RefreshCcw, ShieldCheck } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import type { inferRouterOutputs } from '@trpc/server'
import { useEffect, useMemo, useState } from 'react'
import { ResponsiveSelect } from '@scaffald/ui'
import { Button, Input, Label, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useQueryClient } from '@tanstack/react-query'

type RouterOutputs = inferRouterOutputs<AppRouter>
type OrganizationOption = RouterOutputs['office']['getOrganizations']['organizations'][number]

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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const toast = useToast()
  const queryClient = useQueryClient()

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
  const workersQuery = useWorkers(
    { search: workerSearch || undefined, limit: 50 },
    { staleTime: 60_000 }
  )
  const workers = useMemo<Worker[]>(
    () => workersQuery.data?.workers ?? [],
    [workersQuery.data?.workers]
  )

  const pricingQuery = useIdVerificationPricing({ staleTime: 5 * 60_000 })
  const pricingOptions = (pricingQuery.data ?? []) as IdVerificationPricingItem[]

  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null)
  const [selectedPricingId, setSelectedPricingId] = useState<string | null>(null)
  useEffect(() => {
    if (!selectedPricingId && pricingOptions.length > 0) {
      setSelectedPricingId(pricingOptions[0]?.id ?? null)
    }
  }, [pricingOptions, selectedPricingId])

  const requestVerification = useIdVerificationRequest()
  const confirmVerification = useIdVerificationConfirm()

  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const selectedPricing = pricingOptions.find((option) => option.id === selectedPricingId) ?? null
  const canSubmit =
    Boolean(selectedWorkerId) &&
    Boolean(selectedPricingId) &&
    Boolean(organizationId && selectedPricing)

  const createPaymentSession = async () => {
    if (!organizationId) {
      toast.show({
        title: 'Select an organization',
        message: 'Choose which organization should be billed.',
        variant: 'error',
      })
      return
    }

    if (!selectedWorkerId || !selectedPricingId) {
      toast.show({
        title: 'Missing details',
        message: 'Select a worker and pricing plan to continue.',
        variant: 'error',
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
      const msg = error instanceof Error ? error.message : 'Unable to create Stripe payment session.'
      setPaymentError(msg)
      toast.show({
        title: 'Unable to create payment',
        message: msg,
        variant: 'error',
      })
    }
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      await confirmVerification.mutateAsync(
        { paymentIntentId },
        {
          onSuccess: () => {
            toast.show({
              title: 'Verification requested',
              message: 'Worker receives a Persona link immediately.',
              variant: 'success',
            })
            void queryClient.invalidateQueries({ queryKey: ['idVerification'] })
            resetForm()
          },
        }
      )
    } catch {
      toast.show({
        title: 'Payment confirmation failed',
        message: confirmVerification.error instanceof Error ? confirmVerification.error.message : 'Please try again.',
        variant: 'error',
      })
    }
  }

  const resetForm = () => {
    setSelectedWorkerId(null)
    setWorkerSearch('')
    setPaymentSession(null)
    setPaymentError(null)
  }

  const workerPlaceholder = workersQuery.isLoading ? 'Loading workers…' : 'Select worker'

  return (
    <Stack gap={16} padding="md" borderRadius={16} style={{ borderWidth: 1, borderColor: colors.border[t].default }}>
      <Stack gap={4}>
        <Text style={{ color: colors.text[t].secondary }}>Trigger Verification</Text>
        <Text style={{ color: colors.text[t].secondary }}>
          Collect payment and generate a Persona inquiry on behalf of an organization.
        </Text>
      </Stack>

      <Stack gap={8}>
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
      </Stack>

      <Stack gap={8}>
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
                  value: worker.id,
                  label:
                    worker.display_name ??
                    worker.username ??
                    `Worker ${String(worker.id).slice(0, 8)}`,
                }))
          }
        />
      </Stack>

      <Stack gap={8}>
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
          options={pricingOptions.map((option: IdVerificationPricingItem) => ({
            value: option.id,
            label: `${option.name} · ${formatCurrency(option.priceCents)}`,
          }))}
        />
      </Stack>

      {!paymentSession ? (
        <Button
          size="md"
          color="primary"
          iconStart={CreditCard}
          disabled={!canSubmit || requestVerification.isPending}
          onPress={createPaymentSession}
        >
          {requestVerification.isPending ? 'Preparing payment…' : 'Collect payment'}
        </Button>
      ) : null}

      {paymentError ? <Text style={{ color: t === 'dark' ? colors.error[300] : colors.error[600] }}>{paymentError}</Text> : null}

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
          size="sm"
          variant="outline"
          iconStart={RefreshCcw}
          disabled={confirmVerification.isPending}
          onPress={resetForm}
        >
          Reset form
        </Button>
      ) : null}

      <Stack gap={8} padding="sm" borderRadius={16} style={{ backgroundColor: colors.bg[t].muted }}>
        <Row gap={8} align="center">
          <ShieldCheck size={20} color={colors.text[t].secondary} />
          <Text style={{ color: colors.text[t].secondary }}>What happens next?</Text>
        </Row>
        <Text style={{ color: colors.text[t].secondary }}>
          After payment succeeds we automatically create a Persona inquiry using the worker&apos;s
          profile details. They receive an email and in-app notification with a secure link to
          upload their government ID. Most verifications finish within minutes.
        </Text>
      </Stack>
    </Stack>
  )
}
