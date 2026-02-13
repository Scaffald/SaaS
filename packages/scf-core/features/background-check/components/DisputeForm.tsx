import { ResponsiveSelect, type UploadSelection, UploadSurface } from '@unicornlove/beyond-ui'
import { AlertCircle, Upload, X } from 'lucide-react-native'
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
  Row,
  Stack,
} from '@unicornlove/beyond-ui'

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
      <Stack gap={16}>
        <Stack gap={8}>
          <Text color="$gray11">Submit a dispute</Text>
          <Text color="$gray11">
            Share what needs review and, if helpful, include supporting documents so our compliance
            team can investigate quickly.
          </Text>
        </Stack>

        {hasActiveDispute ? (
          <Card
            backgroundColor="$yellow3"
            borderColor="$yellow8"
            borderWidth={1}
            paddingHorizontal={12}
            paddingVertical={8}
            gap={8}
            borderRadius={16}
          >
            <Text color="$yellow11">Dispute already in review</Text>
            <Text color="$yellow11">
              You have a dispute awaiting review. We’ll notify you when the team has an update.
            </Text>
          </Card>
        ) : null}

        <Fieldset gap={12}>
          <Controller
            control={form.control}
            name="reason"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <Stack gap={4}>
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
              </Stack>
            )}
          />

          {reasonValue === 'other' ? (
            <Controller
              control={form.control}
              name="otherReason"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <Stack gap={4}>
                  <Label htmlFor="dispute-other-reason">Describe the issue</Label>
                  <Input
                    id="dispute-other-reason"
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder="Share a short summary…"
                    borderColor={error ? '$red8' : '$borderColor'}
                  />
                  {error ? <Text color="$red10">{error.message}</Text> : null}
                </Stack>
              )}
            />
          ) : null}

          <Controller
            control={form.control}
            name="details"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <Stack gap={4}>
                <Label htmlFor="dispute-details">Explain what’s incorrect</Label>
                <TextArea
                  id="dispute-details"
                  rows={5}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Include dates, names, or any context that helps us verify your dispute."
                  borderColor={error ? '$red8' : '$borderColor'}
                />
                <Text color="$gray11">Minimum 20 characters. Max 2000 characters.</Text>
                {error ? <Text color="$red10">{error.message}</Text> : null}
              </Stack>
            )}
          />
        </Fieldset>

        <Stack gap={8}>
          <Text color="$gray11">Supporting documents (optional)</Text>
          <Text color="$gray11">
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
              <Stack
                {...getRootProps()}
                borderWidth={1}
                borderColor={isDragActive ? '$blue8' : '$borderColor'}
                borderStyle="dashed"
                borderRadius={16}
                paddingHorizontal={16}
                paddingVertical={20}
                gap={8}
                backgroundColor="$color2"
                align="center"
                justify="center"
              >
                <input {...getInputProps()} />
                <Upload size={24} color="$blue10" />
                <Text color="$gray11">{isProcessing ? 'Processing…' : 'Drag a file here'}</Text>
                <Text color="$gray11">
                  or <Text color="$blue11">browse your device</Text>
                </Text>
                <Button size="xs" variant="outline" onPress={open} iconStart={Upload}>
                  Choose file
                </Button>
                <Text color="$gray11">Accepted: PDF, PNG, JPG • Max 10MB each</Text>
              </Stack>
            )}
          </UploadSurface>

          {attachmentError ? (
            <Row
              gap={8}
              align="center"
              paddingHorizontal={12}
              paddingVertical={8}
              backgroundColor="$red3"
              borderRadius={12}
            >
              <AlertCircle size="md" color="$red10" />
              <Text color="$red10">{attachmentError}</Text>
            </Row>
          ) : null}

          {attachments.length > 0 ? (
            <Stack gap={8}>
              <Separator />
              {attachments.map((attachment) => (
                <Row
                  key={attachment.id}
                  backgroundColor="$color2"
                  borderColor="$borderColor"
                  borderWidth={1}
                  borderRadius={12}
                  paddingHorizontal={12}
                  paddingVertical={8}
                  gap={12}
                  align="center"
                  justify="space-between"
                >
                  <Stack flex={1} gap={4}>
                    <Text color="$gray11" >
                      {attachment.name}
                    </Text>
                    <Text color="$gray11">
                      {attachment.mimeType.toUpperCase()} • {formatFileSize(attachment.size)}
                    </Text>
                  </Stack>
                  <Button
                    size="xs"
                    variant="outline"
                    iconStart={X}
                    onPress={() => onRemoveAttachment(attachment.id)}
                  >
                    Remove
                  </Button>
                </Row>
              ))}
            </Stack>
          ) : null}
        </Stack>

        {submissionError ? (
          <Row
            gap={8}
            align="center"
            paddingHorizontal={12}
            paddingVertical={8}
            backgroundColor="$red3"
            borderRadius={12}
          >
            <AlertCircle size="md" color="$red10" />
            <Text color="$red10">{submissionError}</Text>
          </Row>
        ) : null}

        <Row gap={8} justify="flex-end">
          <Button
            size="sm"
            color="primary"
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
        </Row>
      </Stack>
    </FormProvider>
  )
}
