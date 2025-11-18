import { useEffect, useMemo, useState } from 'react'
import { YStack, Button, Text, XStack, ResponsiveModal, Spinner, CustomCheckbox } from '@app/ui'
import { Card, TextArea } from 'tamagui'
import { useToastController } from '@tamagui/toast'
import { api } from '@app/core/utils/api'
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
  const [reason, setReason] = useState('')
  const toast = useToastController()
  const successFeeMutation = api.successFees.createSuccessFee.useMutation()
  const confirmUpfrontPaymentMutation = api.successFees.confirmUpfrontPayment.useMutation()

  const isRejection = toStatus === 'rejected'
  const isHire = toStatus === 'hired'

  const hireInputs = useMemo(() => (isHire ? deriveHireInputs(application) : null), [application, isHire])
  const hireSummary = useMemo(
    () =>
      hireInputs
        ? deriveSchedule(hireInputs.totalHireValueCents, hireInputs.jobDurationDays, hireInputs.hireStartDate)
        : null,
    [hireInputs]
  )

  const [initializingIntent, setInitializingIntent] = useState(false)
  const [intentState, setIntentState] =
    useState<Awaited<ReturnType<typeof successFeeMutation.mutateAsync>> | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [resumeAttempted, setResumeAttempted] = useState(false)

  const canQuerySuccessFeeStatus =
    Boolean(
      isHire &&
        open &&
        application?.organizationId &&
        application?.id &&
        hireInputs?.workerUserId
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

  const hireInputsKey = hireInputs
    ? [
        hireInputs.organizationId,
        hireInputs.workerUserId,
        hireInputs.jobId,
        hireInputs.applicationId,
        hireInputs.totalHireValueCents,
        hireInputs.jobDurationDays,
        hireInputs.hireStartDate,
      ].join(':')
    : 'missing'

  useEffect(() => {
    if (!open) return
    setResumeAttempted(false)
  }, [hireInputsKey, open])

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
          const message = error instanceof Error ? error.message : 'Unable to create success fee intent.'
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
    hireInputsKey,
    successFeeMutation,
    successFeeStatus?.status,
    successFeeStatusQuery.isLoading,
    resumeAttempted,
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
      toast.show('Upfront fee paid', { message: 'Hire confirmed successfully.' })
      await successFeeStatusQuery.refetch()
      await onConfirm(reason)
      setReason('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to confirm payment.'
      setPaymentError(message)
      toast.show('Payment confirmation failed', {
        message,
        type: 'error',
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
      <YStack gap="$4" p="$4">
        {/* Confirmation message */}
        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="600">
            {isRejection ? `Reject ${candidateName}?` : `Mark ${candidateName} as Hired?`}
          </Text>
          <Text color="$color11" fontSize="$3">
            This will move the application from{' '}
            <Text fontWeight="600">{STATUS_LABELS[fromStatus]}</Text> to{' '}
            <Text fontWeight="600">{STATUS_LABELS[toStatus]}</Text>
          </Text>
        </YStack>

        {isHire && (
          <YStack gap="$3">
            <HireSummaryCard
              hireSummary={hireSummary}
              isProcessing={initializingIntent}
              hasMissingData={!hireInputs}
              paymentError={paymentError}
              successFeeStatus={successFeeStatus}
              isStatusLoading={successFeeStatusQuery.isLoading}
            />

            {initializingIntent && !paymentCompleted && (
              <YStack gap="$1" items="center">
                <Spinner size="small" />
                <Text color="$color11" fontSize="$3">
                  Preparing payment form…
                </Text>
              </YStack>
            )}

            {!successFeeStatusQuery.isLoading && successFeeStatus?.status === 'upfront_paid' && (
              <Card p="$3" bg="$green2" borderColor="$green6" borderWidth={1}>
                <Text fontWeight="600" color="$green11">
                  Upfront fee paid on{' '}
                  {successFeeStatus.upfrontPaidAt
                    ? new Date(successFeeStatus.upfrontPaidAt).toLocaleDateString()
                    : 'recently'}
                  .
                </Text>
                <Text color="$green11">You can now mark this candidate as hired.</Text>
              </Card>
            )}

            {hireInputs &&
              intentState?.clientSecret &&
              hireSummary &&
              successFeeStatus?.status !== 'upfront_paid' && (
                <YStack gap="$3">
                  <Card p="$3" bg="$color2" borderColor="$borderColor" borderWidth={1}>
                    <XStack gap="$2" items="center">
                      <CustomCheckbox
                        aria-label="Acknowledge success-fee agreement"
                        checked={legalAccepted}
                        onCheckedChange={(next) => setLegalAccepted(Boolean(next))}
                      />
                      <Text flex={1} fontSize="$3" color="$color11">
                        {legalCopy}
                      </Text>
                    </XStack>
                  </Card>
                  <PaymentIntentForm
                    clientSecret={intentState.clientSecret}
                    amountCents={intentState.schedule.upfrontAmountCents}
                    description={`Charge ${intentState.schedule.upfrontPercentage}% upfront success fee`}
                    submitLabel={paymentCompleted ? 'Payment complete' : 'Charge & Confirm Hire'}
                    disabled={!legalAccepted || paymentCompleted || isProcessingPayment}
                    onSuccess={handlePaymentSuccess}
                  />
                </YStack>
              )}
          </YStack>
        )}

        {/* Reason input */}
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600">
            {isRejection ? 'Reason for rejection' : 'Notes (optional)'}
            {isRejection && <Text color="$red10"> *</Text>}
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
            numberOfLines={4}
          />
          {isRejection && !reason.trim() && (
            <Text data-testid="reason-error" color="$red10" fontSize="$2">
              Rejection reason is required
            </Text>
          )}
        </YStack>

        {/* Action buttons */}
        <XStack gap="$3" ml="auto">
          <Button data-testid="status-change-cancel-button" variant="outlined" onPress={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          {!isHire && (
            <Button
              data-testid="status-change-confirm-button"
              onPress={handleConfirm}
              disabled={confirmDisabled}
              bg={isRejection ? '$red9' : '$green9'}
              hoverStyle={{
                bg: isRejection ? '$red10' : '$green10',
              }}
            >
              {isLoading
                ? 'Processing...'
                : isRejection
                  ? 'Reject Application'
                  : 'Confirm Hire'}
            </Button>
          )}
        </XStack>
      </YStack>
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
    application.screeningAnswers.earliestStartDate || application.job.targetStartDate || undefined
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

function deriveSchedule(totalHireValueCents: number, jobDurationDays: number, hireStartDate: string) {
  const paymentSchedule = jobDurationDays >= 30 ? 'standard' : 'short'
  const upfrontPercentage = paymentSchedule === 'standard' ? 20 : 50
  const finalPercentage = 100 - upfrontPercentage
  const upfrontAmountCents = Math.round(totalHireValueCents * (upfrontPercentage / 100))
  const finalAmountCents = Math.max(totalHireValueCents - upfrontAmountCents, 0)
  const finalDueDate = addDays(hireStartDate, paymentSchedule === 'standard' ? 30 : Math.max(jobDurationDays, 1))

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
  if (hasMissingData) {
    return (
      <Card p="$3" bg="$yellow2" borderColor="$yellow8" borderWidth={1}>
        <Text fontWeight="600" color="$yellow11">
          Add pay range information to this job before marking the hire.
        </Text>
        <Text mt="$1" fontSize="$3" color="$yellow11">
          We use the job&apos;s pay range to calculate success fees and payment schedules.
        </Text>
      </Card>
    )
  }

  if (!hireSummary) {
    return null
  }

  return (
    <Card p="$4" borderWidth={1} borderColor="$borderColor">
      <YStack gap="$2">
        <Text fontSize="$4" fontWeight="600">
          Success Fee Overview
        </Text>
        <XStack justify="space-between">
          <Text color="$color11">Total Hire Value</Text>
          <Text fontWeight="600">{currencyFormatter.format(hireSummary.totalHireValueCents / 100)}</Text>
        </XStack>
        <XStack justify="space-between">
          <Text color="$color11">Upfront ({hireSummary.upfrontPercentage}%)</Text>
          <Text fontWeight="600">{currencyFormatter.format(hireSummary.upfrontAmountCents / 100)}</Text>
        </XStack>
        <XStack justify="space-between">
          <Text color="$color11">Final ({hireSummary.finalPercentage}%)</Text>
          <Text fontWeight="600">
            {currencyFormatter.format(hireSummary.finalAmountCents / 100)} • Due {hireSummary.finalDueDate}
          </Text>
        </XStack>
        {isProcessing && (
          <Text fontSize="$2" color="$color11">
            Creating payment intent...
          </Text>
        )}
        {paymentError && (
          <Text fontSize="$2" color="$red10">
            {paymentError}
          </Text>
        )}
        {isStatusLoading && (
          <Text fontSize="$2" color="$color11">
            Checking latest payment status…
          </Text>
        )}
        {!isStatusLoading && successFeeStatus?.status && (
          <Text fontSize="$2" color="$color11">
            Current status: {successFeeStatus.status.replace(/_/g, ' ')}
          </Text>
        )}
      </YStack>
    </Card>
  )
}
