import { useGetUploadUrlMutation, useConfirmUploadMutation } from '@scf/core/utils/jobs-sdk-hooks'
import type { AttachmentMetadata } from '@scf/schemas'
import { ArrowLeft, CheckCircle2, Upload, X } from 'lucide-react-native'
import { type DragEvent, useCallback, useRef, useState } from 'react'
import { Button, Progress, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

type AttachmentType = 'resume' | 'cover_letter' | 'portfolio'

export interface Attachments {
  resume?: AttachmentMetadata
  cover_letter?: AttachmentMetadata
  portfolio?: AttachmentMetadata
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
  const { theme } = useThemeContext()

  const getUploadUrlMutation = useGetUploadUrlMutation()
  const confirmUploadMutation = useConfirmUploadMutation()

  /**
   * Get attachment by type
   */
  const getAttachment = (type: AttachmentType): AttachmentMetadata | undefined => {
    return attachments[type]
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
          // Get upload URL from SDK
          const { uploadUrl, path } = await getUploadUrlMutation.mutateAsync({
            application_id: applicationId,
            attachment_type: type,
            filename: file.name,
            content_type: file.type,
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
    <Stack gap={24} width="100%" maxWidth={800} padding="md">
      {/* Header */}
      <Stack gap={8}>
        <Text style={{ color: colors.text[theme].secondary }}>Upload Documents</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          Upload your resume and any additional documents to support your application.
        </Text>
      </Stack>

      {/* Resume Upload */}
      <Stack gap={12}>
        <Row gap={8} align="center">
          <Text style={{ color: colors.text[theme].secondary }}>Resume</Text>
          {requireResume && <Text style={{ color: colors.text[theme].error }}>Required</Text>}
        </Row>

        {getAttachment('resume') ? (
          <Row
            padding="md"
            borderRadius={16}
            borderWidth={2}
            style={{
              borderColor: colors.border[theme].success,
              backgroundColor: colors.bg[theme].success,
            }}
            justify="space-between"
            align="center"
            gap={12}
          >
            <Row gap={12} align="center" flex={1}>
              <CheckCircle2 size={24} style={{ color: colors.text[theme].success }} />
              <Stack flex={1}>
                <Text style={{ color: colors.text[theme].secondary }}>
                  {getAttachment('resume')?.filename}
                </Text>
                <Text style={{ color: colors.text[theme].secondary }}>
                  {formatFileSize(getAttachment('resume')?.size ?? 0)}
                </Text>
              </Stack>
            </Row>
            <Button
              size="sm"
              variant="outline"
              iconStart={X}
              onPress={() => handleFileRemove('resume')}
              disabled={isSubmitting || uploading.resume}
            />
          </Row>
        ) : uploading.resume ? (
          <Stack gap={8}>
            <Stack
              padding="xl"
              borderRadius={16}
              borderWidth={2}
              style={{
                borderColor: colors.border[theme].info,
                backgroundColor: colors.bg[theme].info,
              }}
              align="center"
              gap={12}
            >
              <Upload size={32} style={{ color: colors.text[theme].info }} />
              <Stack gap={8} width="100%">
                <Text style={{ color: colors.text[theme].secondary }} textAlign="center">
                  Uploading...
                </Text>
                <Progress
                  value={uploadProgress.resume || 0}
                  max={100}
                  style={{ backgroundColor: colors.bg[theme].primary }}
                >
                  <Progress.Indicator animation="bouncy" />
                </Progress>
                <Text style={{ color: colors.text[theme].secondary }} textAlign="center">
                  {uploadProgress.resume || 0}%
                </Text>
              </Stack>
            </Stack>
          </Stack>
        ) : (
          <Stack gap={8}>
            <label htmlFor="resume-upload">
              <Stack
                asChild
                padding="xl"
                borderRadius={16}
                borderWidth={2}
                style={{
                  borderColor: errors.resume
                    ? colors.border[theme].error
                    : dragOverRefs.current.resume
                      ? colors.border[theme].info
                      : colors.border[theme].default,
                  backgroundColor: dragOverRefs.current.resume
                    ? colors.bg[theme].info
                    : colors.bg[theme].default,
                }}
                borderStyle="dashed"
                align="center"
                gap={12}
                cursor="pointer"
                hoverStyle={{
                  borderColor: colors.border[theme].info,
                  backgroundColor: colors.bg[theme].info,
                }}
              >
                <section
                  aria-label="Resume upload drop zone"
                  onDragOver={(e) => handleDragOver('resume', e)}
                  onDragLeave={() => handleDragLeave('resume')}
                  onDrop={(e) => handleDrop('resume', e)}
                  style={{
                    width: '100%',
                    color: errors.resume ? colors.border[theme].error : colors.border[theme].info,
                  }}
                >
                  <Upload size={32} />
                  <Stack gap={4} align="center">
                    <Text style={{ color: colors.text[theme].secondary }}>
                      Choose a file or drag it here
                    </Text>
                    <Text style={{ color: colors.text[theme].secondary }} textAlign="center">
                      PDF, DOC, or DOCX • Max 5MB
                    </Text>
                  </Stack>
                </section>
              </Stack>
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
              <Text style={{ color: colors.text[theme].error }}>{errors.resume}</Text>
            )}
          </Stack>
        )}
      </Stack>

      {/* Cover Letter Upload (Optional) */}
      <Stack gap={12}>
        <Row gap={8} align="center">
          <Text style={{ color: colors.text[theme].secondary }}>Cover Letter</Text>
          <Text style={{ color: colors.text[theme].secondary }}>Optional</Text>
        </Row>

        {getAttachment('cover_letter') ? (
          <Row
            padding="md"
            borderRadius={16}
            borderWidth={2}
            style={{
              borderColor: colors.border[theme].success,
              backgroundColor: colors.bg[theme].success,
            }}
            justify="space-between"
            align="center"
            gap={12}
          >
            <Row gap={12} align="center" flex={1}>
              <CheckCircle2 size={24} style={{ color: colors.text[theme].success }} />
              <Stack flex={1}>
                <Text style={{ color: colors.text[theme].secondary }}>
                  {getAttachment('cover_letter')?.filename}
                </Text>
                <Text style={{ color: colors.text[theme].secondary }}>
                  {formatFileSize(getAttachment('cover_letter')?.size ?? 0)}
                </Text>
              </Stack>
            </Row>
            <Button
              size="sm"
              variant="outline"
              iconStart={X}
              onPress={() => handleFileRemove('cover_letter')}
              disabled={isSubmitting || uploading.cover_letter}
            />
          </Row>
        ) : uploading.cover_letter ? (
          <Stack gap={8}>
            <Stack
              padding="xl"
              borderRadius={16}
              borderWidth={2}
              style={{
                borderColor: colors.border[theme].info,
                backgroundColor: colors.bg[theme].info,
              }}
              align="center"
              gap={12}
            >
              <Upload size={32} style={{ color: colors.text[theme].info }} />
              <Stack gap={8} width="100%">
                <Text style={{ color: colors.text[theme].secondary }} textAlign="center">
                  Uploading...
                </Text>
                <Progress
                  value={uploadProgress.cover_letter || 0}
                  max={100}
                  style={{ backgroundColor: colors.bg[theme].primary }}
                >
                  <Progress.Indicator animation="bouncy" />
                </Progress>
                <Text style={{ color: colors.text[theme].secondary }} textAlign="center">
                  {uploadProgress.cover_letter || 0}%
                </Text>
              </Stack>
            </Stack>
          </Stack>
        ) : (
          <Stack gap={8}>
            <label htmlFor="cover-letter-upload">
              <Stack
                asChild
                padding="xl"
                borderRadius={16}
                borderWidth={2}
                style={{
                  borderColor: errors.cover_letter
                    ? colors.border[theme].error
                    : dragOverRefs.current.cover_letter
                      ? colors.border[theme].info
                      : colors.border[theme].default,
                  backgroundColor: dragOverRefs.current.cover_letter
                    ? colors.bg[theme].info
                    : colors.bg[theme].default,
                }}
                borderStyle="dashed"
                align="center"
                gap={12}
                cursor="pointer"
                hoverStyle={{
                  borderColor: colors.border[theme].info,
                  backgroundColor: colors.bg[theme].info,
                }}
              >
                <section
                  aria-label="Cover letter upload drop zone"
                  onDragOver={(e) => handleDragOver('cover_letter', e)}
                  onDragLeave={() => handleDragLeave('cover_letter')}
                  onDrop={(e) => handleDrop('cover_letter', e)}
                  style={{
                    width: '100%',
                    color: errors.cover_letter
                      ? colors.border[theme].error
                      : colors.border[theme].info,
                  }}
                >
                  <Upload size={32} />
                  <Stack gap={4} align="center">
                    <Text style={{ color: colors.text[theme].secondary }}>
                      Choose a file or drag it here
                    </Text>
                    <Text style={{ color: colors.text[theme].secondary }} textAlign="center">
                      PDF, DOC, or DOCX • Max 5MB
                    </Text>
                  </Stack>
                </section>
              </Stack>
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
              <Text style={{ color: colors.text[theme].error }}>{errors.cover_letter}</Text>
            )}
          </Stack>
        )}
      </Stack>

      {/* Portfolio Upload (Optional) */}
      <Stack gap={12}>
        <Row gap={8} align="center">
          <Text style={{ color: colors.text[theme].secondary }}>Portfolio / Work Samples</Text>
          <Text style={{ color: colors.text[theme].secondary }}>Optional</Text>
        </Row>

        {getAttachment('portfolio') ? (
          <Row
            padding="md"
            borderRadius={16}
            borderWidth={2}
            style={{
              borderColor: colors.border[theme].success,
              backgroundColor: colors.bg[theme].success,
            }}
            justify="space-between"
            align="center"
            gap={12}
          >
            <Row gap={12} align="center" flex={1}>
              <CheckCircle2 size={24} style={{ color: colors.text[theme].success }} />
              <Stack flex={1}>
                <Text style={{ color: colors.text[theme].secondary }}>
                  {getAttachment('portfolio')?.filename}
                </Text>
                <Text style={{ color: colors.text[theme].secondary }}>
                  {formatFileSize(getAttachment('portfolio')?.size ?? 0)}
                </Text>
              </Stack>
            </Row>
            <Button
              size="sm"
              variant="outline"
              iconStart={X}
              onPress={() => handleFileRemove('portfolio')}
              disabled={isSubmitting || uploading.portfolio}
            />
          </Row>
        ) : uploading.portfolio ? (
          <Stack gap={8}>
            <Stack
              padding="xl"
              borderRadius={16}
              borderWidth={2}
              style={{
                borderColor: colors.border[theme].info,
                backgroundColor: colors.bg[theme].info,
              }}
              align="center"
              gap={12}
            >
              <Upload size={32} style={{ color: colors.text[theme].info }} />
              <Stack gap={8} width="100%">
                <Text style={{ color: colors.text[theme].secondary }} textAlign="center">
                  Uploading...
                </Text>
                <Progress
                  value={uploadProgress.portfolio || 0}
                  max={100}
                  style={{ backgroundColor: colors.bg[theme].primary }}
                >
                  <Progress.Indicator animation="bouncy" />
                </Progress>
                <Text style={{ color: colors.text[theme].secondary }} textAlign="center">
                  {uploadProgress.portfolio || 0}%
                </Text>
              </Stack>
            </Stack>
          </Stack>
        ) : (
          <Stack gap={8}>
            <label htmlFor="portfolio-upload">
              <Stack
                asChild
                padding="xl"
                borderRadius={16}
                borderWidth={2}
                style={{
                  borderColor: errors.portfolio
                    ? colors.border[theme].error
                    : dragOverRefs.current.portfolio
                      ? colors.border[theme].info
                      : colors.border[theme].default,
                  backgroundColor: dragOverRefs.current.portfolio
                    ? colors.bg[theme].info
                    : colors.bg[theme].default,
                }}
                borderStyle="dashed"
                align="center"
                gap={12}
                cursor="pointer"
                hoverStyle={{
                  borderColor: colors.border[theme].info,
                  backgroundColor: colors.bg[theme].info,
                }}
              >
                <section
                  aria-label="Portfolio upload drop zone"
                  onDragOver={(e) => handleDragOver('portfolio', e)}
                  onDragLeave={() => handleDragLeave('portfolio')}
                  onDrop={(e) => handleDrop('portfolio', e)}
                  style={{
                    width: '100%',
                    color: errors.portfolio
                      ? colors.border[theme].error
                      : colors.border[theme].info,
                  }}
                >
                  <Upload size={32} />
                  <Stack gap={4} align="center">
                    <Text style={{ color: colors.text[theme].secondary }}>
                      Choose a file or drag it here
                    </Text>
                    <Text style={{ color: colors.text[theme].secondary }} textAlign="center">
                      PDF, DOC, or DOCX • Max 5MB
                    </Text>
                  </Stack>
                </section>
              </Stack>
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
              <Text style={{ color: colors.text[theme].error }}>{errors.portfolio}</Text>
            )}
          </Stack>
        )}
      </Stack>

      {/* Info Box */}
      <Stack
        padding="md"
        borderRadius={16}
        style={{ backgroundColor: colors.bg[theme].info, borderColor: colors.border[theme].subtle }}
        borderWidth={1}
      >
        <Text style={{ color: colors.text[theme].info }}>
          💡 Tip: Make sure your documents are up-to-date and clearly showcase your relevant
          experience and skills for this position.
        </Text>
      </Stack>

      {/* Navigation Buttons */}
      <Row gap={12} justify="space-between" marginTop={16}>
        <Button
          size="md"
          variant="outline"
          iconStart={ArrowLeft}
          onPress={onPrevious}
          disabled={isSubmitting || Object.values(uploading).some((v) => v)}
        >
          Previous
        </Button>
        <Button
          size="md"
          theme="info"
          onPress={validateAndContinue}
          disabled={isSubmitting || Object.values(uploading).some((v) => v)}
        >
          {isSubmitting ? 'Saving...' : 'Continue to Review'}
        </Button>
      </Row>
    </Stack>
  )
}
