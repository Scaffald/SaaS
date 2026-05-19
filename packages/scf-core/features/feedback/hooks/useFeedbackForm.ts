import {
  FEEDBACK_MAX_LENGTH,
  FEEDBACK_MIN_LENGTH,
  type FeedbackType,
  feedbackTextSchema,
  feedbackTypeSchema,
} from '@scf/schemas/feedback'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { type Resolver, type UseFormReturn, useForm } from 'react-hook-form'
import { Platform } from 'react-native'
import { z } from 'zod'

export type FeedbackScreenshotSource =
  | {
      kind: 'web'
      file: File
    }
  | {
      kind: 'native'
      uri: string
      name: string
      mimeType: string
      size?: number
    }

const feedbackFormSchema = z.object({
  feedbackType: feedbackTypeSchema,
  feedbackText: feedbackTextSchema,
})

export type FeedbackFormValues = {
  feedbackType: FeedbackType | undefined
  feedbackText: string
}

export interface UseFeedbackFormResult {
  form: UseFormReturn<FeedbackFormValues>
  characterCount: number
  minLength: number
  maxLength: number
  isBelowMinimum: boolean
  screenshot: FeedbackScreenshotSource | null
  setScreenshot: (source: FeedbackScreenshotSource | null) => void
  reset: () => void
}

export function useFeedbackForm(): UseFeedbackFormResult {
  const form = useForm<FeedbackFormValues>({
    // SC-59: @hookform/resolvers v5 tightened Resolver to
    // Resolver<TInput, TContext, TOutput> where TInput is derived from the
    // schema's strict input shape. Our FeedbackFormValues is looser
    // (FeedbackType | undefined for the initial state); cast keeps the
    // runtime resolver but suppresses the cosmetic type clash.
    resolver: zodResolver(feedbackFormSchema) as unknown as Resolver<FeedbackFormValues>,
    defaultValues: {
      feedbackType: undefined,
      feedbackText: '',
    },
    mode: 'onChange',
  })

  const [screenshot, setScreenshot] = useState<FeedbackScreenshotSource | null>(null)

  const feedbackText = form.watch('feedbackText') ?? ''

  const { characterCount, isBelowMinimum } = useMemo(() => {
    const length = feedbackText.length
    return {
      characterCount: length,
      isBelowMinimum: length < FEEDBACK_MIN_LENGTH,
    }
  }, [feedbackText])

  const reset = () => {
    form.reset({
      feedbackType: Platform.select({
        default: undefined,
      }),
      feedbackText: '',
    })
    setScreenshot(null)
  }

  return {
    form,
    characterCount,
    minLength: FEEDBACK_MIN_LENGTH,
    maxLength: FEEDBACK_MAX_LENGTH,
    isBelowMinimum,
    screenshot,
    setScreenshot,
    reset,
  }
}
