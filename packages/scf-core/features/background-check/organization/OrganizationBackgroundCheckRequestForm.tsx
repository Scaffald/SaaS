import { ROUTES } from '@scf/core/constants/routes'
import { PaymentIntentForm } from '@scf/core/features/payments/components/PaymentIntentForm'
import { api } from '@scf/core/utils/api'
import {
  useBackgroundCheckPackages,
  useRequestBackgroundCheckMutation,
  useConfirmCheckPaymentMutation,
} from '@scf/core/utils/background-checks-sdk-hooks'
import { useWorkers } from '@scf/core/utils/workers-sdk-hooks'
import type { Worker } from '@scaffald/sdk/resources/workers'
import { useQueryClient } from '@tanstack/react-query'
import { useAllOrganizations } from '@scf/core/utils/useAllOrganizations'
import type { AppRouter } from '@scf/supabase/client-types'
import { CircleAlert } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import type { inferRouterOutputs } from '@trpc/server'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import { ResponsiveSelect } from '@unicornlove/beyond-ui'
import { Button, Input, Label, Spinner, Text, TextArea, Row, Stack } from '@unicornlove/beyond-ui'

type RouterOutputs = inferRouterOutputs<AppRouter>
type PackageSummary = RouterOutputs['backgroundChecks']['listPackages'][number]
type WorkerSummary = Worker
type JobSummary = RouterOutputs['office']['listJobs']['jobs'][number]
type OrganizationSummary = RouterOutputs['office']['getOrganizations']['organizations'][number]

type PaymentSession = {
  backgroundCheckId: string
  paymentIntentId: string
  clientSecret: string
  amountCents: number
}

const formatCurrency = (cents: number | null | undefined) => {
  if (typeof cents !== 'number') return '—'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
    cents / 100
  )
}

const getPackageTier = (pkg: PackageSummary | null) => {
  if (!pkg?.metadata || typeof pkg.metadata !== 'object') {
    return undefined
  }
  const maybeTier = (pkg.metadata as Record<string, unknown>).tier
  return typeof maybeTier === 'string' ? maybeTier : undefined
}

