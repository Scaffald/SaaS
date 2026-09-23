import { ROUTES, buildPath } from '@scf/core/constants/routes'
import {
  useConfirmUpfrontPaymentMutation,
  useCreateSuccessFeeMutation,
  useSuccessFeeStatus,
  type CreateSuccessFeeResponse,
} from '@scf/core/utils/success-fees-sdk-hooks'
import { useUpdateEmployerApplicationMutation } from '@scf/core/utils/applications-sdk-hooks'
import {
  Button,
  Checkbox,
  H3,
  MetricBlock,
  MetricRow,
  ScreenHeader,
  Separator,
  Spinner,
  Stack,
  Row,
  Text,
  useThemeContext,
  useToast,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PaymentIntentForm } from '../../../payments/components/PaymentIntentForm'
import { STATUS_MAP } from '../hooks/useApplicationStatusChange'
import type { ATSApplication } from '../types'
import { deriveHireInputs, deriveSchedule, formatCents, formatDueDate } from './hire-schedule'

/**
 * Hiring, as a screen (#836).
 *
 * This was a branch inside `ApplicationStatusChangeModal` — the same dialog
 * used to reject a candidate or add a note, but with a Stripe payment element,
 * a fee breakdown and a clickwrap acknowledgement folded in below a "Notes
 * (optional)" box. It is the most consequential thing an employer does in the
 * product and it was happening in a box that could be dismissed by clicking
 * beside it.
 *
 * A screen instead, in the order the decision is actually made: what this
 * unlocks, what it costs and when, then the acknowledgement and the card. Every
 * other status change keeps the modal.
 */
