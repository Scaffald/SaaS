import { useState } from 'react'
import { YStack, Button, Text, XStack, ResponsiveModal } from '@app/ui'
import { TextArea } from 'tamagui'
import type { ApplicationStatus } from '../../mock-data/ats-mock-data'

interface ApplicationStatusChangeModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
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
}

export const ApplicationStatusChangeModal = ({
  open,
  onClose,
  onConfirm,
  candidateName,
  fromStatus,
  toStatus,
  isLoading = false,
}: ApplicationStatusChangeModalProps) => {
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    if (toStatus === 'rejected' && !reason.trim()) {
      // Rejection reason is required
      return
    }
    onConfirm(reason)
    setReason('')
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  const isRejection = toStatus === 'rejected'

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
          <Button
            data-testid="status-change-confirm-button"
            onPress={handleConfirm}
            disabled={isLoading || (isRejection && !reason.trim())}
            bg={isRejection ? '$red9' : '$green9'}
            hoverStyle={{
              bg: isRejection ? '$red10' : '$green10',
            }}
          >
            {isLoading ? 'Processing...' : isRejection ? 'Reject Application' : 'Confirm Hire'}
          </Button>
        </XStack>
      </YStack>
    </ResponsiveModal>
  )
}
