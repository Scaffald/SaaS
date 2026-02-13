import {
  useBackgroundCheckDisputes,
  useCreateDocumentUploadUrlMutation,
  useSubmitBackgroundCheckDisputeMutation,
} from '@scf/core/utils/background-checks-sdk-hooks'
import { supabase } from '@scf/core/utils/supabase/client'
import type { UploadSelection } from '@unicornlove/beyond-ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@unicornlove/beyond-ui'
import { useQueryClient } from '@tanstack/react-query'
import { Buffer } from 'buffer'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Platform } from 'react-native'
import { z } from 'zod'

const MAX_ATTACHMENTS = 5
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const SUPPORTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const

type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number]

export type BackgroundCheckDispute = {
  id: string
  background_check_id: string
  user_id: string
  reason: string
  details?: string
  status: 'pending' | 'under_review' | 'resolved' | 'rejected'
  resolution?: string
  resolved_at?: string
  created_at: string
  updated_at: string
}

export interface DisputeReasonOption {
  value: string
  label: string
}

const DISPUTE_REASON_OPTIONS: readonly DisputeReasonOption[] = [
  {
    value: 'identity_mismatch',
    label: 'This report belongs to someone else',
  },
  {
    value: 'outdated_information',
    label: 'Information is outdated or incomplete',
  },
  {
    value: 'incorrect_records',
    label: 'Records contain inaccurate findings',
  },
  {
    value: 'missing_context',
    label: 'Important context or documentation is missing',
  },
  {
    value: 'other',
    label: 'Something else (describe below)',
  },
] as const

const disputeFormSchema = z
  .object({
    reason: z.string().min(1, 'Select a reason to help our team investigate.'),
    otherReason: z
      .string()
      .trim()
      .max(200, 'Keep your summary brief (200 characters max).')
      .optional(),
    details: z
      .string()
      .trim()
      .min(20, 'Share at least 20 characters describing what needs review.')
      .max(2000, 'Please keep your description under 2000 characters.'),
  })
  .superRefine((value, ctx) => {
    if (value.reason === 'other' && !value.otherReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['otherReason'],
        message: "Describe what needs review when selecting 'Something else'.",
      })
    }
  })

export type DisputeFormValues = z.infer<typeof disputeFormSchema>

type NativeAssetSource = {
  kind: 'native'
  uri: string
  name: string
  mimeType: string
  size: number
}

type WebFileSource = {
  kind: 'web'
  file: File
}

type DisputeAttachmentSource = NativeAssetSource | WebFileSource

export interface DisputeAttachment {
  id: string
  name: string
  mimeType: string
  size: number
  documentType: string
  source: DisputeAttachmentSource
}

interface UseDisputeOptions {
  checkId: string | null
  enabled?: boolean
}

interface UseDisputeResult {
  form: ReturnType<typeof useForm<DisputeFormValues>>
  reasonOptions: readonly DisputeReasonOption[]
  attachments: DisputeAttachment[]
  addAttachment: (selection: UploadSelection) => Promise<void>
  removeAttachment: (attachmentId: string) => void
  submitDispute: () => Promise<boolean>
  reset: () => void
  isSubmitting: boolean
  isUploading: boolean
  attachmentError: string | null
  submissionError: string | null
  disputes: BackgroundCheckDispute[]
  latestDispute: BackgroundCheckDispute | null
  hasActiveDispute: boolean
  isLoadingDisputes: boolean
  refetchDisputes: () => void
}

const DEFAULT_VALUES: DisputeFormValues = {
  reason: '',
  otherReason: '',
  details: '',
}

const ensureFileSystem = async () => {
  if (Platform.OS === 'web') {
    return null
  }

  try {
    const FileSystem = await import('expo-file-system/legacy')
    return FileSystem
  } catch (error) {
    console.warn('[useDispute] Unable to load expo-file-system', error)
    return null
  }
}

