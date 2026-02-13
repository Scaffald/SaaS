import type { ScreeningAnswers } from '@scf/schemas'
import type { AddressResult } from '@unicornlove/beyond-ui'
import { AddressAutocomplete, ResponsiveSelect, useThemeContext } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Button, Input, Label, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

const EARLIEST_START_DATE_OPTIONS = [
  { label: 'Immediately', value: 'Immediately' },
  { label: 'Within 2 weeks', value: 'Within 2 weeks' },
  { label: 'Within 1 month', value: 'Within 1 month' },
  { label: '1-3 months', value: '1-3 months' },
  { label: '3+ months', value: '3+ months' },
]

const YEARS_EXPERIENCE_OPTIONS = [
  { label: '0-1 years', value: '0-1' },
  { label: '1-3 years', value: '1-3' },
  { label: '3-5 years', value: '3-5' },
  { label: '5+ years', value: '5+' },
]

export interface ScreeningStepProps {
  /**
   * Current screening answers
   */
  answers: Partial<ScreeningAnswers>

  /**
   * Callback when answers change
   */
  onAnswersChange: (answers: Partial<ScreeningAnswers>) => void

  /**
   * Callback when continuing to next step
   */
  onContinue: () => void

  /**
   * Whether the form is being submitted
   */
  isSubmitting?: boolean

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
 * ScreeningStep - Collects basic screening information from applicants
 *
 * Captures:
 * - Current location
 * - Willingness to relocate
 * - Years of experience
 * - Work authorization
 * - Earliest start date
 */
export function ScreeningStep({
  answers,
  onAnswersChange,
  onContinue,
  isSubmitting = false,
  requiredSkills = [],
  optionalSkills = [],
}: ScreeningStepProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof ScreeningAnswers, string>>>({})
  const { theme } = useThemeContext()
  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN

  /**
   * Validate all fields before continuing
   */
  const validateAndContinue = () => {
    const newErrors: Partial<Record<keyof ScreeningAnswers, string>> = {}

    // Validate current location
    if (!answers.current_location || !answers.current_location.trim()) {
      newErrors.current_location = 'Current location is required'
    }

    // Validate years of experience
    if (answers.years_experience === undefined || answers.years_experience === null) {
      newErrors.years_experience = 'Please enter your years of experience'
    } else if (answers.years_experience < 0) {
      newErrors.years_experience = 'Years of experience must be 0 or greater'
    } else if (answers.years_experience > 50) {
      newErrors.years_experience = 'Please enter a valid number of years'
    }

    // Validate work authorization
    if (answers.is_authorized_to_work === undefined || answers.is_authorized_to_work === null) {
      newErrors.is_authorized_to_work = 'Please indicate your work authorization status'
    }

    // Validate earliest start date
    if (!answers.earliest_start_date?.trim()) {
      newErrors.earliest_start_date = 'Please select your earliest start date'
    }

    setErrors(newErrors)

    // If no errors, continue
    if (Object.keys(newErrors).length === 0) {
      onContinue()
    }
  }

  return (
    <Stack gap={24} width="100%" maxWidth={600} padding="md">
      {/* Header */}
      <Stack gap={8}>
        <Text style={{ color: colors.text[theme].secondary }}>Basic Information</Text>
        <Text style={{ color: colors.text[theme].secondary }}>
          Please provide some basic information to help us match you with this position.
        </Text>
      </Stack>

      {/* Current Location */}
      <Stack gap={8}>
        <Label htmlFor="current_location">
          Your current location <Text style={{ color: colors.text[theme].error }}>*</Text>
        </Label>
        {mapboxToken ? (
          <AddressAutocomplete
            value={answers.current_location || ''}
            onChange={(text) => {
              onAnswersChange({ ...answers, current_location: text })
              if (errors.current_location) {
                setErrors({ ...errors, current_location: undefined })
              }
            }}
            onAddressSelect={(address: AddressResult) => {
              onAnswersChange({ ...answers, current_location: address.formattedAddress })
              if (errors.current_location) {
                setErrors({ ...errors, current_location: undefined })
              }
            }}
            placeholder="Search locations"
            provider="mapbox"
            apiKey={mapboxToken}
            zoomLevel="city"
            error={errors.current_location}
            disabled={isSubmitting}
          />
        ) : (
          <Input
            id="current_location"
            placeholder="City, State"
            value={answers.current_location || ''}
            onChangeText={(text) => {
              onAnswersChange({ ...answers, current_location: text })
              if (errors.current_location) {
                setErrors({ ...errors, current_location: undefined })
              }
            }}
            style={{
              borderColor: errors.current_location
                ? colors.border[theme].error
                : colors.border[theme].default,
            }}
            disabled={isSubmitting}
          />
        )}
        {errors.current_location && (
          <Text style={{ color: colors.text[theme].error }}>{errors.current_location}</Text>
        )}
      </Stack>

      {/* Willing to Relocate */}
      <Stack gap={8}>
        <Label>
          Are you willing to relocate? <Text style={{ color: colors.text[theme].error }}>*</Text>
        </Label>
        <Row gap={12}>
          <Button
            flex={1}
            size="md"
            theme={answers.willing_to_relocate ? 'info' : undefined}
            variant={answers.willing_to_relocate ? undefined : 'outlined'}
            onPress={() => {
              onAnswersChange({ ...answers, willing_to_relocate: true })
            }}
            disabled={isSubmitting}
          >
            Yes
          </Button>
          <Button
            flex={1}
            size="md"
            theme={!answers.willing_to_relocate ? 'info' : undefined}
            variant={!answers.willing_to_relocate ? undefined : 'outlined'}
            onPress={() => {
              onAnswersChange({ ...answers, willing_to_relocate: false })
            }}
            disabled={isSubmitting}
          >
            No
          </Button>
        </Row>
      </Stack>

      {/* Years of Experience */}
      <Stack gap={8}>
        <Label htmlFor="years_experience">
          Years of experience <Text style={{ color: colors.text[theme].error }}>*</Text>
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
            style: {
              borderColor: errors.years_experience
                ? colors.border[theme].error
                : colors.border[theme].default,
            },
          }}
        />
        {errors.years_experience && (
          <Text style={{ color: colors.text[theme].error }}>{errors.years_experience}</Text>
        )}
        <Text style={{ color: colors.text[theme].secondary }}>
          Include all relevant work experience, including internships and part-time roles
        </Text>
      </Stack>

