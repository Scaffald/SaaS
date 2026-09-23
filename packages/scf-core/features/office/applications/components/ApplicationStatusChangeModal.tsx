import { colors } from '@scaffald/ui/tokens'
import { Button, Text, TextArea, Row, Stack, useThemeContext, ResponsiveModal } from '@scaffald/ui'
import { useState } from 'react'
import type { ApplicationStatus } from '../types'

interface ApplicationStatusChangeModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void> | void
  candidateName: string
  fromStatus: ApplicationStatus
  toStatus: ApplicationStatus
  isLoading?: boolean
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'New',
  screen: 'Screening',
  inquired: 'Inquired',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

/**
 * Confirming a status change that cannot be undone by dragging the card back.
 *
 * This used to carry hiring as well: a Stripe payment element, a fee
 * breakdown and a clickwrap acknowledgement, folded into the same dialog that
 * asks for a rejection reason and shown below a "Notes (optional)" box. Hiring
 * is its own screen now (#836), which is why the payment machinery, the
 * success-fee schedule maths and the `application` prop are all gone from
 * here. What is left is the confirmation this component was always for.
 */
export const ApplicationStatusChangeModal = ({
  open,
  onClose,
  onConfirm,
  candidateName,
  fromStatus,
  toStatus,
  isLoading = false,
}: ApplicationStatusChangeModalProps) => {
  const { theme } = useThemeContext()
  const [reason, setReason] = useState('')

  const isRejection = toStatus === 'rejected'

  const handleConfirm = async () => {
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

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose()
      }}
      title={isRejection ? 'Reject Application' : `Move to ${STATUS_LABELS[toStatus]}`}
    >
      <Stack gap={16} padding="md">
        <Stack gap={8}>
          <Text>
            {isRejection
              ? `Reject ${candidateName}?`
              : `Move ${candidateName} to ${STATUS_LABELS[toStatus]}?`}
          </Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            This will move the application from <Text>{STATUS_LABELS[fromStatus]}</Text> to{' '}
            <Text>{STATUS_LABELS[toStatus]}</Text>
          </Text>
        </Stack>

        <Stack gap={8}>
          <Text>
            {isRejection ? 'Reason for rejection' : 'Notes (optional)'}
            {isRejection && (
              <Text style={{ color: theme === 'light' ? colors.error[700] : colors.error[300] }}>
                {' '}
                *
              </Text>
            )}
          </Text>
          <TextArea
            data-testid="status-change-reason-input"
            placeholder={
              isRejection
                ? 'Please provide a reason for rejection...'
                : 'Add any notes about this change...'
            }
            value={reason}
            onChangeText={setReason}
            style={{ minHeight: 120 }}
          />
          {isRejection && !reason.trim() && (
            <Text
              data-testid="reason-error"
              style={{ color: theme === 'light' ? colors.error[700] : colors.error[300] }}
            >
              Rejection reason is required
            </Text>
          )}
        </Stack>

        <Row gap={12} style={{ marginLeft: 'auto' }}>
          <Button
            data-testid="status-change-cancel-button"
            variant="outline"
            onPress={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            data-testid="status-change-confirm-button"
            color={isRejection ? 'error' : 'success'}
            variant="light"
            onPress={handleConfirm}
            disabled={confirmDisabled}
          >
            {isLoading ? 'Processing...' : isRejection ? 'Reject Application' : 'Confirm'}
          </Button>
        </Row>
      </Stack>
    </ResponsiveModal>
  )
}