const createAttachmentId = () => {
  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `dispute-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export function useDispute({ checkId, enabled = true }: UseDisputeOptions): UseDisputeResult {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [attachments, setAttachments] = useState<DisputeAttachment[]>([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const previousCheckIdRef = useRef<string | null>(null)

  const disputeQuery = useBackgroundCheckDisputes(checkId || undefined, {
    enabled: Boolean(checkId) && enabled,
  })

  const createUploadUrlMutation = useCreateDocumentUploadUrlMutation()
  const submitDisputeMutation = useSubmitBackgroundCheckDisputeMutation()

  const form = useForm<DisputeFormValues>({
    resolver: zodResolver(disputeFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  })

  useEffect(() => {
    if (previousCheckIdRef.current !== checkId) {
      previousCheckIdRef.current = checkId
      form.reset(DEFAULT_VALUES)
      setAttachments([])
      setAttachmentError(null)
      setSubmissionError(null)
    }
  }, [checkId, form])

  const disputes = useMemo(() => disputeQuery.data ?? [], [disputeQuery.data])
  const latestDispute = disputes.length > 0 ? disputes[0] : null

  const hasActiveDispute = useMemo(
    () =>
      disputes.some(
        (dispute: BackgroundCheckDispute) =>
          dispute.status === 'pending' || dispute.status === 'under_review'
      ),
    [disputes]
  )

  const addAttachment = useCallback(
    async (selection: UploadSelection) => {
      if (!checkId) {
        setAttachmentError('Select a background check before adding documents.')
        return
      }

      if (attachments.length >= MAX_ATTACHMENTS) {
        setAttachmentError(`You can attach up to ${MAX_ATTACHMENTS} files.`)
        return
      }

      setAttachmentError(null)

      if (selection.platform === 'web') {
        const { file } = selection

        if (!SUPPORTED_MIME_TYPES.includes(file.type as SupportedMimeType)) {
          setAttachmentError('Only PDF, JPG, and PNG files are supported.')
          return
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
          setAttachmentError('Files must be 10MB or smaller.')
          return
        }

        const id = createAttachmentId()
        setAttachments((prev) => [
          ...prev,
          {
            id,
            name: file.name,
            mimeType: file.type,
            size: file.size,
            documentType: `dispute_supporting_${prev.length + 1}`,
            source: { kind: 'web', file },
          },
        ])
        return
      }

      const asset = selection.asset
      const fileSystem = await ensureFileSystem()

      if (!fileSystem) {
        setAttachmentError('File uploads are not available on this device.')
        return
      }

      const info = await fileSystem.getInfoAsync(asset.uri)
      const infoSize =
        typeof (info as { size?: number }).size === 'number'
          ? (info as { size: number }).size
          : undefined
      const size = typeof asset.size === 'number' ? asset.size : (infoSize ?? 0)

      if (size === 0) {
        setAttachmentError('We could not read that file. Try selecting it again.')
        return
      }

      if (size > MAX_FILE_SIZE_BYTES) {
        setAttachmentError('Files must be 10MB or smaller.')
        return
      }

      const mimeType = (asset.type ?? 'application/octet-stream').toLowerCase()
      if (!SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeType)) {
        setAttachmentError('Only PDF, JPG, and PNG files are supported.')
        return
      }

      const name =
        asset.name ??
        asset.uri.split('/').pop() ??
        `dispute-supporting-${attachments.length + 1}.${mimeType.split('/')[1] ?? 'bin'}`

      const id = createAttachmentId()
      setAttachments((prev) => [
        ...prev,
        {
          id,
          name,
          mimeType,
          size,
          documentType: `dispute_supporting_${prev.length + 1}`,
          source: {
            kind: 'native',
            uri: asset.uri,
            name,
            mimeType,
            size,
          },
        },
      ])
    },
    [attachments.length, checkId]
  )

  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== attachmentId))
  }, [])

  const convertAttachmentToBytes = useCallback(async (attachment: DisputeAttachment) => {
    if (attachment.source.kind === 'web') {
      const buffer = await attachment.source.file.arrayBuffer()
      return new Uint8Array(buffer)
    }

    const fileSystem = await ensureFileSystem()
    if (!fileSystem) {
      throw new Error('File system unavailable for uploads on this device.')
    }

    const base64 = await fileSystem.readAsStringAsync(attachment.source.uri, {
      encoding: fileSystem.EncodingType.Base64,
    })
    return Uint8Array.from(Buffer.from(base64, 'base64'))
  }, [])

  const uploadAttachment = useCallback(
    async (attachment: DisputeAttachment, index: number) => {
      if (!checkId) {
        throw new Error('Missing background check identifier for dispute.')
      }

      const uploadRequest = await createUploadUrlMutation.mutateAsync({
        background_check_id: checkId,
        document_type: attachment.documentType || `dispute_supporting_${index + 1}`,
        file_name: attachment.name,
        mime_type: attachment.mimeType as SupportedMimeType,
        file_size: attachment.size,
      })

      const fileBuffer = await convertAttachmentToBytes(attachment)
      const { error: uploadError } = await supabase.storage
        .from(uploadRequest.bucket)
        .uploadToSignedUrl(uploadRequest.storagePath, uploadRequest.token, fileBuffer, {
          contentType: attachment.mimeType,
          upsert: false,
        })

      if (uploadError) {
        throw new Error(uploadError.message ?? 'Unable to upload supporting document.')
      }

      return {
        document_type: attachment.documentType,
        file_path: uploadRequest.storagePath,
      }
    },
    [checkId, convertAttachmentToBytes, createUploadUrlMutation]
  )

  const submitDispute = useCallback(async () => {
    if (!checkId) {
      setSubmissionError('Select a background check before submitting a dispute.')
      return false
    }

    setSubmissionError(null)
    setIsSubmitting(true)

    let submissionSucceeded = false

    try {
      await form.handleSubmit(async (values) => {
        const resolvedReason =
          values.reason === 'other'
            ? (values.otherReason?.trim() ?? 'Other')
            : (DISPUTE_REASON_OPTIONS.find((option) => option.value === values.reason)?.label ??
              values.reason)

        setIsUploading(true)
        const supportingDocuments = []
        for (const [index, attachment] of attachments.entries()) {
          // eslint-disable-next-line no-await-in-loop -- sequential uploads to reuse signed URL tokens
          const uploaded = await uploadAttachment(attachment, index)
          supportingDocuments.push(uploaded)
        }
        setIsUploading(false)

        await submitDisputeMutation.mutateAsync({
          background_check_id: checkId,
          reason: resolvedReason,
          details: values.details.trim(),
          supporting_documents: supportingDocuments.map((doc) => doc.file_path),
        })

        toast.show({
          title: 'Dispute submitted',
          message: 'Our compliance team will review your request shortly.',
          variant: 'success',
        })

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['backgroundChecks', 'list'] }),
          queryClient.invalidateQueries({ queryKey: ['backgroundChecks', 'detail', checkId] }),
          queryClient.invalidateQueries({ queryKey: ['backgroundChecks', 'disputes', checkId] }),
        ])

        setAttachments([])
        form.reset(DEFAULT_VALUES)
        submissionSucceeded = true
      })()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit dispute.'
      console.error('[useDispute] Failed to submit dispute', error)
      setSubmissionError(message)
      toast.show({
        title: 'Unable to submit dispute',
        variant: 'error',
      })
    } finally {
      setIsUploading(false)
      setIsSubmitting(false)
    }

    return submissionSucceeded
  }, [attachments, checkId, form, submitDisputeMutation, toast, uploadAttachment, queryClient])

  const reset = useCallback(() => {
    form.reset(DEFAULT_VALUES)
    setAttachments([])
    setAttachmentError(null)
    setSubmissionError(null)
  }, [form])

  const refetchDisputes = useCallback(() => {
    void disputeQuery.refetch()
  }, [disputeQuery])

  return {
    form,
    reasonOptions: DISPUTE_REASON_OPTIONS,
    attachments,
    addAttachment,
    removeAttachment,
    submitDispute,
    reset,
    isSubmitting,
    isUploading,
    attachmentError,
    submissionError,
    disputes,
    latestDispute,
    hasActiveDispute,
    isLoadingDisputes: disputeQuery.isLoading,
    refetchDisputes,
  }
}