export function HireScreen({ application }: { application: ATSApplication }) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [legalAccepted, setLegalAccepted] = useState(false)
  const [intentState, setIntentState] = useState<CreateSuccessFeeResponse | null>(null)
  const [initializingIntent, setInitializingIntent] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)

  const successFeeMutation = useCreateSuccessFeeMutation()
  const confirmUpfrontPaymentMutation = useConfirmUpfrontPaymentMutation()
  const updateApplication = useUpdateEmployerApplicationMutation()

  const candidateName = application.candidate.name || 'This candidate'
  const jobTitle = application.job.title || 'the role'

  const hireInputs = useMemo(() => deriveHireInputs(application), [application])
  const schedule = useMemo(
    () =>
      hireInputs
        ? deriveSchedule(
            hireInputs.totalHireValueCents,
            hireInputs.jobDurationDays,
            hireInputs.hireStartDate
          )
        : null,
    [hireInputs]
  )

  const statusQuery = useSuccessFeeStatus(
    {
      organizationId: hireInputs?.organizationId ?? '',
      applicationId: application.id,
      workerUserId: hireInputs?.workerUserId ?? '',
    },
    { enabled: Boolean(hireInputs), staleTime: 10 * 1000 }
  )
  const alreadyPaid = statusQuery.data?.status === 'upfront_paid'

  /**
   * One intent per visit, and exactly one on failure.
   *
   * The modal guarded this with a `resumeAttempted` flag set inside the same
   * effect that read it, in an effect that also depended on the mutation
   * object — whose identity changes on every render. A ref says "we have
   * asked" without being part of the dependency graph, and `mutateAsync` is
   * held in a ref for the same reason. Retrying is an explicit button rather
   * than something the effect decides: clearing the guard in the `catch`
   * makes a re-request depend on whatever re-renders next, which is neither
   * predictable for the reader nor bounded by anything they did.
   */
  const [retryToken, setRetryToken] = useState(0)
  const intentRequested = useRef(false)
  const createIntent = useRef(successFeeMutation.mutateAsync)
  createIntent.current = successFeeMutation.mutateAsync

  useEffect(() => {
    if (!hireInputs || statusQuery.isLoading || alreadyPaid) return
    if (intentRequested.current) return
    intentRequested.current = true

    let cancelled = false
    setInitializingIntent(true)
    setPaymentError(null)
    createIntent
      .current({
        organizationId: hireInputs.organizationId,
        workerUserId: hireInputs.workerUserId,
        jobId: hireInputs.jobId,
        applicationId: hireInputs.applicationId,
        totalHireValueCents: hireInputs.totalHireValueCents,
        jobDurationDays: hireInputs.jobDurationDays,
        hireStartDate: hireInputs.hireStartDate,
      })
      .then((result) => {
        if (!cancelled) setIntentState(result)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setPaymentError(error instanceof Error ? error.message : 'Unable to prepare the payment.')
      })
      .finally(() => {
        if (!cancelled) setInitializingIntent(false)
      })

    return () => {
      cancelled = true
    }
  }, [hireInputs, statusQuery.isLoading, alreadyPaid, retryToken])

  const retryIntent = () => {
    intentRequested.current = false
    setRetryToken((n) => n + 1)
  }

  const backToCandidate = () =>
    router.replace(buildPath(ROUTES.OFFICE.APPLICATIONS.DETAIL, { applicationId: application.id }))

  const markHired = async () => {
    await updateApplication.mutateAsync({
      id: application.id,
      params: { status: STATUS_MAP.hired },
    })
    queryClient.invalidateQueries({ queryKey: ['applications'] })
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!intentState) return
    setIsConfirming(true)
    setPaymentError(null)
    try {
      await confirmUpfrontPaymentMutation.mutateAsync({
        successFeeId: intentState.successFeeId,
        paymentIntentId,
      })
      setPaymentCompleted(true)
      await markHired()
      toast.show({
        title: 'Hire confirmed',
        message: `${candidateName} has been marked as hired.`,
      })
      backToCandidate()
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Unable to confirm the payment.')
      toast.show({
        title: 'Payment confirmation failed',
        message: 'The card was not charged twice — try again.',
        variant: 'error',
      })
    } finally {
      setIsConfirming(false)
    }
  }

  /** The fee is already settled; all that is left is the status change. */
  const handleConfirmWithoutPayment = async () => {
    setIsConfirming(true)
    try {
      await markHired()
      toast.show({
        title: 'Hire confirmed',
        message: `${candidateName} has been marked as hired.`,
      })
      backToCandidate()
    } catch (error) {
      toast.show({
        title: 'Unable to confirm the hire',
        message: error instanceof Error ? error.message : 'Please try again.',
        variant: 'error',
      })
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <Stack gap={24} style={READING_COLUMN}>
      <ScreenHeader
        kicker={`${candidateName} · ${jobTitle}`}
        title="Hire"
        tip="Paying the upfront fee confirms the hire and moves the application to Hired. The rest is billed later."
        actions={
          <Button size="sm" variant="outline" onPress={backToCandidate} disabled={isConfirming}>
            Cancel
          </Button>
        }
      />

      <Stack gap={16}>
        <H3>What this unlocks</H3>
        <Stack gap={6}>
          <Text style={{ color: colors.text[t].secondary }}>
            {candidateName} is marked as hired, and {jobTitle} stops taking applications from this
            pipeline.
          </Text>
          <Text style={{ color: colors.text[t].secondary }}>
            Their contact details become available to your team, and the placement starts counting
            towards your organisation's record on Scaffald.
          </Text>
        </Stack>
      </Stack>

      <Separator />

      <Stack gap={16}>
        <H3>The fee</H3>
        {!hireInputs || !schedule ? (
          <Stack gap={8}>
            <Text style={{ color: colors.text[t].attention }}>This hire cannot be priced yet.</Text>
            <Text style={{ color: colors.text[t].secondary }}>
              The fee is calculated from the job's pay range, and {jobTitle} does not have one. Add
              a pay range to the posting, then come back.
            </Text>
            <Row>
              <Button
                size="sm"
                variant="outline"
                onPress={() =>
                  router.push(buildPath(ROUTES.JOBS.DETAIL, { id: application.job.id }))
                }
              >
                Open the posting
              </Button>
            </Row>
          </Stack>
        ) : (
          <Stack gap={8}>
            <MetricRow bordered minColumnWidth={150}>
              <MetricBlock label="Hire value" value={formatCents(schedule.totalHireValueCents)} />
              <MetricBlock
                label="Due now"
                value={formatCents(schedule.upfrontAmountCents)}
                delta={`${schedule.upfrontPercentage}% of the hire value`}
                emphasis
              />
              <MetricBlock
                label="Due later"
                value={formatCents(schedule.finalAmountCents)}
                delta={`${schedule.finalPercentage}% on ${formatDueDate(schedule.finalDueDate)}`}
              />
            </MetricRow>
            <Text style={{ color: colors.text[t].tertiary }}>
              Calculated from the posting's pay range
              {schedule.paymentSchedule === 'short' ? ', on the short-engagement schedule.' : '.'}
            </Text>
          </Stack>
        )}
      </Stack>

      {hireInputs && schedule ? (
        <>
          <Separator />
          <Stack gap={16}>
            <H3>Confirm and pay</H3>

            {statusQuery.isLoading ? (
              <Row gap={8} align="center">
                <Spinner variant="ios" size="sm" />
                <Text style={{ color: colors.text[t].secondary }}>
                  Checking whether this fee is already paid…
                </Text>
              </Row>
            ) : alreadyPaid ? (
              <Stack gap={12} align="flex-start">
                <Text style={{ color: colors.fg[t].success }}>
                  The upfront fee for this hire is already paid
                  {statusQuery.data?.upfrontPaidAt
                    ? ` (${formatDueDate(statusQuery.data.upfrontPaidAt)})`
                    : ''}
                  .
                </Text>
                <Button
                  color="primary"
                  onPress={handleConfirmWithoutPayment}
                  disabled={isConfirming}
                >
                  {isConfirming ? 'Confirming…' : 'Confirm the hire'}
                </Button>
              </Stack>
            ) : (
              <Stack gap={16}>
                <Row gap={10} align="flex-start">
                  <Checkbox
                    aria-label="Confirm this hire is subject to the Scaffald Terms of Service"
                    checked={legalAccepted}
                    onChange={(next) => setLegalAccepted(Boolean(next))}
                  />
                  <Text style={{ flex: 1, minWidth: 0, color: colors.text[t].secondary }}>
                    I confirm this hire and agree it is subject to the Scaffald{' '}
                    <Text
                      onPress={() => router.push(ROUTES.LEGAL.TERMS.path)}
                      style={{
                        color: colors.text[t].emphasis,
                        textDecorationLine: 'underline',
                      }}
                    >
                      Terms of Service
                    </Text>
                    , including its terms on keeping hiring and communication on-platform.
                  </Text>
                </Row>

                {initializingIntent ? (
                  <Row gap={8} align="center">
                    <Spinner variant="ios" size="sm" />
                    <Text style={{ color: colors.text[t].secondary }}>
                      Preparing the payment form…
                    </Text>
                  </Row>
                ) : null}

                {paymentError ? (
                  <Stack gap={8} align="flex-start">
                    <Text style={{ color: colors.fg[t].error }}>{paymentError}</Text>
                    {!intentState ? (
                      <Button size="sm" variant="outline" onPress={retryIntent}>
                        Try again
                      </Button>
                    ) : null}
                  </Stack>
                ) : null}

                {intentState?.clientSecret ? (
                  <PaymentIntentForm
                    clientSecret={intentState.clientSecret}
                    amountCents={schedule.upfrontAmountCents}
                    description={`${schedule.upfrontPercentage}% upfront success fee`}
                    submitLabel={
                      paymentCompleted
                        ? 'Hire confirmed'
                        : `Pay ${formatCents(schedule.upfrontAmountCents)} and confirm`
                    }
                    disabled={!legalAccepted || paymentCompleted || isConfirming}
                    onSuccess={handlePaymentSuccess}
                  />
                ) : null}
              </Stack>
            )}
          </Stack>
        </>
      ) : null}
    </Stack>
  )
}

/** A payment form is a reading task, not a dashboard. Keep it to one column. */
const READING_COLUMN = { width: '100%', maxWidth: 720, alignSelf: 'flex-start' } as const
