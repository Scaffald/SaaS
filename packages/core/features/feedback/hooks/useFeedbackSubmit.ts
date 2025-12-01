import { api } from '@app/core/utils/api'
import { supabase } from '@app/core/utils/supabase/client'
import {
  type FeedbackPendingScreenshot,
  type FeedbackPendingSubmission,
  type FeedbackSubmitInput,
  feedbackPendingSubmissionSchema,
  feedbackUploadRequestSchema,
} from '@app/schemas/feedback'
import { useToastController } from '@tamagui/toast'
import { Buffer } from 'buffer'
import { randomUUID } from 'expo-crypto'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'
import {
  addPendingFeedback,
  getPendingFeedbackQueue,
  removePendingFeedback,
  updatePendingFeedback,
} from '../utils/feedbackStorage'
import type { FeedbackContextPayload } from './useFeedbackContext'
import type { FeedbackFormValues, FeedbackScreenshotSource } from './useFeedbackForm'

const RETRY_INTERVAL_MS = 5 * 60 * 1000
const MAX_QUEUE_ATTEMPTS = 5

interface SubmitOptions {
  formValues: FeedbackFormValues
  context: FeedbackContextPayload
  screenshotSource: FeedbackScreenshotSource | null
}

export interface UseFeedbackSubmitResult {
  submitFeedback: (options: SubmitOptions) => Promise<void>
  isSubmitting: boolean
  isProcessingQueue: boolean
  pendingCount: number
  processQueue: () => Promise<void>
}

function estimateBase64Size(base64: string): number {
  const paddingMatches = base64.match(/=+$/u)
  const padding = paddingMatches ? paddingMatches[0].length : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

function base64ToUint8Array(base64: string): Uint8Array {
  return Uint8Array.from(Buffer.from(base64, 'base64'))
}

async function readWebFileAsBase64(file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Unable to read file data'))
        return
      }
      const dataUrl = reader.result
      const commaIndex = dataUrl.indexOf(',')
      resolve(commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl)
    }
    reader.onerror = () => {
      reject(reader.error ?? new Error('Unknown file reader error'))
    }
    reader.readAsDataURL(file)
  })
}

async function readNativeFileAsBase64(
  source: FeedbackScreenshotSource & { kind: 'native' }
): Promise<string> {
  const FileSystem = await import('expo-file-system')
  return await FileSystem.readAsStringAsync(source.uri, {
    encoding: 'base64',
  })
}

async function convertScreenshotToBase64(
  screenshot: FeedbackScreenshotSource
): Promise<FeedbackPendingScreenshot> {
  if (screenshot.kind === 'web') {
    const base64 = await readWebFileAsBase64(screenshot.file)
    return {
      name: screenshot.file.name,
      mimeType: (screenshot.file.type || 'image/png') as FeedbackPendingScreenshot['mimeType'],
      size: screenshot.file.size,
      base64,
    }
  }

  const base64 = await readNativeFileAsBase64(screenshot)
  return {
    name: screenshot.name,
    mimeType: screenshot.mimeType as FeedbackPendingScreenshot['mimeType'],
    size: screenshot.size ?? estimateBase64Size(base64),
    base64,
  }
}

