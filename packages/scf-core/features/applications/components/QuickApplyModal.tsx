import { api } from '@scf/core/utils/api'
import type { ScreeningAnswers } from '@scf/schemas'
import type { AddressResult } from '@unicornlove/ui'
import { AddressAutocomplete, Dialog, ResponsiveSelect } from '@unicornlove/ui'
import { CheckCircle2, X } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useState } from 'react'
import { Button, Label, ScrollView, Text, XStack, YStack } from '@unicornlove/ui'

export interface QuickApplyModalProps {
  /**
   * Job ID to apply for
   */
  jobId: string

  /**
   * Job title for display
   */
  jobTitle: string

  /**
   * Organization name for display
   */
  organizationName: string

  /**
   * Whether the modal is open
   */
  open: boolean

  /**
   * Callback when modal open state changes
   */
  onOpenChange: (open: boolean) => void

  /**
   * Callback when application is successfully submitted
   */
  onSuccess?: (applicationId: string) => void

  /**
   * Required skills from job (display only)
   */
  requiredSkills?: string[]

  /**
   * Optional/preferred skills from job (display only)
   */
  optionalSkills?: string[]
}

/**
 * QuickApplyModal - Simplified application flow for jobs with only screening questions
 *
 * Features:
 * - Single-step form with all screening questions
 * - No progress indicator (single step)
 * - No document uploads
 * - No review step
 * - Optimized for speed and mobile experience
 */
const YEARS_EXPERIENCE_OPTIONS = [
  { label: '0-1 years', value: '0-1' },
  { label: '1-3 years', value: '1-3' },
  { label: '3-5 years', value: '3-5' },
  { label: '5+ years', value: '5+' },
]

const EARLIEST_START_DATE_OPTIONS = [
  { label: 'Immediately', value: 'Immediately' },
  { label: 'Within 2 weeks', value: 'Within 2 weeks' },
  { label: 'Within 1 month', value: 'Within 1 month' },
  { label: '1-3 months', value: '1-3 months' },
  { label: '3+ months', value: '3+ months' },
]

