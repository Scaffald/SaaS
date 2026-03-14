import {
  FEEDBACK_ALLOWED_MIME_TYPES,
  FEEDBACK_MAX_LENGTH,
  FEEDBACK_MIN_LENGTH,
} from '@scf/schemas/feedback'
import type { UploadSelection } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  Button,
  FieldError,
  Input,
  Paragraph,
  ResponsiveModal,
  ScrollView,
  Separator,
  Text,
  UploadSurface,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { Image } from 'expo-image'
import { MessageCircle } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Controller } from 'react-hook-form'
import { useFeedbackContext } from './hooks/useFeedbackContext'
import {
  type FeedbackFormValues,
  type FeedbackScreenshotSource,
  useFeedbackForm,
} from './hooks/useFeedbackForm'
import { useFeedbackSubmit } from './hooks/useFeedbackSubmit'

const INSTRUCTIONS = `Help us improve by providing detailed feedback. For bugs, describe what you expected versus what happened. For feature requests, explain the problem you're trying to solve.`

const ACCEPT_TYPES = FEEDBACK_ALLOWED_MIME_TYPES.join(',')

function formatCharacterCounter(current: number) {
  return `${current.toLocaleString()} / ${FEEDBACK_MAX_LENGTH.toLocaleString()} characters (${FEEDBACK_MIN_LENGTH.toLocaleString()} minimum)`
}

function toScreenshotSource(selection: UploadSelection): FeedbackScreenshotSource {
  const file = selection.files[0]
  if (!file) throw new Error('No file selected')
  return { kind: 'web', file }
}

