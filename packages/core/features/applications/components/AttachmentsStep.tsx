import { api } from '@app/core/utils/api'
import type { AttachmentMetadata } from '@app/schemas'
import { ArrowLeft, CheckCircle2, Upload, X } from '@tamagui/lucide-icons'
import { type DragEvent, useCallback, useRef, useState } from 'react'
import { Button, Progress, Text, XStack, YStack } from 'tamagui'

type AttachmentType = 'resume' | 'cover_letter' | 'portfolio'

export interface Attachments {
  resume?: AttachmentMetadata
  cover_letter?: AttachmentMetadata
  portfolio?: AttachmentMetadata
}

export interface AttachmentsStepProps {
  /**
   * Current attachments
   */
  attachments: Attachments

  /**
   * Callback when attachments change
   */
  onAttachmentsChange: (attachments: Attachments) => void

  /**
   * Callback to go to previous step
   */
  onPrevious: () => void

  /**
   * Callback to continue to next step
   */
  onContinue: () => void

  /**
   * Whether the form is being submitted
   */
  isSubmitting?: boolean

  /**
   * Whether resume is required
   */
  requireResume?: boolean

  /**
   * Application ID for file uploads (optional - if not provided, files are stored locally)
   */
  applicationId?: string
}

/**
 * AttachmentsStep - File upload step for application documents
 *
 * Supported attachments:
 * - Resume (required)
 * - Cover Letter (optional)
 * - Portfolio (optional)
 *
 * File requirements:
 * - Max size: 5MB
 * - Formats: PDF, DOC, DOCX
 */
