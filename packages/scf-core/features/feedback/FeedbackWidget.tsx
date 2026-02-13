import {
  FEEDBACK_ALLOWED_MIME_TYPES,
  FEEDBACK_MAX_LENGTH,
  FEEDBACK_MIN_LENGTH,
} from '@scf/schemas/feedback'
import type { UploadSelection } from '@unicornlove/beyond-ui'
import {
  Button,
  FieldError,
  Image,
  Input,
  Paragraph,
  ResponsiveModal,
  ScrollView,
  Separator,
  Text,
  UploadSurface,
  Row,
  Stack,
} from '@unicornlove/beyond-ui'
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
  if (selection.platform === 'web') {
    return {
      kind: 'web',
      file: selection.file,
    }
  }

  return {
    kind: 'native',
    uri: selection.asset.uri,
    name: selection.asset.name ?? 'feedback-screenshot',
    mimeType: selection.asset.type ?? 'image/png',
    size: selection.asset.size,
  }
}

export function FeedbackWidget() {
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
      <Stack position="absolute" bottom={16} right={16} style={{ zIndex: 1000 }}>
        <Button
          size={24}
          circular
          icon={MessageCircle}
          backgroundColor="$blue9"
          color="gray"
          elevation={16}
          pressStyle={{ scale: 0.97 }}
          hoverStyle={{ backgroundColor: '$blue10' }}
          focusStyle={{ outlineColor: '$blue8' }}
          onPress={() => setIsModalOpen(true)}
        >
          Feedback
        </Button>
        {pendingCount > 0 ? (
          <Stack
            marginTop={8}
            paddingHorizontal={12}
            paddingVertical={8}
            backgroundColor="$yellow4"
            borderWidth={1}
            borderColor="$yellow6"
            borderRadius={12}
            style={{ maxWidth: 220 }}
          >
            <Text color="$yellow10">
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
            <Paragraph color="gray">{INSTRUCTIONS}</Paragraph>

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
                          size={12}
                          theme={isActive ? 'blue' : undefined}
                          variant={isActive ? undefined : 'outlined'}
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
                    numberOfLines={6}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Describe your feedback in detail..."
                    backgroundColor="$color2"
                    borderColor={isBelowMinimum ? '$red7' : '$color6'}
                    textAlignVertical="top"
                    focusStyle={{
                      borderColor: '$blue7',
                      outlineColor: '$blue7',
                    }}
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
                <Text color={isBelowMinimum ? '$red9' : '$color9'}>
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
                    borderWidth={1}
                    borderStyle="dashed"
                    paddingHorizontal={16}
                    paddingVertical={24}
                    align="center"
                    justify="center"
                    gap={8}
                    backgroundColor="$color2"
                    borderColor={isDragActive ? '$blue7' : '$color6'}
                    borderRadius={16}
                  >
                    <input {...getInputProps()} />
                    <Text>
                      {isProcessing ? 'Processing...' : 'Drag & drop a screenshot'}
                    </Text>
                    <Text color="gray">
                      Accepted formats: PNG, JPG, JPEG, GIF, WebP (max 5MB)
                    </Text>
                    <Button size={8} marginTop={8} onPress={open}>
                      Choose File
                    </Button>
                  </Stack>
                )}
              </UploadSurface>

              {screenshot ? (
                <Stack
                  marginTop={12}
                  borderWidth={1}
                  borderColor="$color6"
                  overflow="hidden"
                  borderRadius={16}
                >
                  {screenshotPreview ? (
                    <Image
                      source={{ uri: screenshotPreview }}
                      width="100%"
                      height={200}
                      resizeMode="cover"
                    />
                  ) : null}
                  <Row
                    paddingHorizontal={12}
                    paddingVertical={8}
                    align="center"
                    justify="space-between"
                    backgroundColor="$color2"
                    gap={8}
                  >
                    <Stack flex={1}>
                      <Text numberOfLines={1}>
                        {screenshot.kind === 'web' ? screenshot.file.name : screenshot.name}
                      </Text>
                      <Text color="gray">
                        {screenshot.kind === 'web'
                          ? screenshot.file.type || 'image'
                          : screenshot.mimeType}
                      </Text>
                    </Stack>
                    <Button size={8} variant="outline" onPress={handleRemoveScreenshot}>
                      Remove
                    </Button>
                  </Row>
                </Stack>
              ) : null}
            </Stack>

            <Separator />

            <Row align="center" justify="space-between" gap={12}>
              <Stack gap={4}>
                <Text color="gray">
                  Captured context:
                </Text>
                <Text color="gray">
                  {context.pageUrl}
                </Text>
                <Text color="gray">
                  {context.browserName
                    ? `${context.browserName} ${context.browserVersion ?? ''}`.trim()
                    : context.userAgent}
                </Text>
              </Stack>

              <Button
                size={8}
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
              size={16}
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