export function QuickApplyModal({
  jobId,
  jobTitle,
  organizationName,
  open,
  onOpenChange,
  onSuccess,
  requiredSkills = [],
  optionalSkills = [],
}: QuickApplyModalProps) {
  const [formData, setFormData] = useState<Partial<ScreeningAnswers>>({
    current_location: '',
    willing_to_relocate: false,
    years_experience: undefined,
    is_authorized_to_work: false,
    earliest_start_date: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ScreeningAnswers, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN
  const toast = useToastController()

  const submitMutation = api.applications.submit.useMutation({
    onSuccess: (application: { id: string }) => {
      setShowSuccess(true)
      toast.show('Application sent successfully', {
        message: `Your application to ${jobTitle} has been submitted.`,
      })
      onSuccess?.(application.id)
      // Close modal after 2 seconds
      setTimeout(() => {
        handleClose()
      }, 2000)
    },
    onError: (error: { message?: string }) => {
      const message = error.message || 'Failed to submit application. Please try again.'
      toast.show('Error', {
        message,
      })
      setIsSubmitting(false)
    },
  })

  const handleClose = () => {
    setFormData({
      current_location: '',
      willing_to_relocate: false,
      years_experience: undefined,
      is_authorized_to_work: false,
      earliest_start_date: '',
    })
    setErrors({})
    setIsSubmitting(false)
    setShowSuccess(false)
    onOpenChange(false)
  }

  const validateField = (field: keyof ScreeningAnswers, value: unknown) => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors }

      switch (field) {
        case 'current_location':
          if (!value || (typeof value === 'string' && !value.trim())) {
            newErrors.current_location = 'Current location is required'
          } else {
            newErrors.current_location = undefined
          }
          break
        case 'years_experience':
          if (value === undefined || value === null) {
            newErrors.years_experience = 'Years of experience is required'
          } else {
            newErrors.years_experience = undefined
          }
          break
        case 'is_authorized_to_work':
          if (value === undefined || value === null) {
            newErrors.is_authorized_to_work = 'Work authorization status is required'
          } else {
            newErrors.is_authorized_to_work = undefined
          }
          break
        case 'earliest_start_date':
          if (!value || (typeof value === 'string' && !value.trim())) {
            newErrors.earliest_start_date = 'Earliest start date is required'
          } else {
            newErrors.earliest_start_date = undefined
          }
          break
      }

      return newErrors
    })
  }

  const handleLocationSelect = (address: AddressResult) => {
    setFormData((prev) => ({ ...prev, current_location: address.formattedAddress }))
    validateField('current_location', address.formattedAddress)
  }

  const handleLocationChange = (text: string) => {
    setFormData((prev) => ({ ...prev, current_location: text }))
    if (errors.current_location && text.trim()) {
      validateField('current_location', text)
    }
  }

  const handleYearsExperienceChange = (value: string) => {
    // Convert string value to number for years_experience
    const numValue = value === '0-1' ? 0 : value === '1-3' ? 2 : value === '3-5' ? 4 : 5
    setFormData((prev) => ({ ...prev, years_experience: numValue }))
    validateField('years_experience', numValue)
  }

  const handleEarliestStartDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, earliest_start_date: value }))
    validateField('earliest_start_date', value)
  }

  const handleSubmit = async () => {
    // Validate all fields first
    const validationErrors: Partial<Record<keyof ScreeningAnswers, string>> = {}

    if (!formData.current_location || !formData.current_location.trim()) {
      validationErrors.current_location = 'Current location is required'
    }
    if (formData.years_experience === undefined || formData.years_experience === null) {
      validationErrors.years_experience = 'Years of experience is required'
    }
    if (formData.is_authorized_to_work === undefined || formData.is_authorized_to_work === null) {
      validationErrors.is_authorized_to_work = 'Work authorization status is required'
    }
    if (!formData.earliest_start_date || !formData.earliest_start_date.trim()) {
      validationErrors.earliest_start_date = 'Earliest start date is required'
    }

    setErrors(validationErrors)

    // If there are validation errors, don't submit
    if (Object.values(validationErrors).some((error) => error !== undefined)) {
      return
    }

    // Submit application
    // At this point, all fields are validated and guaranteed to be present
    const currentLocation = formData.current_location || ''
    const yearsExperience = formData.years_experience ?? 0
    const isAuthorized = formData.is_authorized_to_work ?? false
    const earliestStartDate = formData.earliest_start_date || ''

    setIsSubmitting(true)
    try {
      await submitMutation.mutateAsync({
        job_id: jobId,
        current_location: currentLocation,
        willing_to_relocate: formData.willing_to_relocate || false,
        years_experience: yearsExperience,
        is_authorized_to_work: isAuthorized,
        earliest_start_date: earliestStartDate,
        screening_answers: {},
        custom_question_answers: [],
        attachments: {},
        completed_steps: [],
        is_complete: true,
      })
    } catch (error) {
      // Error handling is done in mutation onError
      console.error('Failed to submit application:', error)
    }
  }

  const getYearsExperienceValue = () => {
    if (formData.years_experience === undefined) return undefined
    if (formData.years_experience <= 1) return '0-1'
    if (formData.years_experience <= 3) return '1-3'
    if (formData.years_experience <= 5) return '3-5'
    return '5+'
  }

  return (
    <Dialog modal open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" />
        <Dialog.Content key="content" gap="$4" width="90%" maxWidth={600} maxHeight="90%">
          {/* Header */}
          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <YStack flex={1} gap="$1">
                <Text fontSize="$6" fontWeight="700" color="$color12">
                  Apply to {organizationName}
                </Text>
                <Text fontSize="$4" color="$color11">
                  {jobTitle}
                </Text>
              </YStack>
              <Dialog.Close asChild>
                <Button size="$3" circular icon={X} chromeless />
              </Dialog.Close>
            </XStack>
          </YStack>

          {/* Success State */}
          {showSuccess ? (
            <YStack gap="$4" padding="$6" alignItems="center" justifyContent="center" flex={1}>
              <YStack
                width={80}
                height={80}
                borderRadius="$12"
                backgroundColor="$green2"
                borderWidth={2}
                borderColor="$green9"
                alignItems="center"
                justifyContent="center"
              >
                <CheckCircle2 size={48} color="$green10" />
              </YStack>
              <YStack gap="$2" alignItems="center">
                <Text fontSize="$7" fontWeight="bold" color="$color12" textAlign="center">
                  Application Submitted!
                </Text>
                <Text fontSize="$4" color="$color11" textAlign="center">
                  Your application to {jobTitle} at {organizationName} has been sent successfully.
                </Text>
              </YStack>
            </YStack>
          ) : (
            /* Form Content */
            <ScrollView showsVerticalScrollIndicator={false} flex={1}>
              <YStack gap="$4" padding="$4">
                {/* Current Location */}
                <YStack gap="$2">
                  <Label htmlFor="current_location" fontSize="$4" fontWeight="600">
                    You current location <Text color="$red10">*</Text>
                  </Label>
                  {mapboxToken ? (
                    <AddressAutocomplete
                      value={formData.current_location || ''}
                      onChange={handleLocationChange}
                      onAddressSelect={handleLocationSelect}
                      placeholder="Search locations"
                      provider="mapbox"
                      apiKey={mapboxToken}
                      zoomLevel="city"
                      error={errors.current_location}
                      disabled={isSubmitting}
                    />
                  ) : (
                    <YStack gap="$2">
                      <Text fontSize="$3" color="$red10">
                        Location search is unavailable. Please enter your location manually.
                      </Text>
                      <Text fontSize="$2" color="$color10">
                        Location search requires Mapbox API key configuration.
                      </Text>
                    </YStack>
                  )}
                  {errors.current_location && (
                    <Text fontSize="$2" color="$red10">
                      {errors.current_location}
                    </Text>
                  )}
                </YStack>

                {/* Willing to Relocate */}
                <YStack gap="$2">
                  <Label fontSize="$4" fontWeight="600">
                    Are you willing to relocate? <Text color="$red10">*</Text>
                  </Label>
                  <XStack gap="$3">
                    <Button
                      flex={1}
                      size="$4"
                      theme={formData.willing_to_relocate ? 'info' : undefined}
                      variant={formData.willing_to_relocate ? undefined : 'outlined'}
                      onPress={() => {
                        setFormData((prev) => ({ ...prev, willing_to_relocate: true }))
                      }}
                      disabled={isSubmitting}
                    >
                      Yes
                    </Button>
                    <Button
                      flex={1}
                      size="$4"
                      theme={!formData.willing_to_relocate ? 'info' : undefined}
                      variant={!formData.willing_to_relocate ? undefined : 'outlined'}
                      onPress={() => {
                        setFormData((prev) => ({ ...prev, willing_to_relocate: false }))
                      }}
                      disabled={isSubmitting}
                    >
                      No
                    </Button>
                  </XStack>
                </YStack>

                {/* Years of Experience */}
                <YStack gap="$2">
                  <Label htmlFor="years_experience" fontSize="$4" fontWeight="600">
                    Years of experience <Text color="$red10">*</Text>
                  </Label>
                  <ResponsiveSelect
                    value={getYearsExperienceValue()}
                    onValueChange={handleYearsExperienceChange}
                    placeholder="Select experience"
                    error={errors.years_experience}
                    options={YEARS_EXPERIENCE_OPTIONS.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    triggerProps={{
                      id: 'years_experience',
                      borderColor: errors.years_experience ? '$red9' : '$borderColor',
                    }}
                  />
                </YStack>

                {/* Required Skills (Display Only) */}
                {requiredSkills.length > 0 && (
                  <YStack gap="$2">
                    <Label fontSize="$4" fontWeight="600">
                      Required skills
                    </Label>
                    <YStack
                      padding="$3"
                      backgroundColor="$gray3"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor="$borderColor"
                    >
                      <Text fontSize="$3" color="$color11">
                        {requiredSkills.join(', ')}
                      </Text>
                    </YStack>
                  </YStack>
                )}

                {/* Optional Skills (Display Only) */}
                {optionalSkills.length > 0 && (
                  <YStack gap="$2">
                    <Label fontSize="$4" fontWeight="600">
                      Optional skills
                    </Label>
                    <YStack
                      padding="$3"
                      backgroundColor="$gray3"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor="$borderColor"
                    >
                      <Text fontSize="$3" color="$color11">
                        {optionalSkills.join(', ')}
                      </Text>
                    </YStack>
                  </YStack>
                )}

                {/* Work Authorization */}
                <YStack gap="$2">
                  <Label fontSize="$4" fontWeight="600">
                    Are you authorized to work legally in the US? <Text color="$red10">*</Text>
                  </Label>
                  <XStack gap="$3">
                    <Button
                      flex={1}
                      size="$4"
                      theme={formData.is_authorized_to_work ? 'info' : undefined}
                      variant={formData.is_authorized_to_work ? undefined : 'outlined'}
                      onPress={() => {
                        setFormData((prev) => ({ ...prev, is_authorized_to_work: true }))
                        validateField('is_authorized_to_work', true)
                      }}
                      disabled={isSubmitting}
                    >
                      Yes
                    </Button>
                    <Button
                      flex={1}
                      size="$4"
                      theme={!formData.is_authorized_to_work ? 'info' : undefined}
                      variant={!formData.is_authorized_to_work ? undefined : 'outlined'}
                      onPress={() => {
                        setFormData((prev) => ({ ...prev, is_authorized_to_work: false }))
                        validateField('is_authorized_to_work', false)
                      }}
                      disabled={isSubmitting}
                    >
                      No
                    </Button>
                  </XStack>
                  {errors.is_authorized_to_work && (
                    <Text fontSize="$2" color="$red10">
                      {errors.is_authorized_to_work}
                    </Text>
                  )}
                </YStack>

                {/* Earliest Start Date */}
                <YStack gap="$2">
                  <Label htmlFor="earliest_start_date" fontSize="$4" fontWeight="600">
                    Earliest start date <Text color="$red10">*</Text>
                  </Label>
                  <ResponsiveSelect
                    value={formData.earliest_start_date || ''}
                    onValueChange={handleEarliestStartDateChange}
                    placeholder="Select one"
                    error={errors.earliest_start_date}
                    options={EARLIEST_START_DATE_OPTIONS.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    triggerProps={{
                      id: 'earliest_start_date',
                      borderColor: errors.earliest_start_date ? '$red9' : '$borderColor',
                    }}
                  />
                </YStack>
              </YStack>
            </ScrollView>
          )}

          {/* Footer */}
          {!showSuccess && (
            <XStack
              gap="$3"
              justifyContent="flex-end"
              paddingTop="$4"
              borderTopWidth={1}
              borderTopColor="$borderColor"
            >
              <Button size="$4" variant="outlined" onPress={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                size="$4"
                theme="info"
                onPress={handleSubmit}
                disabled={
                  isSubmitting || Object.values(errors).some((error) => error !== undefined)
                }
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </XStack>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