export function AttachmentsStep({
  attachments,
  onAttachmentsChange,
  onPrevious,
  onContinue,
  isSubmitting = false,
  requireResume = true,
  applicationId,
}: AttachmentsStepProps) {
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [uploadProgress, setUploadProgress] = useState<Record<string, number | undefined>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const dragOverRefs = useRef<Record<string, boolean>>({})

  const getUploadUrlMutation = api.applications.getUploadUrl.useMutation()
  const confirmUploadMutation = api.applications.confirmUpload.useMutation()

  /**
   * Get attachment by type
   */
  const getAttachment = (type: AttachmentType): AttachmentMetadata | undefined => {
    return attachments[type]
  }

  /**
   * Check if a file type is valid
   */
  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    return validTypes.includes(file.type)
  }

  /**
   * Check if file size is valid (max 5MB)
   */
  const isValidFileSize = (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    return file.size <= maxSize
  }

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(
    async (type: AttachmentType, file: File) => {
      // Validate file type
      if (!isValidFileType(file)) {
        setErrors((prev) => ({
          ...prev,
          [type]: 'Please upload a PDF, DOC, or DOCX file',
        }))
        return
      }

      // Validate file size
      if (!isValidFileSize(file)) {
        setErrors((prev) => ({
          ...prev,
          [type]: 'File size must be less than 5MB',
        }))
        return
      }

      // Clear errors
      setErrors((prev) => {
        const newErrors = { ...prev }
        newErrors[type] = undefined
        return newErrors
      })

      // Set uploading state
      setUploading((prev) => ({ ...prev, [type]: true }))
      setUploadProgress((prev) => ({ ...prev, [type]: 0 }))

      try {
        let attachmentMetadata: AttachmentMetadata

        if (applicationId) {
          // Get upload URL from tRPC
          const { uploadUrl, path } = await getUploadUrlMutation.mutateAsync({
            application_id: applicationId,
            attachment_type: type,
            filename: file.name,
            mime_type: file.type,
            size: file.size,
          })

          // Upload file to Supabase storage
          const formData = new FormData()
          formData.append('file', file)

          // Simulate progress (actual upload doesn't provide progress events)
          setUploadProgress((prev) => ({ ...prev, [type]: 50 }))

          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          })

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload file to storage')
          }

          setUploadProgress((prev) => ({ ...prev, [type]: 90 }))

          // Confirm upload
          await confirmUploadMutation.mutateAsync({
            application_id: applicationId,
            attachment_type: type,
            path,
            filename: file.name,
            size: file.size,
            mime_type: file.type,
          })

          attachmentMetadata = {
            path,
            filename: file.name,
            size: file.size,
            mime_type: file.type,
            uploaded_at: new Date().toISOString(),
          }
        } else {
          // No application ID - store metadata locally (will be uploaded when application is created)
          attachmentMetadata = {
            path: `applications/${type}/${file.name}`,
            filename: file.name,
            size: file.size,
            mime_type: file.type,
            uploaded_at: new Date().toISOString(),
          }
        }

        setUploadProgress((prev) => ({ ...prev, [type]: 100 }))

        // Update attachments
        onAttachmentsChange({
          ...attachments,
          [type]: attachmentMetadata,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to upload file. Please try again.'
        setErrors((prev) => ({
          ...prev,
          [type]: errorMessage,
        }))
      } finally {
        setUploading((prev) => ({ ...prev, [type]: false }))
        // Reset progress after a delay
        setTimeout(() => {
          setUploadProgress((prev) => {
            const newProgress = { ...prev }
            newProgress[type] = undefined
            return newProgress
          })
        }, 500)
      }
    },
    [applicationId, attachments, onAttachmentsChange, getUploadUrlMutation, confirmUploadMutation]
  )

  /**
   * Handle drag and drop
   */
  const handleDragOver = useCallback((type: AttachmentType, e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragOverRefs.current[type] = true
  }, [])

  const handleDragLeave = useCallback((type: AttachmentType) => {
    dragOverRefs.current[type] = false
  }, [])

  const handleDrop = useCallback(
    (type: AttachmentType, e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragOverRefs.current[type] = false

      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleFileSelect(type, file)
      }
    },
    [handleFileSelect]
  )

  /**
   * Handle file removal
   */
  const handleFileRemove = (type: AttachmentType) => {
    const newAttachments = { ...attachments }
    // Remove the attachment by creating a new object without it
    const { [type]: _removed, ...rest } = newAttachments
    onAttachmentsChange(rest as Attachments)
  }

  /**
   * Validate and continue
   */
  const validateAndContinue = () => {
    const newErrors: Record<string, string> = {}

    // Check if resume is required and present
    if (requireResume && !getAttachment('resume')) {
      newErrors.resume = 'Resume is required'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onContinue()
    }
  }

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <YStack gap="$6" width="100%" maxW={800} p="$4">
      {/* Header */}
      <YStack gap="$2">
        <Text fontSize="$8" fontWeight="bold" color="$color12">
          Upload Documents
        </Text>
        <Text fontSize="$4" color="$color11">
          Upload your resume and any additional documents to support your application.
        </Text>
      </YStack>

      {/* Resume Upload */}
      <YStack gap="$3">
        <XStack gap="$2" items="center">
          <Text fontSize="$5" fontWeight="600" color="$color12">
            Resume
          </Text>
          {requireResume && (
            <Text fontSize="$3" color="$red10">
              Required
            </Text>
          )}
        </XStack>

        {getAttachment('resume') ? (
          <XStack
            p="$4"
            rounded="$4"
            borderWidth={2}
            borderColor="$green9"
            bg="$green2"
            justify="space-between"
            items="center"
            gap="$3"
          >
            <XStack gap="$3" items="center" flex={1}>
              <CheckCircle2 size={24} color="$green10" />
              <YStack flex={1}>
                <Text fontSize="$4" fontWeight="600" color="$color12">
                  {getAttachment('resume')?.filename}
                </Text>
                <Text fontSize="$2" color="$color11">
                  {formatFileSize(getAttachment('resume')?.size ?? 0)}
                </Text>
              </YStack>
            </XStack>
            <Button
              size="$3"
              circular
              variant="outlined"
              icon={X}
              onPress={() => handleFileRemove('resume')}
              disabled={isSubmitting || uploading.resume}
            />
          </XStack>
        ) : uploading.resume ? (
          <YStack gap="$2">
            <YStack
              p="$6"
              rounded="$4"
              borderWidth={2}
              borderColor="$blue9"
              bg="$blue2"
              items="center"
              gap="$3"
            >
              <Upload size={32} color="$blue10" />
              <YStack gap="$2" width="100%">
                <Text fontSize="$4" fontWeight="600" color="$color12" text="center">
                  Uploading...
                </Text>
                <Progress value={uploadProgress.resume || 0} max={100} bg="$blue4">
                  <Progress.Indicator animation="bouncy" bg="$blue9" />
                </Progress>
                <Text fontSize="$2" color="$color11" text="center">
                  {uploadProgress.resume || 0}%
                </Text>
              </YStack>
            </YStack>
          </YStack>
        ) : (
          <YStack gap="$2">
            <label htmlFor="resume-upload">
              <YStack
                asChild
                p="$6"
                rounded="$4"
                borderWidth={2}
                borderColor={
                  errors.resume ? '$red9' : dragOverRefs.current.resume ? '$blue9' : '$borderColor'
                }
                borderStyle="dashed"
                bg={dragOverRefs.current.resume ? '$blue2' : '$background'}
                items="center"
                gap="$3"
                cursor="pointer"
                hoverStyle={{ borderColor: '$blue9', bg: '$blue2' }}
              >
                <div
                  onDragOver={(e) => handleDragOver('resume', e)}
                  onDragLeave={() => handleDragLeave('resume')}
                  onDrop={(e) => handleDrop('resume', e)}
                  style={{ width: '100%' }}
                >
                  <Upload size={32} color={errors.resume ? '$red9' : '$blue9'} />
                  <YStack gap="$1" items="center">
                    <Text fontSize="$4" fontWeight="600" color="$color12">
                      Choose a file or drag it here
                    </Text>
                    <Text fontSize="$3" color="$color11" text="center">
                      PDF, DOC, or DOCX • Max 5MB
                    </Text>
                  </YStack>
                </div>
              </YStack>
            </label>
            <input
              ref={(el) => {
                fileInputRefs.current.resume = el
              }}
              id="resume-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect('resume', file)
              }}
              disabled={isSubmitting || uploading.resume}
            />
            {errors.resume && (
              <Text fontSize="$2" color="$red10">
                {errors.resume}
              </Text>
            )}
          </YStack>
        )}
      </YStack>

      {/* Cover Letter Upload (Optional) */}
      <YStack gap="$3">
        <XStack gap="$2" items="center">
          <Text fontSize="$5" fontWeight="600" color="$color12">
            Cover Letter
          </Text>
          <Text fontSize="$3" color="$color11">
            Optional
          </Text>
        </XStack>

        {getAttachment('cover_letter') ? (
          <XStack
            p="$4"
            rounded="$4"
            borderWidth={2}
            borderColor="$green9"
            bg="$green2"
            justify="space-between"
            items="center"
            gap="$3"
          >
            <XStack gap="$3" items="center" flex={1}>
              <CheckCircle2 size={24} color="$green10" />
              <YStack flex={1}>
                <Text fontSize="$4" fontWeight="600" color="$color12">
                  {getAttachment('cover_letter')?.filename}
                </Text>
                <Text fontSize="$2" color="$color11">
                  {formatFileSize(getAttachment('cover_letter')?.size ?? 0)}
                </Text>
              </YStack>
            </XStack>
            <Button
              size="$3"
              circular
              variant="outlined"
              icon={X}
              onPress={() => handleFileRemove('cover_letter')}
              disabled={isSubmitting || uploading.cover_letter}
            />
          </XStack>
        ) : uploading.cover_letter ? (
          <YStack gap="$2">
            <YStack
              p="$6"
              rounded="$4"
              borderWidth={2}
              borderColor="$blue9"
              bg="$blue2"
              items="center"
              gap="$3"
            >
              <Upload size={32} color="$blue10" />
              <YStack gap="$2" width="100%">
                <Text fontSize="$4" fontWeight="600" color="$color12" text="center">
                  Uploading...
                </Text>
                <Progress value={uploadProgress.cover_letter || 0} max={100} bg="$blue4">
                  <Progress.Indicator animation="bouncy" bg="$blue9" />
                </Progress>
                <Text fontSize="$2" color="$color11" text="center">
                  {uploadProgress.cover_letter || 0}%
                </Text>
              </YStack>
            </YStack>
          </YStack>
        ) : (
          <YStack gap="$2">
            <label htmlFor="cover-letter-upload">
              <YStack
                asChild
                p="$6"
                rounded="$4"
                borderWidth={2}
                borderColor={
                  errors.cover_letter
                    ? '$red9'
                    : dragOverRefs.current.cover_letter
                      ? '$blue9'
                      : '$borderColor'
                }
                borderStyle="dashed"
                bg={dragOverRefs.current.cover_letter ? '$blue2' : '$background'}
                items="center"
                gap="$3"
                cursor="pointer"
                hoverStyle={{ borderColor: '$blue9', bg: '$blue2' }}
              >
                <div
                  onDragOver={(e) => handleDragOver('cover_letter', e)}
                  onDragLeave={() => handleDragLeave('cover_letter')}
                  onDrop={(e) => handleDrop('cover_letter', e)}
                  style={{ width: '100%' }}
                >
                  <Upload size={32} color={errors.cover_letter ? '$red9' : '$blue9'} />
                  <YStack gap="$1" items="center">
                    <Text fontSize="$4" fontWeight="600" color="$color12">
                      Choose a file or drag it here
                    </Text>
                    <Text fontSize="$3" color="$color11" text="center">
                      PDF, DOC, or DOCX • Max 5MB
                    </Text>
                  </YStack>
                </div>
              </YStack>
            </label>
            <input
              ref={(el) => {
                fileInputRefs.current.cover_letter = el
              }}
              id="cover-letter-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect('cover_letter', file)
              }}
              disabled={isSubmitting || uploading.cover_letter}
            />
            {errors.cover_letter && (
              <Text fontSize="$2" color="$red10">
                {errors.cover_letter}
              </Text>
            )}
          </YStack>
        )}
      </YStack>

      {/* Portfolio Upload (Optional) */}
      <YStack gap="$3">
        <XStack gap="$2" items="center">
          <Text fontSize="$5" fontWeight="600" color="$color12">
            Portfolio / Work Samples
          </Text>
          <Text fontSize="$3" color="$color11">
            Optional
          </Text>
        </XStack>

        {getAttachment('portfolio') ? (
          <XStack
            p="$4"
            rounded="$4"
            borderWidth={2}
            borderColor="$green9"
            bg="$green2"
            justify="space-between"
            items="center"
            gap="$3"
          >
            <XStack gap="$3" items="center" flex={1}>
              <CheckCircle2 size={24} color="$green10" />
              <YStack flex={1}>
                <Text fontSize="$4" fontWeight="600" color="$color12">
                  {getAttachment('portfolio')?.filename}
                </Text>
                <Text fontSize="$2" color="$color11">
                  {formatFileSize(getAttachment('portfolio')?.size ?? 0)}
                </Text>
              </YStack>
            </XStack>
            <Button
              size="$3"
              circular
              variant="outlined"
              icon={X}
              onPress={() => handleFileRemove('portfolio')}
              disabled={isSubmitting || uploading.portfolio}
            />
          </XStack>
        ) : uploading.portfolio ? (
          <YStack gap="$2">
            <YStack
              p="$6"
              rounded="$4"
              borderWidth={2}
              borderColor="$blue9"
              bg="$blue2"
              items="center"
              gap="$3"
            >
              <Upload size={32} color="$blue10" />
              <YStack gap="$2" width="100%">
                <Text fontSize="$4" fontWeight="600" color="$color12" text="center">
                  Uploading...
                </Text>
                <Progress value={uploadProgress.portfolio || 0} max={100} bg="$blue4">
                  <Progress.Indicator animation="bouncy" bg="$blue9" />
                </Progress>
                <Text fontSize="$2" color="$color11" text="center">
                  {uploadProgress.portfolio || 0}%
                </Text>
              </YStack>
            </YStack>
          </YStack>
        ) : (
          <YStack gap="$2">
            <label htmlFor="portfolio-upload">
              <YStack
                asChild
                p="$6"
                rounded="$4"
                borderWidth={2}
                borderColor={
                  errors.portfolio
                    ? '$red9'
                    : dragOverRefs.current.portfolio
                      ? '$blue9'
                      : '$borderColor'
                }
                borderStyle="dashed"
                bg={dragOverRefs.current.portfolio ? '$blue2' : '$background'}
                items="center"
                gap="$3"
                cursor="pointer"
                hoverStyle={{ borderColor: '$blue9', bg: '$blue2' }}
              >
                <div
                  onDragOver={(e) => handleDragOver('portfolio', e)}
                  onDragLeave={() => handleDragLeave('portfolio')}
                  onDrop={(e) => handleDrop('portfolio', e)}
                  style={{ width: '100%' }}
                >
                  <Upload size={32} color={errors.portfolio ? '$red9' : '$blue9'} />
                  <YStack gap="$1" items="center">
                    <Text fontSize="$4" fontWeight="600" color="$color12">
                      Choose a file or drag it here
                    </Text>
                    <Text fontSize="$3" color="$color11" text="center">
                      PDF, DOC, or DOCX • Max 5MB
                    </Text>
                  </YStack>
                </div>
              </YStack>
            </label>
            <input
              ref={(el) => {
                fileInputRefs.current.portfolio = el
              }}
              id="portfolio-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect('portfolio', file)
              }}
              disabled={isSubmitting || uploading.portfolio}
            />
            {errors.portfolio && (
              <Text fontSize="$2" color="$red10">
                {errors.portfolio}
              </Text>
            )}
          </YStack>
        )}
      </YStack>

      {/* Info Box */}
      <YStack p="$4" rounded="$4" bg="$blue2" borderWidth={1} borderColor="$blue7">
        <Text fontSize="$3" color="$blue11">
          💡 Tip: Make sure your documents are up-to-date and clearly showcase your relevant
          experience and skills for this position.
        </Text>
      </YStack>

      {/* Navigation Buttons */}
      <XStack gap="$3" justify="space-between" mt="$4">
        <Button
          size="$4"
          variant="outlined"
          icon={ArrowLeft}
          onPress={onPrevious}
          disabled={isSubmitting || Object.values(uploading).some((v) => v)}
        >
          Previous
        </Button>
        <Button
          size="$4"
          theme="info"
          onPress={validateAndContinue}
          disabled={isSubmitting || Object.values(uploading).some((v) => v)}
        >
          {isSubmitting ? 'Saving...' : 'Continue to Review'}
        </Button>
      </XStack>
    </YStack>
  )
}
