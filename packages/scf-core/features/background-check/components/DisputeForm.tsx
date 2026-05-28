import {
  ResponsiveSelect,
  type UploadSelection,
  UploadSurface,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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
} from '@scaffald/ui'

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
  const { theme } = useThemeContext()
  const reasonValue = form.watch('reason')

  const disableSubmit = useMemo(
    () => isSubmitting || isUploading || hasActiveDispute,
    [hasActiveDispute, isSubmitting, isUploading]
  )

  return (
    <FormProvider {...form}>
      <Stack gap={16}>
        <Stack gap={8}>
          <Text style={{ color: colors.text[theme].secondary }}>Submit a dispute</Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            Share what needs review and, if helpful, include supporting documents so our compliance
            team can investigate quickly.
          </Text>
        </Stack>

        {hasActiveDispute ? (
          <Card
            style={{
              backgroundColor: theme === "light" ? colors.yellow[50] : colors.yellow[900],
              borderColor: theme === "light" ? colors.yellow[300] : colors.yellow[700],
              borderWidth: 1,
              paddingHorizontal: 12,
              paddingVertical: 8,
              gap: 8,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: theme === "light" ? colors.yellow[700] : colors.yellow[300] }}>Dispute already in review</Text>
            <Text style={{ color: theme === "light" ? colors.yellow[700] : colors.yellow[300] }}>
              You have a dispute awaiting review. We'll notify you when the team has an update.
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
                    style={{
                      borderColor: error
                        ? theme === "light" ? colors.error[300] : colors.error[700]
                        : colors.border[theme].default,
                    }}
                  />
                  {error ? (
                    <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>{error.message}</Text>
                  ) : null}
                </Stack>
              )}
            />
          ) : null}

          <Controller
            control={form.control}
            name="details"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <Stack gap={4}>
                <Label htmlFor="dispute-details">Explain what's incorrect</Label>
                <TextArea
                  id="dispute-details"
                  rows={5}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Include dates, names, or any context that helps us verify your dispute."
                  style={{
                    borderColor: error ? theme === "light" ? colors.error[300] : colors.error[700] : colors.border[theme].default,
                  }}
                />
                <Text style={{ color: colors.text[theme].secondary }}>
                  Minimum 20 characters. Max 2000 characters.
                </Text>
                {error ? (
                  <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>{error.message}</Text>
                ) : null}
              </Stack>
            )}
          />
        </Fieldset>

        <Stack gap={8}>
          <Text style={{ color: colors.text[theme].secondary }}>
            Supporting documents (optional)
          </Text>
          <Text style={{ color: colors.text[theme].secondary }}>
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
                borderRadius={16}
                paddingHorizontal={16}
                paddingVertical={20}
                gap={8}
                align="center"
                justify="center"
                style={{
                  borderColor: isDragActive
                    ? theme === "light" ? colors.blue[300] : colors.blue[700]
                    : colors.border[theme].default,
                  backgroundColor: colors.bg[theme].subtle,
                }}
              >
                <input {...getInputProps()} />
                <Upload size={24} color={theme === "light" ? colors.blue[700] : colors.blue[300]} />
                <Text style={{ color: colors.text[theme].secondary }}>
                  {isProcessing ? 'Processing…' : 'Drag a file here'}
                </Text>
                <Text style={{ color: colors.text[theme].secondary }}>
                  or <Text style={{ color: theme === "light" ? colors.blue[700] : colors.blue[300] }}>browse your device</Text>
                </Text>
                <Button size="sm" variant="outline" onPress={open} iconStart={Upload}>
                  Choose file
                </Button>
                <Text style={{ color: colors.text[theme].secondary }}>
                  Accepted: PDF, PNG, JPG • Max 10MB each
                </Text>
              </Stack>
            )}
          </UploadSurface>

          {attachmentError ? (
            <Row
              gap={8}
              align="center"
              paddingHorizontal={12}
              paddingVertical={8}
              style={{ backgroundColor: theme === "light" ? colors.error[50] : colors.error[900] }}
              borderRadius={12}
            >
              <AlertCircle size={20} color={theme === "light" ? colors.error[700] : colors.error[300]} />
              <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>{attachmentError}</Text>
            </Row>
          ) : null}

          {attachments.length > 0 ? (
            <Stack gap={8}>
              <Separator />
              {attachments.map((attachment) => (
                <Row
                  key={attachment.id}
                  style={{
                    backgroundColor: colors.bg[theme].subtle,
                    borderColor: colors.border[theme].default,
                  }}
                  borderWidth={1}
                  borderRadius={12}
                  paddingHorizontal={12}
                  paddingVertical={8}
                  gap={12}
                  align="center"
                  justify="space-between"
                >
                  <Stack flex={1} gap={4}>
                    <Text style={{ color: colors.text[theme].secondary }}>{attachment.name}</Text>
                    <Text style={{ color: colors.text[theme].secondary }}>
                      {attachment.mimeType.toUpperCase()} • {formatFileSize(attachment.size)}
                    </Text>
                  </Stack>
                  <Button
                    size="sm"
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
            style={{ backgroundColor: theme === "light" ? colors.error[50] : colors.error[900] }}
            borderRadius={12}
          >
            <AlertCircle size={20} color={theme === "light" ? colors.error[700] : colors.error[300]} />
            <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>{submissionError}</Text>
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
