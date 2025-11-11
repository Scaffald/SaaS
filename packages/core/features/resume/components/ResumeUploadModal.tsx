import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { Button, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'
import { AlertCircle, CheckCircle2, Loader2, UploadCloud } from '@tamagui/lucide-icons'
import { ResponsiveModal, FileUpload, spacing } from '@app/ui'
import { useToastController } from '@tamagui/toast'
import { api } from '@app/core/utils/api'

const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx'
const MAX_FILE_BYTES = 1024 * 1024

type UploadStatus = 'idle' | 'selecting' | 'uploading' | 'parsing' | 'success' | 'error'

type UploadCandidate =
  | {
      kind: 'web'
      name: string
      size: number
      type: string
      file: File
    }
  | {
      kind: 'native'
      name: string
      size: number
      type: string
      getBase64: () => Promise<string>
    }

export interface ResumeUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete?: (resumeId: string) => void
}

export function ResumeUploadModal({
  open,
  onOpenChange,
  onUploadComplete,
}: ResumeUploadModalProps) {
  const toast = useToastController()
  const utils = api.useUtils()
  const uploadResumeMutation = api.resume.upload.useMutation()
  const parseResumeMutation = api.resume.parse.useMutation()

  const [status, setStatus] = useState<UploadStatus>('idle')
  const [candidate, setCandidate] = useState<UploadCandidate | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [progressLogs, setProgressLogs] = useState<string[]>([])
  const lastCandidateRef = useRef<UploadCandidate | null>(null)

  const appendLog = useCallback((message: string) => {
    setProgressLogs((previous) => [...previous, message])
  }, [])

  const resetState = useCallback(() => {
    setStatus('idle')
    setCandidate(null)
    setErrorMessage(null)
    setFileName(null)
    setProgressLogs([])
    uploadResumeMutation.reset()
    parseResumeMutation.reset()
  }, [parseResumeMutation, uploadResumeMutation])

  const wasOpenRef = useRef<boolean>(open)

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      resetState()
    }

    wasOpenRef.current = open
  }, [open, resetState])

  const showProgress = status === 'uploading' || status === 'parsing'

  const shouldShowProgressIndicators = status === 'uploading' || status === 'parsing' || status === 'success' || status === 'error'

  const progressValue = useMemo(() => {
    switch (status) {
      case 'uploading':
        return 0.35
      case 'parsing':
        return 0.75
      case 'success':
        return 1
      case 'error':
        return 1
      default:
        return 0
    }
  }, [status])

  const progressColor = useMemo(() => {
    if (status === 'error') {
      return '$red9'
    }
    if (status === 'success') {
      return '$green9'
    }
    return '$blue9'
  }, [status])

  const progressLabel = useMemo(() => {
    switch (status) {
      case 'uploading':
        return 'Uploading resume...'
      case 'parsing':
        return 'Parsing resume with AI...'
      case 'success':
        return 'Resume uploaded successfully.'
      default:
        return null
    }
  }, [status])

  const handleUploadError = useCallback((message: string) => {
    setStatus('error')
    setErrorMessage(message)
    toast.show('Resume Import Failed', {
      message,
      type: 'error',
    })
    appendLog(`❌ ${message}`)
  }, [appendLog, toast])

  const validateFileSize = (size: number): boolean => {
    if (size > MAX_FILE_BYTES) {
      handleUploadError('File size exceeds 1MB limit. Please upload a smaller file.')
      return false
    }
    return true
  }

  const handleWebFileSelect = useCallback((file: File) => {
    console.debug('[ResumeUploadModal] handleWebFileSelect', {
      name: file.name,
      size: file.size,
      type: file.type,
    })
    const mimeType = file.type || guessMimeTypeFromName(file.name)
    if (!ACCEPTED_MIME_TYPES.includes(mimeType as typeof ACCEPTED_MIME_TYPES[number])) {
      handleUploadError('Please upload a PDF or Word document.')
      return
    }

    if (!validateFileSize(file.size)) {
      return
    }

    const nextCandidate: UploadCandidate = {
      kind: 'web',
      name: file.name,
      size: file.size,
      type: mimeType,
      file,
    }
    setCandidate(nextCandidate)
    lastCandidateRef.current = null
    setFileName(file.name)
    setProgressLogs([`📄 Selected file "${file.name}" (${Math.round(file.size / 1024)} KB)`])
  }, [handleUploadError, validateFileSize])

  const handleNativePick = useCallback(async () => {
    try {
      setStatus('selecting')
      const { getDocumentAsync } = await import('expo-document-picker')
      const result = await getDocumentAsync({
        type: ACCEPTED_MIME_TYPES as unknown as string[],
        multiple: false,
        copyToCacheDirectory: true,
      })

      if (result.canceled) {
        setStatus('idle')
        return
      }

      const asset = result.assets?.[0]
      const uri = asset?.uri
      const name = asset?.name ?? 'resume'
      const mimeType = asset?.mimeType ?? 'application/pdf'

      if (!uri) {
        handleUploadError('Unable to access selected file. Please try again.')
        setStatus('idle')
        return
      }

      const FileSystem = await import('expo-file-system')
      const info = await FileSystem.getInfoAsync(uri)
      const infoSize =
        info.exists && 'size' in info && typeof info.size === 'number' ? info.size : undefined
      const size = typeof asset?.size === 'number' ? asset.size : infoSize ?? 0

      if (!validateFileSize(size)) {
        setStatus('idle')
        return
      }

      const getBase64 = async () => {
        const contents = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        })
        return `data:${mimeType};base64,${contents}`
      }

      const nextCandidate: UploadCandidate = {
        kind: 'native',
        name,
        size,
        type: mimeType,
        getBase64,
      }
      setCandidate(nextCandidate)
      lastCandidateRef.current = null
      setFileName(name)
      setStatus('idle')
      setProgressLogs([`📄 Selected file "${name}" (${Math.round(size / 1024)} KB)`])
    } catch (error) {
      console.error('[ResumeUploadModal] Native picker error', error)
      handleUploadError('Failed to open document picker. Please try again.')
      setStatus('idle')
    }
  }, [handleUploadError, validateFileSize])

  useEffect(() => {
    if (!candidate) {
      console.debug('[ResumeUploadModal] useEffect no candidate')
      lastCandidateRef.current = null
      return
    }

    if (lastCandidateRef.current === candidate) {
      return
    }

    lastCandidateRef.current = candidate
    let isCancelled = false

    const uploadCandidate = async () => {
      try {
        if (isCancelled) {
          return
        }
        setStatus('uploading')
        appendLog('⬆️ Preparing upload request...')
        const base64 =
          candidate.kind === 'web'
            ? await fileToDataUrl(candidate.file)
            : await candidate.getBase64()
        console.debug('[ResumeUploadModal] obtained base64', {
          length: base64.length,
          kind: candidate.kind,
        })
        if (isCancelled) {
          return
        }
        appendLog('📡 Sending upload to resume.upload...')
        const uploadResponse = await uploadResumeMutation.mutateAsync({
          fileData: base64,
          fileName: candidate.name,
          fileSize: candidate.size,
          mimeType: candidate.type,
        })
        appendLog('✅ Upload stored, starting AI parsing...')

        if (isCancelled) {
          return
        }

        setStatus('parsing')
        appendLog('🤖 Resume uploaded. Starting AI parsing...')
        await parseResumeMutation.mutateAsync({
          resumeId: uploadResponse.resumeId,
          sections: ['general', 'experience', 'education', 'skills', 'certifications', 'employment'],
        })
        appendLog('🤖 Parsing completed, updating dashboard...')

        if (isCancelled) {
          return
        }

        await utils.resume.hasUploaded.invalidate()

        if (isCancelled) {
          return
        }

        setStatus('success')
        appendLog('✅ Parsing complete. Preparing your review wizard...')
        toast.show('Resume Imported', {
          message: 'Review the parsed details before saving them to your profile.',
          type: 'success',
        })

        if (!isCancelled) {
          appendLog('🚀 Redirecting to the review experience...')
          onUploadComplete?.(uploadResponse.resumeId)
        }

        if (!isCancelled) {
          onOpenChange(false)
        }
      } catch (error) {
        if (isCancelled) {
          return
        }
        console.error('[ResumeUploadModal] Upload error', error)
        const message =
          error instanceof Error ? error.message : 'Unable to process resume. Please try again.'
        handleUploadError(message)
      } finally {
        if (!isCancelled) {
          appendLog('ℹ️ Resetting uploader state.')
          setCandidate(null)
        }
      }
    }

    void uploadCandidate()

    return () => {
      isCancelled = true
      console.debug('[ResumeUploadModal] upload effect cleanup')
    }
  }, [
    candidate,
    handleUploadError,
    onOpenChange,
    onUploadComplete,
    parseResumeMutation,
    toast,
    uploadResumeMutation,
    utils.resume.hasUploaded,
  ])

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Import Resume"
      size="medium"
    >
      <YStack gap={spacing.md}>
        <Paragraph color="$color11">
          Upload a PDF or Word document under 1MB. We’ll extract your experience, education, skills, and preferences so
          you can confirm the details before saving them to your profile.
        </Paragraph>

        {Platform.OS === 'web' ? (
          <FileUpload
            accept={ACCEPTED_EXTENSIONS}
            maxSizeMB={1}
            title="Upload resume"
            description="Drag & drop or browse to import your resume."
            helperText="Accepted formats: PDF, DOC, DOCX (max 1MB)"
            onFileSelect={handleWebFileSelect}
            onFileRemove={() => {
              setCandidate(null)
              setStatus('idle')
              setErrorMessage(null)
              setProgressLogs((previous) => [...previous, '🗑️ Removed selected file'])
            }}
            disabled={status === 'uploading' || status === 'parsing'}
            currentFileName={fileName ?? undefined}
            error={status === 'error' ? errorMessage ?? undefined : undefined}
          />
        ) : (
          <YStack gap={spacing.sm}>
            <Button
              size="$4"
              icon={UploadCloud}
              disabled={status === 'uploading' || status === 'parsing'}
              onPress={handleNativePick}
            >
              Choose File
            </Button>
            {fileName ? (
              <Text color="$color11">Selected file: {fileName}</Text>
            ) : (
              <Text color="$color11">Supported formats: PDF, DOC, DOCX. Maximum size: 1MB.</Text>
            )}
            {status === 'error' && errorMessage ? (
              <XStack gap="$2" items="center">
                <AlertCircle color="$red10" size={18} />
                <Text color="$red10">{errorMessage}</Text>
              </XStack>
            ) : null}
          </YStack>
        )}

        {shouldShowProgressIndicators && progressValue > 0 && (
          <YStack gap="$2" bg="$color2" p="$3" rounded="$3">
            <YStack
              height={8}
              bg="$color4"
              rounded="$4"
              overflow="hidden"
            >
              <YStack
                height="100%"
                width={`${Math.round(progressValue * 100)}%`}
                bg={progressColor}
              />
            </YStack>
            <XStack gap="$2" items="center">
              {status === 'success' ? (
                <CheckCircle2 color="$green10" size={18} />
              ) : status === 'error' ? (
                <AlertCircle color="$red10" size={18} />
              ) : (
                <Spinner size="small" color="$blue10" />
              )}
              <Text color={status === 'error' ? '$red11' : '$color11'} fontWeight="600">
                {progressLabel ?? 'Processing resume...'}
              </Text>
            </XStack>
          </YStack>
        )}

        {status === 'success' && (
          <XStack gap="$3" items="center" bg="$green3" p="$3" rounded="$3">
            <CheckCircle2 color="$green10" size={20} />
            <Text color="$green11" fontWeight="600">
              Resume uploaded successfully. Redirecting...
            </Text>
          </XStack>
        )}

        {status === 'error' && errorMessage && (
          <XStack gap="$3" items="center" bg="$red3" p="$3" rounded="$3">
            <AlertCircle color="$red10" size={20} />
            <Text color="$red11" fontWeight="600">
              {errorMessage}
            </Text>
          </XStack>
        )}

        {progressLogs.length > 0 && (
          <YStack gap="$2" bg="$color2" p="$3" rounded="$3">
            <Text fontWeight="600" color="$color11">
              Activity log
            </Text>
            <YStack gap="$1">
              {progressLogs.map((log, index) => (
                <Text key={`${index}-${log}`} color="$color10" fontSize="$2">
                  {log}
                </Text>
              ))}
            </YStack>
          </YStack>
        )}

        <XStack gap="$2" justify="flex-end">
          <Button
            size="$3"
            variant="outlined"
            disabled={showProgress}
            onPress={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="$3"
            disabled
            icon={showProgress ? Loader2 : undefined}
            bg={status === 'error' ? '$red4' : '$blue4'}
            color={status === 'error' ? '$red11' : '$blue11'}
            borderColor={status === 'error' ? '$red7' : '$blue7'}
            borderWidth={1}
          >
            {showProgress ? 'Working...' : status === 'error' ? 'Upload Failed' : 'Waiting for file'}
          </Button>
        </XStack>
      </YStack>
    </ResponsiveModal>
  )
}

function guessMimeTypeFromName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  if (extension === 'doc') {
    return 'application/msword'
  }
  if (extension === 'docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  return 'application/pdf'
}

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  if (typeof btoa === 'function') {
    return `data:${file.type || guessMimeTypeFromName(file.name)};base64,${btoa(binary)}`
  }

  const maybeBuffer = (globalThis as Record<string, unknown>).Buffer as
    | { from(input: Uint8Array): { toString(encoding: 'base64'): string } }
    | undefined
  if (maybeBuffer) {
    return `data:${file.type || guessMimeTypeFromName(file.name)};base64,${maybeBuffer
      .from(bytes)
      .toString('base64')}`
  }

  throw new Error('Unable to encode file data.')
}