export function useFeedbackSubmit(): UseFeedbackSubmitResult {
  const toast = useToastController()
  const submitMutation = api.feedback.submit.useMutation()
  const uploadUrlMutation = api.feedback.getUploadUrl.useMutation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const queueProcessingRef = useRef(false)

  const refreshPendingCount = useCallback(async () => {
    const queue = await getPendingFeedbackQueue()
    setPendingCount(queue.length)
  }, [])

  const ensureSubmission = useCallback(
    async (payload: FeedbackSubmitInput, screenshot?: FeedbackPendingScreenshot | null) => {
      let screenshotPath: string | undefined = payload.screenshotPath ?? undefined

      if (screenshot) {
        const fileSize = screenshot.size ?? estimateBase64Size(screenshot.base64)

        feedbackUploadRequestSchema.parse({
          fileName: screenshot.name,
          fileType: screenshot.mimeType,
          fileSize,
        })

        const uploadRequest = await uploadUrlMutation.mutateAsync({
          fileName: screenshot.name,
          fileType: screenshot.mimeType,
          fileSize,
        })

        const fileBuffer = base64ToUint8Array(screenshot.base64)
        const { error: uploadError } = await supabase.storage
          .from(uploadRequest.bucket)
          .uploadToSignedUrl(uploadRequest.filePath, uploadRequest.token, fileBuffer, {
            contentType: screenshot.mimeType,
            upsert: false,
          })

        if (uploadError) {
          throw new Error(uploadError.message ?? 'Unable to upload screenshot')
        }

        screenshotPath = uploadRequest.filePath
      }

      const submission: FeedbackSubmitInput = {
        ...payload,
        screenshotPath,
      }

      await submitMutation.mutateAsync(submission)
    },
    [submitMutation, uploadUrlMutation]
  )

  const processQueue = useCallback(async () => {
    if (queueProcessingRef.current || isSubmitting) {
      return
    }

    queueProcessingRef.current = true
    setIsProcessingQueue(true)

    try {
      const queue = await getPendingFeedbackQueue()
      setPendingCount(queue.length)

      if (queue.length === 0) {
        return
      }

      let successCount = 0
      const failures: Array<{ id: string; error: string }> = []

      for (const item of queue) {
        const itemId = item.id ?? randomUUID()

        try {
          await ensureSubmission(
            {
              feedbackType: item.feedbackType,
              feedbackText: item.feedbackText,
              screenshotPath: item.screenshotPath,
              pageUrl: item.pageUrl,
              pageTitle: item.pageTitle,
              userAgent: item.userAgent,
              browserName: item.browserName,
              browserVersion: item.browserVersion,
              operatingSystem: item.operatingSystem,
              screenResolution: item.screenResolution,
              viewportSize: item.viewportSize,
            },
            item.screenshot
          )

          await removePendingFeedback(itemId)
          successCount += 1
        } catch (error) {
          const attempts = (item.attempts ?? 1) + 1
          const errorMessage = error instanceof Error ? error.message : String(error)

          if (attempts >= MAX_QUEUE_ATTEMPTS) {
            await removePendingFeedback(itemId)
            failures.push({ id: itemId, error: `${errorMessage} (max attempts reached)` })
          } else {
            await updatePendingFeedback({
              ...item,
              id: itemId,
              attempts,
            })
            failures.push({ id: itemId, error: errorMessage })
          }
        }
      }

      if (successCount > 0) {
        toast.show('Feedback Submitted', {
          message:
            successCount === 1
              ? 'One pending feedback submission synced successfully.'
              : `${successCount} feedback submissions synced successfully.`,
          type: 'success',
        })
      }

      if (failures.length > 0) {
        console.warn('[useFeedbackSubmit] Failed to process pending feedback', failures)
      }
    } finally {
      queueProcessingRef.current = false
      setIsProcessingQueue(false)
      void refreshPendingCount()
    }
  }, [ensureSubmission, isSubmitting, refreshPendingCount, toast])

  useEffect(() => {
    void refreshPendingCount()
    void processQueue()
  }, [processQueue, refreshPendingCount])

  useEffect(() => {
    const interval = setInterval(() => {
      void processQueue()
    }, RETRY_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [processQueue])

  const submitFeedback = useCallback(
    async ({ formValues, context, screenshotSource }: SubmitOptions) => {
      setIsSubmitting(true)

      try {
        const screenshotMeta = screenshotSource
          ? await convertScreenshotToBase64(screenshotSource)
          : null

        const payload: FeedbackSubmitInput = {
          feedbackType: formValues.feedbackType as FeedbackSubmitInput['feedbackType'],
          feedbackText: formValues.feedbackText,
          screenshotPath: undefined,
          pageUrl: context.pageUrl,
          pageTitle: context.pageTitle ?? undefined,
          userAgent: context.userAgent,
          browserName: context.browserName ?? undefined,
          browserVersion: context.browserVersion ?? undefined,
          operatingSystem: context.operatingSystem ?? undefined,
          screenResolution: context.screenResolution ?? undefined,
          viewportSize: context.viewportSize ?? undefined,
        }

        await ensureSubmission(payload, screenshotMeta)

        toast.show('Feedback Submitted!', {
          message: 'Thank you for helping us improve.',
          type: 'success',
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'

        if (error instanceof z.ZodError) {
          toast.show('Validation Error', {
            message: error.issues[0]?.message ?? 'Please review your submission.',
            type: 'error',
          })
          setIsSubmitting(false)
          return
        }

        console.warn('[useFeedbackSubmit] Submission failed, queueing locally', message)

        try {
          const screenshotMeta = screenshotSource
            ? await convertScreenshotToBase64(screenshotSource)
            : null

          const pending: FeedbackPendingSubmission = feedbackPendingSubmissionSchema.parse({
            feedbackType: formValues.feedbackType as FeedbackPendingSubmission['feedbackType'],
            feedbackText: formValues.feedbackText,
            screenshotPath: undefined,
            pageUrl: context.pageUrl,
            pageTitle: context.pageTitle ?? undefined,
            userAgent: context.userAgent,
            browserName: context.browserName ?? undefined,
            browserVersion: context.browserVersion ?? undefined,
            operatingSystem: context.operatingSystem ?? undefined,
            screenResolution: context.screenResolution ?? undefined,
            viewportSize: context.viewportSize ?? undefined,
            id: randomUUID(),
            createdAt: new Date().toISOString(),
            attempts: 1,
            screenshot: screenshotMeta ?? undefined,
          })

          await addPendingFeedback(pending)
          toast.show('Submission Saved Locally', {
            message:
              "We couldn't reach the server. Your feedback will be submitted automatically once you're online.",
            type: 'warning',
          })
          void refreshPendingCount()
        } catch (queueError) {
          console.error('[useFeedbackSubmit] Failed to persist pending feedback', queueError)
          toast.show('Submission Failed', {
            message: message,
            type: 'error',
          })
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [ensureSubmission, refreshPendingCount, toast]
  )

  return useMemo(
    () => ({
      submitFeedback,
      isSubmitting,
      isProcessingQueue,
      pendingCount,
      processQueue,
    }),
    [submitFeedback, isSubmitting, isProcessingQueue, pendingCount, processQueue]
  )
}
