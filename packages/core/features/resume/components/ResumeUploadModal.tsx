import { useCallback, useEffect, useMemo, useState } from 'react'
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

interface UploadCandidate {
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

  const resetState = useCallback(() => {
    setStatus('idle')
    setCandidate(null)
    setErrorMessage(null)
    setFileName(null)
    uploadResumeMutation.reset()
    parseResumeMutation.reset()
  }, [parseResumeMutation, uploadResumeMutation])

  useEffect(() => {
    if (!open) {
      resetState()
    }
  }, [open, resetState])

  const showProgress = status === 'uploading' || status === 'parsing'

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
  }, [toast])

  const validateFileSize = (size: number): boolean => {
    if (size > MAX_FILE_BYTES) {
      handleUploadError('File size exceeds 1MB limit. Please upload a smaller file.')
      return false
    }
    return true
  }

  const handleWebFileSelect = useCallback((file: File) => {
    const mimeType = file.type || guessMimeTypeFromName(file.name)
    if (!ACCEPTED_MIME_TYPES.includes(mimeType as typeof ACCEPTED_MIME_TYPES[number])) {
      handleUploadError('Please upload a PDF or Word document.')
      return
    }

    if (!validateFileSize(file.size)) {
      return
    }

    const getBase64 = () => readFileAsBase64(file)

    setCandidate({
      name: file.name,
      size: file.size,
      type: mimeType,
      getBase64,
    })
    setFileName(file.name)
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

      setCandidate({
        name,
        size,
        type: mimeType,
        getBase64,
      })
      setFileName(name)
      setStatus('idle')
    } catch (error) {
      console.error('[ResumeUploadModal] Native picker error', error)
      handleUploadError('Failed to open document picker. Please try again.')
      setStatus('idle')
    }
  }, [handleUploadError, validateFileSize])

  useEffect(() => {
    const uploadCandidate = async () => {
      if (!candidate) {
        return
      }

      try {
        setStatus('uploading')
        const base64 = await candidate.getBase64()
        const uploadResponse = await uploadResumeMutation.mutateAsync({
          fileData: base64,
          fileName: candidate.name,
          fileSize: candidate.size,
          mimeType: candidate.type,
        })

        setStatus('parsing')
        await parseResumeMutation.mutateAsync({
          resumeId: uploadResponse.resumeId,
          sections: ['general', 'experience', 'education', 'skills', 'certifications', 'employment'],
        })

        await utils.resume.hasUploaded.invalidate()

        setStatus('success')
        toast.show('Resume Imported', {
          message: 'Review the parsed details before saving them to your profile.',
          type: 'success',
        })

        onUploadComplete?.(uploadResponse.resumeId)
        onOpenChange(false)
      } catch (error) {
        console.error('[ResumeUploadModal] Upload error', error)
        const message = error instanceof Error ? error.message : 'Unable to process resume. Please try again.'
        handleUploadError(message)
      } finally {
        setCandidate(null)
      }
    }

    void uploadCandidate()
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
            onFileSelect={handleWebFileSelect}
            onFileRemove={() => {
              setCandidate(null)
              setStatus('idle')
              setErrorMessage(null)
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

        {showProgress && (
          <XStack gap="$3" items="center" bg="$blue3" p="$3" rounded="$3">
            <Spinner size="small" color="$blue10" />
            <Text color="$blue11" fontWeight="600">
              {progressLabel}
            </Text>
          </XStack>
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

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsDataURL(file)
  })
}

