import { useCreateJobApplicationMutation } from '@scf/core/utils/jobs-sdk-hooks'
import { createMapboxGeocodingProvider } from '@scf/core/utils/mapbox-geocoding-provider'
import type { ScreeningAnswers } from '@scf/schemas'
import type { AddressResult } from '@scaffald/ui'
import {
  AddressAutocomplete,
  Modal,
  ModalContent,
  ModalHeader,
  ResponsiveSelect,
  useThemeContext,
} from '@scaffald/ui'
import { CheckCircle2 } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useCallback, useMemo, useState } from 'react'
import { ScrollView } from 'react-native'
import { Button, Label, Text, Row, Stack } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()

  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN
  const toast = useToast()
  const mapboxProvider = useMemo(
    () => (mapboxToken ? createMapboxGeocodingProvider(mapboxToken) : null),
    [mapboxToken]
  )

  const submitMutation = useCreateJobApplicationMutation({
    onSuccess: (application: { id: string }) => {
      setShowSuccess(true)
      toast.show({
        title: 'Application sent successfully',
        message: `Your application to ${jobTitle} has been submitted.`,
        variant: 'success',
      })
      onSuccess?.(application.id)
      // Close modal after 2 seconds
      setTimeout(() => {
        handleClose()
      }, 2000)
    },
    onError: (error: { message?: string }) => {
      const message = error.message || 'Failed to submit application. Please try again.'
      toast.show({
        title: 'Error',
        message,
        variant: 'error',
      })
      setIsSubmitting(false)
    },
  })

  const handleClose = useCallback(() => {
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
  }, [onOpenChange])

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
    <Modal visible={open} onClose={handleClose} width="90%">
      <ModalHeader
        title={`Apply to ${organizationName}`}
        description={jobTitle}
        onClose={handleClose}
      />
      <ModalContent>
        <Stack gap={16}>

          {/* Success State */}
          {showSuccess ? (
            <Stack gap={16} padding="xl" align="center" justify="center" flex={1}>
              <Stack
                width={80}
                height={80}
                borderRadius={16}
                style={{
                  backgroundColor: theme === "light" ? colors.green[50] : colors.green[900],
                  borderColor: theme === "light" ? colors.green[300] : colors.green[700],
                  borderWidth: 2,
                }}
                align="center"
                justify="center"
              >
                <CheckCircle2 size={48} color={theme === "light" ? colors.green[700] : colors.green[300]} />
              </Stack>
              <Stack gap={8} align="center">
                <Text style={{ color: colors.text[theme].secondary }} align="center">
                  Application Submitted!
                </Text>
                <Text style={{ color: colors.text[theme].secondary }} align="center">
                  Your application to {jobTitle} at {organizationName} has been sent successfully.
                </Text>
              </Stack>
            </Stack>
          ) : (
            /* Form Content */
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <Stack gap={16} padding="md">
                {/* Current Location */}
                <Stack gap={8}>
                  <Label htmlFor="current_location">
                    You current location <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>*</Text>
                  </Label>
                  {mapboxProvider ? (
                    <AddressAutocomplete
                      value={formData.current_location || ''}
                      onChange={handleLocationChange}
                      onAddressSelect={handleLocationSelect}
                      placeholder="Search locations"
                      provider={mapboxProvider}
                      searchOptions={{ zoomLevel: 'city' }}
                      error={errors.current_location}
                      disabled={isSubmitting}
                    />
                  ) : (
                    <Stack gap={8}>
                      <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>
                        Location search is unavailable. Please enter your location manually.
                      </Text>
                      <Text style={{ color: colors.text[theme].secondary }}>
                        Location search requires Mapbox API key configuration.
                      </Text>
                    </Stack>
                  )}
                  {errors.current_location && (
                    <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>
                      {errors.current_location}
                    </Text>
                  )}
                </Stack>

                {/* Willing to Relocate */}
                <Stack gap={8}>
                  <Label>
                    Are you willing to relocate?{' '}
                    <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>*</Text>
                  </Label>
                  <Row gap={12}>
                    <Button
                      size="md"
                      color={formData.willing_to_relocate ? 'primary' : undefined}
                      variant={formData.willing_to_relocate ? undefined : 'outline'}
                      onPress={() => {
                        setFormData((prev) => ({ ...prev, willing_to_relocate: true }))
                      }}
                      disabled={isSubmitting}
                      style={{ flex: 1 }}
                    >
                      Yes
                    </Button>
                    <Button
                      size="md"
                      color={!formData.willing_to_relocate ? 'primary' : undefined}
                      variant={!formData.willing_to_relocate ? undefined : 'outline'}
                      onPress={() => {
                        setFormData((prev) => ({ ...prev, willing_to_relocate: false }))
                      }}
                      disabled={isSubmitting}
                      style={{ flex: 1 }}
                    >
                      No
                    </Button>
                  </Row>
                </Stack>

                {/* Years of Experience */}
                <Stack gap={8}>
                  <Label htmlFor="years_experience">
                    Years of experience <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>*</Text>
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
                    testID="years_experience"
                  />
                </Stack>

                {/* Required Skills (Display Only) */}
                {requiredSkills.length > 0 && (
                  <Stack gap={8}>
                    <Label>Required skills</Label>
                    <Stack
                      padding="sm"
                      borderRadius={12}
                      style={{
                        backgroundColor: colors.bg[theme].muted,
                        borderColor: colors.border[theme].default,
                        borderWidth: 1,
                      }}
                    >
                      <Text style={{ color: colors.text[theme].secondary }}>
                        {requiredSkills.join(', ')}
                      </Text>
                    </Stack>
                  </Stack>
                )}

                {/* Optional Skills (Display Only) */}
                {optionalSkills.length > 0 && (
                  <Stack gap={8}>
                    <Label>Optional skills</Label>
                    <Stack
                      padding="sm"
                      borderRadius={12}
                      style={{
                        backgroundColor: colors.bg[theme].muted,
                        borderColor: colors.border[theme].default,
                        borderWidth: 1,
                      }}
                    >
                      <Text style={{ color: colors.text[theme].secondary }}>
                        {optionalSkills.join(', ')}
                      </Text>
                    </Stack>
                  </Stack>
                )}

                {/* Work Authorization */}
                <Stack gap={8}>
                  <Label>
                    Are you authorized to work legally in the US?{' '}
                    <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>*</Text>
                  </Label>
                  <Row gap={12}>
                    <Button
                      size="md"
                      color={formData.is_authorized_to_work ? 'primary' : undefined}
                      variant={formData.is_authorized_to_work ? undefined : 'outline'}
                      onPress={() => {
                        setFormData((prev) => ({ ...prev, is_authorized_to_work: true }))
                        validateField('is_authorized_to_work', true)
                      }}
                      disabled={isSubmitting}
                      style={{ flex: 1 }}
                    >
                      Yes
                    </Button>
                    <Button
                      size="md"
                      color={!formData.is_authorized_to_work ? 'primary' : undefined}
                      variant={!formData.is_authorized_to_work ? undefined : 'outline'}
                      onPress={() => {
                        setFormData((prev) => ({ ...prev, is_authorized_to_work: false }))
                        validateField('is_authorized_to_work', false)
                      }}
                      disabled={isSubmitting}
                      style={{ flex: 1 }}
                    >
                      No
                    </Button>
                  </Row>
                  {errors.is_authorized_to_work && (
                    <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>
                      {errors.is_authorized_to_work}
                    </Text>
                  )}
                </Stack>

                {/* Earliest Start Date */}
                <Stack gap={8}>
                  <Label htmlFor="earliest_start_date">
                    Earliest start date <Text style={{ color: theme === "light" ? colors.error[700] : colors.error[300] }}>*</Text>
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
                    testID="earliest_start_date"
                  />
                </Stack>
              </Stack>
            </ScrollView>
          )}

          {/* Footer */}
          {!showSuccess && (
            <Row
              gap={12}
              justify="flex-end"
              style={{
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: colors.border[theme].default,
              }}
            >
              <Button size="md" variant="outline" onPress={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                size="md"
                color="primary"
                onPress={handleSubmit}
                disabled={
                  isSubmitting || Object.values(errors).some((error) => error !== undefined)
                }
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </Row>
          )}
        </Stack>
      </ModalContent>
    </Modal>
  )
}