      {/* Required Skills (Display Only) */}
      {requiredSkills.length > 0 && (
        <Stack gap={8}>
          <Label>Required skills</Label>
          <Stack
            padding="sm"
            style={{ backgroundColor: colors.bg[theme].muted }}
            borderRadius={12}
            borderWidth={1}
            style={{ borderColor: colors.border[theme].default }}
          >
            <Text style={{ color: colors.text[theme].secondary }}>{requiredSkills.join(', ')}</Text>
          </Stack>
        </Stack>
      )}

      {/* Optional Skills (Display Only) */}
      {optionalSkills.length > 0 && (
        <Stack gap={8}>
          <Label>Optional skills</Label>
          <Stack
            padding="sm"
            style={{ backgroundColor: colors.bg[theme].muted }}
            borderRadius={12}
            borderWidth={1}
            style={{ borderColor: colors.border[theme].default }}
          >
            <Text style={{ color: colors.text[theme].secondary }}>{optionalSkills.join(', ')}</Text>
          </Stack>
        </Stack>
      )}

      {/* Work Authorization */}
      <Stack gap={8}>
        <Label>
          Are you authorized to work legally in the US?{' '}
          <Text style={{ color: colors.text[theme].error }}>*</Text>
        </Label>
        <Row gap={12}>
          <Button
            flex={1}
            size="md"
            theme={answers.is_authorized_to_work ? 'info' : undefined}
            variant={answers.is_authorized_to_work ? undefined : 'outlined'}
            onPress={() => {
              onAnswersChange({ ...answers, is_authorized_to_work: true })
              if (errors.is_authorized_to_work) {
                setErrors({ ...errors, is_authorized_to_work: undefined })
              }
            }}
            disabled={isSubmitting}
          >
            Yes
          </Button>
          <Button
            flex={1}
            size="md"
            theme={!answers.is_authorized_to_work ? 'info' : undefined}
            variant={!answers.is_authorized_to_work ? undefined : 'outlined'}
            onPress={() => {
              onAnswersChange({ ...answers, is_authorized_to_work: false })
              if (errors.is_authorized_to_work) {
                setErrors({ ...errors, is_authorized_to_work: undefined })
              }
            }}
            disabled={isSubmitting}
          >
            No
          </Button>
        </Row>
        {errors.is_authorized_to_work && (
          <Text style={{ color: colors.text[theme].error }}>{errors.is_authorized_to_work}</Text>
        )}
      </Stack>

      {/* Earliest Start Date */}
      <Stack gap={8}>
        <Label htmlFor="earliest_start_date">
          Earliest start date <Text style={{ color: colors.text[theme].error }}>*</Text>
        </Label>
        <ResponsiveSelect
          value={answers.earliest_start_date || ''}
          onValueChange={(value) => {
            onAnswersChange({ ...answers, earliest_start_date: value })
            if (errors.earliest_start_date) {
              setErrors({ ...errors, earliest_start_date: undefined })
            }
          }}
          placeholder="Select one"
          error={errors.earliest_start_date}
          options={EARLIEST_START_DATE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
      </Stack>

      {/* Continue Button */}
      <Button
        size="lg"
        theme="info"
        onPress={validateAndContinue}
        disabled={isSubmitting}
        marginTop={16}
      >
        {isSubmitting ? 'Saving...' : 'Continue'}
      </Button>
    </Stack>
  )

  /**
   * Get years experience value for Select dropdown
   */
  function getYearsExperienceValue() {
    if (answers.years_experience === undefined) return undefined
    if (answers.years_experience <= 1) return '0-1'
    if (answers.years_experience <= 3) return '1-3'
    if (answers.years_experience <= 5) return '3-5'
    return '5+'
  }

  /**
   * Handle years experience change from Select dropdown
   */
  function handleYearsExperienceChange(value: string) {
    // Convert string value to number for years_experience
    const numValue = value === '0-1' ? 0 : value === '1-3' ? 2 : value === '3-5' ? 4 : 5
    onAnswersChange({ ...answers, years_experience: numValue })
    if (errors.years_experience) {
      setErrors({ ...errors, years_experience: undefined })
    }
  }
}
