import { useState } from 'react'
import { Button, Text, XStack, YStack } from 'tamagui'
import { ArrowLeft, FileText, Upload, X } from '@tamagui/lucide-icons'
import type { AttachmentMetadata } from '@app/schemas'

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
}: AttachmentsStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})

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
  const handleFileSelect = async (type: AttachmentType, file: File) => {
    // Validate file type
    if (!isValidFileType(file)) {
      setErrors({
        ...errors,
        [type]: 'Please upload a PDF, DOC, or DOCX file',
      })
      return
    }

    // Validate file size
    if (!isValidFileSize(file)) {
      setErrors({
        ...errors,
        [type]: 'File size must be less than 5MB',
      })
      return
    }

    // Clear errors
    const newErrors = { ...errors }
    delete newErrors[type]
    setErrors(newErrors)

    // Set uploading state
    setUploading({ ...uploading, [type]: true })

    try {
      // TODO: Implement actual upload logic using tRPC
      // For now, just create metadata
      const newAttachment: AttachmentMetadata = {
        path: `applications/${type}/${file.name}`,
        filename: file.name,
        size: file.size,
        mime_type: file.type,
        uploaded_at: new Date().toISOString(),
      }

      // Update attachments
      onAttachmentsChange({
        ...attachments,
        [type]: newAttachment,
      })
    } catch {
      setErrors({
        ...errors,
        [type]: 'Failed to upload file. Please try again.',
      })
    } finally {
      setUploading({ ...uploading, [type]: false })
    }
  }

  /**
   * Handle file removal
   */
  const handleFileRemove = (type: AttachmentType) => {
    const newAttachments = { ...attachments }
    delete newAttachments[type]
    onAttachmentsChange(newAttachments)
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
            borderWidth={1}
            borderColor="$borderColor"
            bg="$background"
            justify="space-between"
            items="center"
            gap="$3"
          >
            <XStack gap="$3" items="center" flex={1}>
              <FileText size={24} color="$blue9" />
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
        ) : (
          <YStack gap="$2">
            <label htmlFor="resume-upload">
              <YStack
                p="$6"
                rounded="$4"
                borderWidth={2}
                borderColor={errors.resume ? '$red9' : '$borderColor'}
                borderStyle="dashed"
                bg="$background"
                items="center"
                gap="$3"
                cursor="pointer"
                hoverStyle={{ borderColor: '$blue9', bg: '$blue2' }}
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
              </YStack>
            </label>
            <input
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

        {uploading.resume && (
          <Text fontSize="$3" color="$blue10">
            Uploading...
          </Text>
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
            borderWidth={1}
            borderColor="$borderColor"
            bg="$background"
            justify="space-between"
            items="center"
            gap="$3"
          >
            <XStack gap="$3" items="center" flex={1}>
              <FileText size={24} color="$blue9" />
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
        ) : (
          <YStack gap="$2">
            <label htmlFor="cover-letter-upload">
              <YStack
                p="$6"
                rounded="$4"
                borderWidth={2}
                borderColor="$borderColor"
                borderStyle="dashed"
                bg="$background"
                items="center"
                gap="$3"
                cursor="pointer"
                hoverStyle={{ borderColor: '$blue9', bg: '$blue2' }}
              >
                <Upload size={32} color="$blue9" />
                <YStack gap="$1" items="center">
                  <Text fontSize="$4" fontWeight="600" color="$color12">
                    Choose a file or drag it here
                  </Text>
                  <Text fontSize="$3" color="$color11" text="center">
                    PDF, DOC, or DOCX • Max 5MB
                  </Text>
                </YStack>
              </YStack>
            </label>
            <input
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

        {uploading.cover_letter && (
          <Text fontSize="$3" color="$blue10">
            Uploading...
          </Text>
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
            borderWidth={1}
            borderColor="$borderColor"
            bg="$background"
            justify="space-between"
            items="center"
            gap="$3"
          >
            <XStack gap="$3" items="center" flex={1}>
              <FileText size={24} color="$blue9" />
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
        ) : (
          <YStack gap="$2">
            <label htmlFor="portfolio-upload">
              <YStack
                p="$6"
                rounded="$4"
                borderWidth={2}
                borderColor="$borderColor"
                borderStyle="dashed"
                bg="$background"
                items="center"
                gap="$3"
                cursor="pointer"
                hoverStyle={{ borderColor: '$blue9', bg: '$blue2' }}
              >
                <Upload size={32} color="$blue9" />
                <YStack gap="$1" items="center">
                  <Text fontSize="$4" fontWeight="600" color="$color12">
                    Choose a file or drag it here
                  </Text>
                  <Text fontSize="$3" color="$color11" text="center">
                    PDF, DOC, or DOCX • Max 5MB
                  </Text>
                </YStack>
              </YStack>
            </label>
            <input
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

        {uploading.portfolio && (
          <Text fontSize="$3" color="$blue10">
            Uploading...
          </Text>
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
