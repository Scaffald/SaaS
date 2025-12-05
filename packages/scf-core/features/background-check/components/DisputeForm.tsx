import { ResponsiveSelect, type UploadSelection, UploadSurface } from '@unicornlove/ui'
import { AlertCircle, Upload, X } from '@tamagui/lucide-icons'
import { useMemo } from 'react'
import { Controller, FormProvider, type UseFormReturn } from 'react-hook-form'
import {
  Button,
  Card,
  Fieldset,
  Input,
  Label,
  Separator,
  Text,
  TextArea,
  XStack,
  YStack,
} from '@unicornlove/ui'

import type { DisputeAttachment, DisputeFormValues, DisputeReasonOption } from '../hooks/useDispute'

interface DisputeFormProps {
  form: UseFormReturn<DisputeFormValues>
  reasonOptions: readonly DisputeReasonOption[]
  attachments: DisputeAttachment[]
  onSelectAttachment: (selection: UploadSelection) => Promise<void>
  onRemoveAttachment: (attachmentId: string) => void
  onSubmit: () => Promise<boolean>
  isSubmitting: boolean
  isUploading: boolean
  attachmentError: string | null
  submissionError: string | null
  hasActiveDispute: boolean
}

const ACCEPT_MIME_TYPES = 'application/pdf,image/png,image/jpeg'
const ACCEPT_EXTENSIONS = '.pdf,.png,.jpg,.jpeg'

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${bytes} B`
}

export function DisputeForm({
  form,
  reasonOptions,
  attachments,
  onSelectAttachment,
  onRemoveAttachment,
  onSubmit,
  isSubmitting,
  isUploading,
  attachmentError,
  submissionError,
  hasActiveDispute,
}: DisputeFormProps) {
  const reasonValue = form.watch('reason')

  const disableSubmit = useMemo(
    () => isSubmitting || isUploading || hasActiveDispute,
    [hasActiveDispute, isSubmitting, isUploading]
  )

  return (
    <FormProvider {...form}>
      <YStack gap="$4">
        <YStack gap="$2">
          <Text fontSize="$5" fontWeight="700" color="$color12">
            Submit a dispute
          </Text>
          <Text fontSize="$2" color="$color10">
            Share what needs review and, if helpful, include supporting documents so our compliance
            team can investigate quickly.
          </Text>
        </YStack>

        {hasActiveDispute ? (
          <Card
            backgroundColor="$yellow3"
            borderColor="$yellow8"
            borderWidth={1}
            paddingHorizontal="$3"
            paddingVertical="$2"
            gap="$2"
            borderRadius="$4"
          >
            <Text fontSize="$3" fontWeight="600" color="$yellow11">
              Dispute already in review
            </Text>
            <Text fontSize="$2" color="$yellow11">
              You have a dispute awaiting review. We’ll notify you when the team has an update.
            </Text>
          </Card>
        ) : null}

        <Fieldset gap="$3">
          <Controller
            control={form.control}
            name="reason"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <YStack gap="$1">
                <Label htmlFor="dispute-reason">What needs review?</Label>
                <ResponsiveSelect
                  value={value || ''}
                  onValueChange={onChange}
                  placeholder="Select a reason"
                  label="What needs review?"
                  error={error?.message}
                  options={reasonOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />
              </YStack>
            )}
          />

          {reasonValue === 'other' ? (
            <Controller
              control={form.control}
              name="otherReason"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <YStack gap="$1">
                  <Label htmlFor="dispute-other-reason">Describe the issue</Label>
                  <Input
                    id="dispute-other-reason"
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder="Share a short summary…"
                    borderColor={error ? '$red8' : '$borderColor'}
                  />
                  {error ? (
                    <Text fontSize="$2" color="$red10">
                      {error.message}
                    </Text>
                  ) : null}
                </YStack>
              )}
            />
          ) : null}

          <Controller
            control={form.control}
            name="details"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <YStack gap="$1">
                <Label htmlFor="dispute-details">Explain what’s incorrect</Label>
                <TextArea
                  id="dispute-details"
                  rows={5}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Include dates, names, or any context that helps us verify your dispute."
                  borderColor={error ? '$red8' : '$borderColor'}
                />
                <Text fontSize="$1" color="$color9">
                  Minimum 20 characters. Max 2000 characters.
                </Text>
                {error ? (
                  <Text fontSize="$2" color="$red10">
                    {error.message}
                  </Text>
                ) : null}
              </YStack>
            )}
          />
        </Fieldset>

        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600" color="$color12">
            Supporting documents (optional)
          </Text>
          <Text fontSize="$2" color="$color10">
            Upload up to five files (PDF, JPG, or PNG, 10MB each) to help us verify your dispute.
          </Text>

          <UploadSurface
            accept={`${ACCEPT_MIME_TYPES},${ACCEPT_EXTENSIONS}`}
            maxSizeBytes={10 * 1024 * 1024}
            disabled={hasActiveDispute}
            onSelect={onSelectAttachment}
            onError={(message) => {
              form.setError('details', { type: 'manual', message })
            }}
          >
            {({ getRootProps, getInputProps, open, isDragActive, isProcessing }) => (
              <YStack
                {...getRootProps()}
                borderWidth={1}
                borderColor={isDragActive ? '$blue8' : '$borderColor'}
                borderStyle="dashed"
                borderRadius="$4"
                paddingHorizontal="$4"
                paddingVertical="$5"
                gap="$2"
                backgroundColor="$color2"
                alignItems="center"
                justifyContent="center"
              >
                <input {...getInputProps()} />
                <Upload size={24} color="$blue10" />
                <Text fontWeight="600" color="$color12">
                  {isProcessing ? 'Processing…' : 'Drag a file here'}
                </Text>
                <Text fontSize="$2" color="$color10">
                  or{' '}
                  <Text fontWeight="600" color="$blue11">
                    browse your device
                  </Text>
                </Text>
                <Button size="$2" variant="outlined" onPress={open} icon={Upload}>
                  Choose file
                </Button>
                <Text fontSize="$1" color="$color9">
                  Accepted: PDF, PNG, JPG • Max 10MB each
                </Text>
              </YStack>
            )}
          </UploadSurface>

          {attachmentError ? (
            <XStack
              gap="$2"
              alignItems="center"
              paddingHorizontal="$3"
              paddingVertical="$2"
              backgroundColor="$red3"
              borderRadius="$3"
            >
              <AlertCircle size={16} color="$red10" />
              <Text fontSize="$2" color="$red10">
                {attachmentError}
              </Text>
            </XStack>
          ) : null}

          {attachments.length > 0 ? (
            <YStack gap="$2">
              <Separator />
              {attachments.map((attachment) => (
                <XStack
                  key={attachment.id}
                  backgroundColor="$color2"
                  borderColor="$borderColor"
                  borderWidth={1}
                  borderRadius="$3"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  gap="$3"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <YStack flex={1} gap="$1">
                    <Text fontSize="$3" fontWeight="600" color="$color12" numberOfLines={1}>
                      {attachment.name}
                    </Text>
                    <Text fontSize="$2" color="$color10">
                      {attachment.mimeType.toUpperCase()} • {formatFileSize(attachment.size)}
                    </Text>
                  </YStack>
                  <Button
                    size="$2"
                    variant="outlined"
                    icon={X}
                    onPress={() => onRemoveAttachment(attachment.id)}
                  >
                    Remove
                  </Button>
                </XStack>
              ))}
            </YStack>
          ) : null}
        </YStack>

        {submissionError ? (
          <XStack
            gap="$2"
            alignItems="center"
            paddingHorizontal="$3"
            paddingVertical="$2"
            backgroundColor="$red3"
            borderRadius="$3"
          >
            <AlertCircle size={16} color="$red10" />
            <Text fontSize="$2" color="$red10">
              {submissionError}
            </Text>
          </XStack>
        ) : null}

        <XStack gap="$2" justifyContent="flex-end">
          <Button
            size="$3"
            theme="blue"
            disabled={disableSubmit}
            onPress={async () => {
              const successful = await onSubmit()
              if (!successful) {
                return
              }
            }}
          >
            {isSubmitting || isUploading ? 'Submitting…' : 'Submit dispute'}
          </Button>
        </XStack>
      </YStack>
    </FormProvider>
  )
}
