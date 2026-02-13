import { api } from '@scf/core/utils/api'
import { colors } from '@scaffald/ui/tokens'
import {
  Button,
  Card,
  CustomCheckbox,
  ResponsiveModal,
  Spinner,
  Text,
  TextArea,
  Row,
  Stack,
  useToast,
  useThemeContext,
} from '@scaffald/ui'
import { useEffect, useMemo, useState } from 'react'
import { PaymentIntentForm } from '../../../payments/components/PaymentIntentForm'
import type { ApplicationStatus, MockApplication } from '../../mock-data/ats-mock-data'

interface ApplicationStatusChangeModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void> | void
  candidateName: string
  fromStatus: ApplicationStatus
  toStatus: ApplicationStatus
  isLoading?: boolean
  application?: MockApplication
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'New',
  screen: 'Screening',
  inquired: 'Inquired',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
}

export const ApplicationStatusChangeModal = ({
  open,
  onClose,
  onConfirm,
  candidateName,
  fromStatus,
  toStatus,
  isLoading = false,
  application,
}: ApplicationStatusChangeModalProps) => {
  const { theme } = useThemeContext()
  const [reason, setReason] = useState('')
  const toast = useToast()
  const successFeeMutation = api.successFees.createSuccessFee.useMutation()
  const confirmUpfrontPaymentMutation = api.successFees.confirmUpfrontPayment.useMutation()

  const isRejection = toStatus === 'rejected'
  const isHire = toStatus === 'hired'

  const hireInputs = useMemo(
    () => (isHire ? deriveHireInputs(application) : null),
    [application, isHire]
  )
  const hireSummary = useMemo(
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

  const [initializingIntent, setInitializingIntent] = useState(false)
  const [intentState, setIntentState] = useState<Awaited<
    ReturnType<typeof successFeeMutation.mutateAsync>
  > | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [resumeAttempted, setResumeAttempted] = useState(false)

  const canQuerySuccessFeeStatus =
    Boolean(
      isHire && open && application?.organizationId && application?.id && hireInputs?.workerUserId
    ) && Boolean(hireInputs?.organizationId)

  const successFeeStatusQuery = api.successFees.getStatusByApplication.useQuery(
    {
      organizationId: hireInputs?.organizationId ?? application?.organizationId ?? '',
      applicationId: application?.id ?? '',
      workerUserId: hireInputs?.workerUserId ?? '',
    },
    {
      enabled: canQuerySuccessFeeStatus,
      staleTime: 10 * 1000,
    }
  )

  const successFeeStatus = successFeeStatusQuery.data

  // Removed hireInputsKey - using hireInputs directly in dependencies

  useEffect(() => {
    if (!open) return
    setResumeAttempted(false)
  }, [open])

  useEffect(() => {
    if (!open || !isHire) {
      setIntentState(null)
      setPaymentError(null)
      setPaymentCompleted(false)
      setInitializingIntent(false)
      setResumeAttempted(false)
      setLegalAccepted(false)
      return
    }

    if (!hireInputs) {
      setIntentState(null)
      setPaymentError(null)
      return
    }

    if (successFeeStatusQuery.isLoading) {
      return
    }

    if (successFeeStatus?.status === 'upfront_paid') {
      setPaymentCompleted(true)
      setIntentState(null)
      return
    }

    let cancelled = false
    const createIntent = async () => {
      setInitializingIntent(true)
      setPaymentError(null)
      try {
        const result = await successFeeMutation.mutateAsync({
          organizationId: hireInputs.organizationId,
          workerUserId: hireInputs.workerUserId,
          jobId: hireInputs.jobId,
          applicationId: hireInputs.applicationId,
          totalHireValueCents: hireInputs.totalHireValueCents,
          jobDurationDays: hireInputs.jobDurationDays,
          hireStartDate: hireInputs.hireStartDate,
        })
        if (!cancelled) {
          setIntentState(result)
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : 'Unable to create success fee intent.'
          setPaymentError(message)
          setIntentState(null)
        }
      } finally {
        if (!cancelled) {
          setInitializingIntent(false)
        }
      }
    }

    if (!resumeAttempted) {
      createIntent()
      setResumeAttempted(true)
    }

    return () => {
      cancelled = true
    }
  }, [
    open,
    isHire,
    hireInputs,
    successFeeMutation.mutateAsync,
    successFeeStatus?.status,
    successFeeStatusQuery.isLoading,
    resumeAttempted,
    successFeeMutation,
  ])

  const handleConfirm = async () => {
    if (isHire) {
      return
    }
    if (isRejection && !reason.trim()) {
      return
    }

    await onConfirm(reason)
    setReason('')
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  const confirmDisabled = isLoading || (isRejection && !reason.trim())

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!intentState) return
    setIsProcessingPayment(true)
    setPaymentError(null)
    try {
      await confirmUpfrontPaymentMutation.mutateAsync({
        successFeeId: intentState.successFeeId,
        paymentIntentId,
      })
      // TODO: Capture signed legal acknowledgement + generated PDF once available.
      setPaymentCompleted(true)
      toast.show({
        title: 'Upfront fee paid',
        message: 'Hire confirmed successfully.',
      })
      await successFeeStatusQuery.refetch()
      await onConfirm(reason)
      setReason('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to confirm payment.'
      setPaymentError(message)
      toast.show({
        title: 'Payment confirmation failed',
        variant: 'error',
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const legalCopy =
    'TODO: Replace with the final anti-circumvention clause before launch. Paying this fee confirms you agree to keep communication and hires on-platform.'

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose()
      }}
      title={isRejection ? 'Reject Application' : 'Mark as Hired'}
    >
      <Stack gap={16} padding="md">
        {/* Confirmation message */}
        <Stack gap={8}>
          <Text>
            {isRejection ? `Reject ${candidateName}?` : `Mark ${candidateName} as Hired?`}
          </Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            This will move the application from <Text>{STATUS_LABELS[fromStatus]}</Text> to{' '}
            <Text>{STATUS_LABELS[toStatus]}</Text>
          </Text>
        </Stack>

        {isHire && (
          <Stack gap={12}>
            <HireSummaryCard
              hireSummary={hireSummary}
              isProcessing={initializingIntent}
              hasMissingData={!hireInputs}
              paymentError={paymentError}
              successFeeStatus={successFeeStatus}
              isStatusLoading={successFeeStatusQuery.isLoading}
            />

            {initializingIntent && !paymentCompleted && (
              <Stack gap={4} align="center">
                <Spinner size="sm" />
                <Text style={{ color: colors.text[theme].secondary }}>Preparing payment form…</Text>
              </Stack>
            )}

            {!successFeeStatusQuery.isLoading && successFeeStatus?.status === 'upfront_paid' && (
              <Card
                padding="sm"
                style={{ backgroundColor: colors.bg[theme].successSubtle }}
                borderColor={colors.border[theme].success}
                borderWidth={1}
              >
                <Text style={{ color: colors.text[theme].success }}>
                  Upfront fee paid on{' '}
                  {successFeeStatus.upfrontPaidAt
                    ? new Date(successFeeStatus.upfrontPaidAt).toLocaleDateString()
                    : 'recently'}
                  .
                </Text>
                <Text style={{ color: colors.text[theme].success }}>
                  You can now mark this candidate as hired.
                </Text>
              </Card>
            )}

            {hireInputs &&
              intentState?.clientSecret &&
              hireSummary &&
              successFeeStatus?.status !== 'upfront_paid' && (
                <Stack gap={12}>
                  <Card
                    padding="sm"
                    style={{ backgroundColor: colors.bg[theme].subtle }}
                    borderColor={colors.border[theme].default}
                    borderWidth={1}
                  >
                    <Row gap={8} align="center">
                      <CustomCheckbox
                        aria-label="Acknowledge success-fee agreement"
                        checked={legalAccepted}
                        onChange={(next) => setLegalAccepted(Boolean(next))}
                      />
                      <Text flex={1} style={{ color: colors.text[theme].secondary }}>
                        {legalCopy}
                      </Text>
                    </Row>
                  </Card>
                  <PaymentIntentForm
                    clientSecret={intentState.clientSecret}
                    amountCents={intentState.schedule.upfrontAmountCents}
                    description={`Charge ${intentState.schedule.upfrontPercentage}% upfront success fee`}
                    submitLabel={paymentCompleted ? 'Payment complete' : 'Charge & Confirm Hire'}
                    disabled={!legalAccepted || paymentCompleted || isProcessingPayment}
                    onSuccess={handlePaymentSuccess}
                  />
                </Stack>
              )}
          </Stack>
        )}

        {/* Reason input */}
        <Stack gap={8}>
          <Text>
            {isRejection ? 'Reason for rejection' : 'Notes (optional)'}
            {isRejection && <Text style={{ color: colors.text[theme].error }}> *</Text>}
          </Text>
          <TextArea
            data-testid="status-change-reason-input"
            placeholder={
              isRejection
                ? 'Please provide a reason for rejection...'
                : 'Add any notes about this hire...'
            }
            value={reason}
            onChangeText={setReason}
            height={120}
          />
          {isRejection && !reason.trim() && (
            <Text data-testid="reason-error" style={{ color: colors.text[theme].error }}>
              Rejection reason is required
            </Text>
          )}
        </Stack>

        {/* Action buttons */}
        <Row gap={12} marginLeft="auto">
          <Button
            data-testid="status-change-cancel-button"
            variant="outline"
            onPress={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          {!isHire && (
            <Button
              data-testid="status-change-confirm-button"
              onPress={handleConfirm}
              disabled={confirmDisabled}
              style={{
                backgroundColor: isRejection ? colors.bg[theme].error : colors.bg[theme].success,
              }}
              hoverStyle={{
                backgroundColor: isRejection
                  ? colors.text[theme].error
                  : colors.text[theme].success,
              }}
            >
              {isLoading ? 'Processing...' : isRejection ? 'Reject Application' : 'Confirm Hire'}
            </Button>
          )}
        </Row>
      </Stack>
    </ResponsiveModal>
  )
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

type SuccessFeeStatusResult = ReturnType<
  typeof api.successFees.getStatusByApplication.useQuery
>['data']

interface HireInputs {
  organizationId: string
  workerUserId: string
  jobId: string
  applicationId: string
  totalHireValueCents: number
  jobDurationDays: number
  hireStartDate: string
}

function deriveHireInputs(application?: MockApplication | null): HireInputs | null {
  if (!application) return null

  const organizationId = application.job.organizationId || application.organizationId
  const workerUserId = application.workerUserId || application.candidate.id

  if (!organizationId || !workerUserId) {
    return null
  }

  const payRangeMax = application.job.payRangeMaxCents ?? undefined
  const payRangeMin = application.job.payRangeMinCents ?? undefined
  const payType = application.job.payRangeType ?? 'salary'

  const baseAmount = payRangeMax ?? payRangeMin
  if (!baseAmount || baseAmount <= 0) {
    return null
  }

  let totalHireValueCents = baseAmount
  if (payType === 'hourly') {
    totalHireValueCents = Math.round(baseAmount * 40 * 52)
  }

  const jobDurationDays = payType === 'salary' ? 60 : 21

  const hireStartDate = normalizeDate(
    application.screeningAnswers.earliestStartDate || undefined // targetStartDate column doesn't exist in database yet
  )

  return {
    organizationId,
    workerUserId,
    jobId: application.job.id,
    applicationId: application.id,
    totalHireValueCents,
    jobDurationDays,
    hireStartDate,
  }
}

function toISODate(date: Date) {
  const [datePart] = date.toISOString().split('T')
  return datePart ?? ''
}

function normalizeDate(value?: string): string {
  if (!value) return toISODate(new Date())
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return toISODate(new Date())
  }
  return toISODate(parsed)
}

function deriveSchedule(
  totalHireValueCents: number,
  jobDurationDays: number,
  hireStartDate: string
) {
  const paymentSchedule = jobDurationDays >= 30 ? 'standard' : 'short'
  const upfrontPercentage = paymentSchedule === 'standard' ? 20 : 50
  const finalPercentage = 100 - upfrontPercentage
  const upfrontAmountCents = Math.round(totalHireValueCents * (upfrontPercentage / 100))
  const finalAmountCents = Math.max(totalHireValueCents - upfrontAmountCents, 0)
  const finalDueDate = addDays(
    hireStartDate,
    paymentSchedule === 'standard' ? 30 : Math.max(jobDurationDays, 1)
  )

  return {
    totalHireValueCents,
    paymentSchedule,
    upfrontPercentage,
    finalPercentage,
    upfrontAmountCents,
    finalAmountCents,
    finalDueDate,
  }
}

function addDays(isoDate: string, days: number) {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate
  const clone = new Date(date)
  clone.setDate(clone.getDate() + days)
  return toISODate(clone)
}

function HireSummaryCard({
  hireSummary,
  isProcessing,
  hasMissingData,
  paymentError,
  successFeeStatus,
  isStatusLoading,
}: {
  hireSummary: ReturnType<typeof deriveSchedule> | null
  isProcessing: boolean
  hasMissingData: boolean
  paymentError: string | null
  successFeeStatus?: SuccessFeeStatusResult
  isStatusLoading?: boolean
}) {
  const { theme } = useThemeContext()
  if (hasMissingData) {
    return (
      <Card
        padding="sm"
        style={{ backgroundColor: colors.bg[theme].warningSubtle }}
        borderColor={colors.border[theme].warning}
        borderWidth={1}
      >
        <Text style={{ color: colors.text[theme].warning }}>
          Add pay range information to this job before marking the hire.
        </Text>
        <Text marginTop={4} style={{ color: colors.text[theme].warning }}>
          We use the job&apos;s pay range to calculate success fees and payment schedules.
        </Text>
      </Card>
    )
  }

  if (!hireSummary) {
    return null
  }

  return (
    <Card padding="md" borderWidth={1} borderColor={colors.border[theme].default}>
      <Stack gap={8}>
        <Text>Success Fee Overview</Text>
        <Row justify="space-between">
          <Text style={{ color: colors.text[theme].secondary }}>Total Hire Value</Text>
          <Text>{currencyFormatter.format(hireSummary.totalHireValueCents / 100)}</Text>
        </Row>
        <Row justify="space-between">
          <Text style={{ color: colors.text[theme].secondary }}>
            Upfront ({hireSummary.upfrontPercentage}%)
          </Text>
          <Text>{currencyFormatter.format(hireSummary.upfrontAmountCents / 100)}</Text>
        </Row>
        <Row justify="space-between">
          <Text style={{ color: colors.text[theme].secondary }}>
            Final ({hireSummary.finalPercentage}%)
          </Text>
          <Text>
            {currencyFormatter.format(hireSummary.finalAmountCents / 100)} • Due{' '}
            {hireSummary.finalDueDate}
          </Text>
        </Row>
        {isProcessing && (
          <Text style={{ color: colors.text[theme].secondary }}>Creating payment intent...</Text>
        )}
        {paymentError && <Text style={{ color: colors.text[theme].error }}>{paymentError}</Text>}
        {isStatusLoading && (
          <Text style={{ color: colors.text[theme].secondary }}>
            Checking latest payment status…
          </Text>
        )}
        {!isStatusLoading &&
          successFeeStatus &&
          typeof (successFeeStatus as unknown as Record<string, unknown>)?.status === 'string' && (
            <Text style={{ color: colors.text[theme].secondary }}>
              Current status:{' '}
              {(successFeeStatus as unknown as Record<string, unknown>).status
                ?.toString()
                .replace(/_/g, ' ')}
            </Text>
          )}
      </Stack>
    </Card>
  )
}