export function OrganizationBackgroundCheckRequestForm() {
  const router = useRouter()
  const toast = useToast()

  const params = useLocalSearchParams<{ organizationId?: string | string[] }>()
  const initialOrganizationId =
    typeof params.organizationId === 'string'
      ? params.organizationId
      : Array.isArray(params.organizationId)
        ? params.organizationId[0]
        : undefined

  const [organizationId, setOrganizationId] = useState<string | null>(initialOrganizationId ?? null)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [workerSearch, setWorkerSearch] = useState('')

  const { data: organizationsData, isLoading: isLoadingOrganizations } = useAllOrganizations()
  const organizations = useMemo<OrganizationSummary[]>(
    () => (organizationsData?.organizations ?? []) as OrganizationSummary[],
    [organizationsData?.organizations]
  )

  useEffect(() => {
    if (!organizationId && organizations.length === 1) {
      setOrganizationId(organizations[0].id as string)
    }
  }, [organizations, organizationId])

  const { data: packagesData, isLoading: isLoadingPackages } = useBackgroundCheckPackages()
  const packages = useMemo<PackageSummary[]>(() => packagesData ?? [], [packagesData])

  const workersQuery = useWorkers({
    search: workerSearch || undefined,
    limit: 50,
  })
  const workers = useMemo<WorkerSummary[]>(
    () => workersQuery.data?.workers ?? [],
    [workersQuery.data?.workers]
  )

  const jobsQuery = api.office.listJobs.useQuery(
    {
      organization_id: organizationId ?? undefined,
      status: 'open',
      limit: 100,
      offset: 0,
    },
    {
      enabled: Boolean(organizationId),
      staleTime: 60 * 1000,
    }
  )
  const jobs = useMemo<JobSummary[]>(() => jobsQuery.data?.jobs ?? [], [jobsQuery.data?.jobs])

  const queryClient = useQueryClient()
  const requestPaymentMutation = useRequestBackgroundCheckMutation()
  const confirmPaymentMutation = useConfirmCheckPaymentMutation()

  const selectedPackage = useMemo<PackageSummary | null>(() => {
    if (!selectedPackageId) return null
    return packages.find((pkg) => pkg.id === selectedPackageId) ?? null
  }, [packages, selectedPackageId])

  const selectedWorker = useMemo<WorkerSummary | null>(() => {
    if (!selectedWorkerId) return null
    return workers.find((worker) => worker.id === selectedWorkerId) ?? null
  }, [workers, selectedWorkerId])

  const selectedJob = useMemo<JobSummary | null>(() => {
    if (!selectedJobId) return null
    return jobs.find((job) => job.id === selectedJobId) ?? null
  }, [jobs, selectedJobId])

  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)

  useEffect(() => {
    setPaymentSession(null)
    setRequestError(null)
  }, [])

  const costCents = selectedPackage?.retail_cost_cents ?? selectedPackage?.platform_cost_cents ?? 0

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!paymentSession) return

    try {
      await confirmPaymentMutation.mutateAsync({
        background_check_id: paymentSession.backgroundCheckId,
        payment_intent_id: paymentIntentId,
      })

      toast.show({
        title: 'Background check requested',
        message: 'Worker has been invited to start their background check.',
      })

      const orgId = organizationId
      if (orgId) {
        await queryClient.invalidateQueries({
          queryKey: ['backgroundChecks', 'organization', orgId],
        })
        router.replace({
          pathname: ROUTES.OFFICE.ATS.CHECKS.path,
          params: { organizationId: orgId },
        })
      }
      setPaymentSession(null)
    } catch (error) {
      const _message = error instanceof Error ? error.message : 'Unable to confirm payment.'
      toast.show({
        title: 'Payment confirmation failed',
        variant: 'error',
      })
    }
  }

  const handleSubmit = async () => {
    if (paymentSession) {
      return
    }

    if (!organizationId) {
      toast.show({
        title: 'Select an organization',
        message: 'Choose an organization before requesting a check.',
      })
      return
    }
    if (!selectedPackage) {
      toast.show({
        title: 'Select a package',
        message: 'Choose a background check package to continue.',
      })
      return
    }
    if (!selectedWorkerId) {
      toast.show({
        title: 'Select a worker',
        message: 'Choose the worker you want to screen.',
      })
      return
    }

    setRequestError(null)

    try {
      const response = await requestPaymentMutation.mutateAsync({
        package_id: selectedPackage.id,
        tier:
          getPackageTier(selectedPackage) ??
          (selectedPackage.slug as string | undefined) ??
          (selectedPackage.display_name as string | undefined) ??
          'custom',
        organization_id: organizationId,
        worker_user_id: selectedWorkerId,
        job_id: selectedJobId ?? undefined,
        paid_by: 'organization',
        metadata: {
          requested_via: 'office_dashboard',
          notes: notes.trim() || undefined,
        },
      })

      setPaymentSession(response)
      toast.show({
        title: 'Payment required',
        message: 'Enter billing details to submit this background check.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create payment session.'
      setRequestError(message)
      toast.show({
        title: 'Unable to start payment',
        variant: 'error',
      })
    }
  }

  if (isLoadingOrganizations || isLoadingPackages) {
    return (
      <Stack flex={1} align="center" justify="center" gap={8}>
        <Spinner size="lg" />
        <Text color="gray">Loading options…</Text>
      </Stack>
    )
  }

  if (!organizations.length) {
    return (
      <Stack flex={1} align="center" justify="center" gap={12} paddingHorizontal={16}>
        <Text color="gray">No organizations available</Text>
        <Text color="gray" style={{ textAlign: 'center' }}>
          Create an organization before requesting a background check.
        </Text>
      </Stack>
    )
  }

  return (
    <ScrollView style={{ flex: 1 }}>
      <Stack flex={1} gap={16} paddingHorizontal={16} paddingVertical={24}>
        <Stack gap={4}>
          <Text color="gray">Request Background Check</Text>
          <Text color="gray">
            Invite a worker to complete the required screening package on behalf of your
            organization.
          </Text>
        </Stack>

        <Stack gap={12}>
          <Stack gap={8}>
            <Label htmlFor="org-select">Organization</Label>
            <ResponsiveSelect
              value={organizationId ?? ''}
              onValueChange={(value) => {
                setOrganizationId(value)
                setSelectedJobId(null)
              }}
              placeholder={
                organizationId
                  ? (organizations.find((org) => org.id === organizationId)?.name ??
                    'Select organization')
                  : 'Select organization'
              }
              label="Organization"
              options={organizations.map((org) => ({
                value: org.id as string,
                label: (org.name as string) ?? 'Untitled organization',
              }))}
            />
          </Stack>

          <Stack gap={8}>
            <Label htmlFor="package-select">Background check package</Label>
            <ResponsiveSelect
              value={selectedPackageId ?? ''}
              onValueChange={(value) => setSelectedPackageId(value)}
              placeholder={
                selectedPackage
                  ? `${selectedPackage.display_name} (${formatCurrency(selectedPackage.retail_cost_cents)})`
                  : 'Select package'
              }
              label="Background check package"
              options={packages.map((pkg) => ({
                value: pkg.id,
                label: `${pkg.display_name} · ${formatCurrency(pkg.retail_cost_cents)}`,
              }))}
            />
            {selectedPackage?.description ? (
              <Text color="gray">{selectedPackage.description}</Text>
            ) : null}
          </Stack>

          <Stack gap={8}>
            <Label htmlFor="worker-search">Worker</Label>
            <Input
              id="worker-search"
              placeholder="Search workers by name or email…"
              value={workerSearch}
              onChangeText={setWorkerSearch}
              autoCapitalize="none"
            />
            <ResponsiveSelect
              value={selectedWorkerId ?? ''}
              onValueChange={(value) => setSelectedWorkerId(value)}
              placeholder={
                selectedWorker
                  ? (selectedWorker.name ??
                    `${selectedWorker.first_name ?? ''} ${selectedWorker.last_name ?? ''}`.trim())
                  : workersQuery.isLoading
                    ? 'Loading workers…'
                    : 'Select worker'
              }
              label="Worker"
              options={
                workers.length === 0
                  ? [{ value: 'placeholder', label: 'No workers found', disabled: true }]
                  : workers.map((worker) => {
                      const fullName = `${worker.first_name ?? ''} ${worker.last_name ?? ''}`.trim()
                      const displayName =
                        worker.name ?? (fullName.length > 0 ? fullName : worker.id.substring(0, 8))
                      return {
                        value: worker.id as string,
                        label: displayName,
                      }
                    })
              }
            />
          </Stack>

          <Stack gap={8}>
            <Label htmlFor="job-select">Related job (optional)</Label>
            <ResponsiveSelect
              value={selectedJobId ?? ''}
              onValueChange={(value) => setSelectedJobId(value || null)}
              placeholder={
                selectedJob
                  ? (selectedJob.title ?? `Job ${selectedJob.id.substring(0, 8)}`)
                  : 'Select job'
              }
              label="Related job (optional)"
              options={[
                { value: '', label: 'Not tied to a job' },
                ...jobs.map((job) => ({
                  value: job.id as string,
                  label: (job.title as string) ?? 'Untitled job',
                })),
              ]}
            />
          </Stack>

          <Stack gap={8}>
            <Label htmlFor="additional-notes">Internal notes (optional)</Label>
            <TextArea
              id="additional-notes"
              placeholder="Share any context for your compliance team. These notes stay internal."
              value={notes}
              onChangeText={setNotes}
              rows={4}
            />
          </Stack>

          <Stack gap={8} padding={12} backgroundColor="$color3" borderRadius={16}>
            <Row gap={8} align="center">
              <CircleAlert size={18} color="gray" />
              <Text color="gray">Cost summary</Text>
            </Row>
            <Text color="gray">
              Package cost: <Text color="gray">{formatCurrency(costCents)}</Text>
            </Text>
            <Text color="gray">
              Charges are collected immediately via Stripe. Screenings are submitted after payment
              succeeds.
            </Text>
          </Stack>

          {requestError && (
            <Stack backgroundColor="$red3" padding={12} borderRadius={16}>
              <Text color="$red11">{requestError}</Text>
            </Stack>
          )}

          {paymentSession && (
            <Stack gap={8}>
              <Text color="gray">Complete payment</Text>
              <PaymentIntentForm
                clientSecret={paymentSession.clientSecret}
                amountCents={paymentSession.amountCents}
                description={`Background check for ${selectedWorker?.name ?? 'selected worker'}`}
                submitLabel={confirmPaymentMutation.isPending ? 'Processing…' : 'Pay & send invite'}
                disabled={confirmPaymentMutation.isPending}
                onSuccess={handlePaymentSuccess}
              />
            </Stack>
          )}
        </Stack>

        <Row gap={12}>
          <Button
            flex={1}
            size={16}
            variant="outline"
            disabled={requestPaymentMutation.isPending || confirmPaymentMutation.isPending}
            onPress={() => router.back()}
          >
            Cancel
          </Button>
          {!paymentSession && (
            <Button
              flex={1}
              size={16}
              theme="blue"
              onPress={handleSubmit}
              disabled={requestPaymentMutation.isPending}
            >
              {requestPaymentMutation.isPending ? 'Preparing payment…' : 'Continue to payment'}
            </Button>
          )}
        </Row>
        {paymentSession && (
          <Button
            size={12}
            variant="outline"
            marginTop={8}
            onPress={() => {
              if (!confirmPaymentMutation.isPending) {
                setPaymentSession(null)
                setRequestError(null)
              }
            }}
            disabled={confirmPaymentMutation.isPending}
          >
            Reset payment form
          </Button>
        )}
      </Stack>
    </ScrollView>
  )
}