export function FeedbackWidget() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const context = useFeedbackContext()
  const { form, characterCount, isBelowMinimum, screenshot, setScreenshot, reset } =
    useFeedbackForm()
  const { submitFeedback, isSubmitting, isProcessingQueue, pendingCount, processQueue } =
    useFeedbackSubmit()

  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)

  useEffect(() => {
    if (screenshot?.kind === 'web') {
      const preview = URL.createObjectURL(screenshot.file)
      setScreenshotPreview(preview)
      return () => {
        URL.revokeObjectURL(preview)
      }
    }

    if (screenshot?.kind === 'native') {
      setScreenshotPreview(screenshot.uri)
      return
    }

    setScreenshotPreview(null)
  }, [screenshot])

  const handleScreenshotSelect = async (selection: UploadSelection) => {
    setScreenshot(toScreenshotSource(selection))
  }

  const handleRemoveScreenshot = () => {
    setScreenshot(null)
  }

  const handleSubmit = async (values: FeedbackFormValues) => {
    await submitFeedback({
      formValues: values,
      context,
      screenshotSource: screenshot,
    })
    if (!isSubmitting) {
      reset()
      setIsModalOpen(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsModalOpen(open)
    if (!open) {
      reset()
    }
  }

  return (
    <>
      <Stack style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 1000 }}>
        <Button
          size="sm"
          iconStart={MessageCircle}
          variant="filled"
          onPress={() => setIsModalOpen(true)}
        >
          Feedback
        </Button>
        {pendingCount > 0 ? (
          <Stack
            marginTop={8}
            paddingHorizontal={12}
            paddingVertical={8}
            borderRadius={12}
            style={{ backgroundColor: t === 'dark' ? colors.yellow[800] : colors.yellow[100], borderWidth: 1, borderColor: t === 'dark' ? colors.yellow[600] : colors.yellow[400], maxWidth: 220 }}
          >
            <Text style={{ color: t === 'dark' ? colors.yellow[300] : colors.yellow[600] }}>
              {pendingCount === 1
                ? "1 submission will sync when you're online."
                : `${pendingCount} submissions will sync when you're online.`}
            </Text>
          </Stack>
        ) : null}
      </Stack>

      <ResponsiveModal
        open={isModalOpen}
        onOpenChange={handleOpenChange}
        title="Submit Feedback"
        size="md"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Stack gap={16} paddingHorizontal={8} paddingVertical={8}>
            <Paragraph style={{ color: colors.text[t].secondary }}>{INSTRUCTIONS}</Paragraph>

            <Stack gap={8}>
              <Text>Feedback Type</Text>
              <Controller
                control={form.control}
                name="feedbackType"
                render={({ field: { value, onChange } }) => (
                  <Row gap={8}>
                    {(['bug', 'feature', 'comment'] as const).map((type) => {
                      const isActive = value === type
                      return (
                        <Button
                          key={type}
                          size="sm"
                          color={isActive ? 'primary' : undefined}
                          variant={isActive ? 'filled' : 'outline'}
                          onPress={() => onChange(type)}
                        >
                          {type === 'bug'
                            ? 'Bug Report'
                            : type === 'feature'
                              ? 'Feature Request'
                              : 'General Comment'}
                        </Button>
                      )
                    })}
                  </Row>
                )}
              />
              <FieldError message={form.formState.errors.feedbackType?.message} />
            </Stack>

            <Stack gap={8}>
              <Text>Feedback Details</Text>
              <Controller
                control={form.control}
                name="feedbackText"
                render={({ field: { value, onBlur, onChange } }) => (
                  <Input
                    multiline
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Describe your feedback in detail..."
                    error={isBelowMinimum}
                    contentStyle={{ textAlignVertical: 'top' }}
                  />
                )}
              />
              <Row justify="space-between" align="center">
                <FieldError
                  message={
                    form.formState.errors.feedbackText?.message ??
                    (isBelowMinimum
                      ? `Please provide at least ${FEEDBACK_MIN_LENGTH} characters.`
                      : undefined)
                  }
                />
                <Text style={{ color: isBelowMinimum ? colors.error[t === 'dark' ? 400 : 500] : colors.text[t].tertiary }}>
                  {formatCharacterCounter(characterCount)}
                </Text>
              </Row>
            </Stack>

            <Stack gap={8}>
              <Text>Screenshot (optional)</Text>
              <UploadSurface
                accept={ACCEPT_TYPES}
                maxSizeBytes={5 * 1024 * 1024}
                onSelect={handleScreenshotSelect}
                onError={(message) => {
                  form.setError('feedbackText', { message })
                }}
              >
                {({ open, getInputProps, getRootProps, isDragActive, isProcessing }) => (
                  <Stack
                    {...getRootProps()}
                    paddingHorizontal={16}
                    paddingVertical={24}
                    align="center"
                    justify="center"
                    gap={8}
                    borderRadius={16}
                    style={{
                      borderWidth: 1,
                      borderStyle: 'dashed',
                      backgroundColor: colors.bg[t].subtle,
                      borderColor: isDragActive ? colors.border[t].info : colors.border[t].default,
                    }}
                  >
                    <input {...getInputProps()} />
                    <Text>{isProcessing ? 'Processing...' : 'Drag & drop a screenshot'}</Text>
                    <Text style={{ color: colors.text[t].tertiary }}>
                      Accepted formats: PNG, JPG, JPEG, GIF, WebP (max 5MB)
                    </Text>
                    <Stack style={{ marginTop: 8 }}>
                      <Button size="sm" onPress={open}>
                        Choose File
                      </Button>
                    </Stack>
                  </Stack>
                )}
              </UploadSurface>

              {screenshot ? (
                <Stack
                  marginTop={12}
                  borderWidth={1}
                  borderColor={colors.border[t].default}
                  borderRadius={16}
                  style={{ overflow: 'hidden' }}
                >
                  {screenshotPreview ? (
                    <Image
                      source={{ uri: screenshotPreview }}
                      style={{ width: '100%', height: 200 }}
                      contentFit="cover"
                    />
                  ) : null}
                  <Row
                    paddingHorizontal={12}
                    paddingVertical={8}
                    align="center"
                    justify="space-between"
                    style={{ backgroundColor: colors.bg[t].muted }}
                    gap={8}
                  >
                    <Stack flex={1}>
                      <Text>
                        {screenshot.kind === 'web' ? screenshot.file.name : screenshot.name}
                      </Text>
                      <Text style={{ color: colors.text[t].tertiary }}>
                        {screenshot.kind === 'web'
                          ? screenshot.file.type || 'image'
                          : screenshot.mimeType}
                      </Text>
                    </Stack>
                    <Button size="sm" variant="outline" onPress={handleRemoveScreenshot}>
                      Remove
                    </Button>
                  </Row>
                </Stack>
              ) : null}
            </Stack>

            <Separator />

            <Row align="center" justify="space-between" gap={12}>
              <Stack gap={4}>
                <Text style={{ color: colors.text[t].tertiary }}>Captured context:</Text>
                <Text style={{ color: colors.text[t].tertiary }}>{context.pageUrl}</Text>
                <Text style={{ color: colors.text[t].tertiary }}>
                  {context.browserName
                    ? `${context.browserName} ${context.browserVersion ?? ''}`.trim()
                    : context.userAgent}
                </Text>
              </Stack>

              <Button
                size="sm"
                variant="outline"
                onPress={() => {
                  void processQueue()
                }}
                disabled={isProcessingQueue}
              >
                {isProcessingQueue ? 'Syncing…' : 'Retry Pending'}
              </Button>
            </Row>

            <Button
              size="md"
              disabled={isSubmitting || isBelowMinimum || !form.formState.isValid}
              onPress={form.handleSubmit(handleSubmit)}
            >
              {isSubmitting ? 'Submitting…' : 'Submit Feedback'}
            </Button>
          </Stack>
        </ScrollView>
      </ResponsiveModal>
    </>
  )
}
