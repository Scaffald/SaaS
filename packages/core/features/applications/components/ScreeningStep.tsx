import { useState } from 'react'
import { Button, Input, Label, Text, XStack, YStack, Select, Adapt, Sheet } from 'tamagui'
import { Check } from '@tamagui/lucide-icons'
import type { ScreeningAnswers } from '@app/schemas'
import { AddressAutocomplete } from '@app/ui'
import type { AddressResult } from '@app/ui'

const _EARLIEST_START_DATE_OPTIONS = [
  { label: 'Immediately', value: 'Immediately' },
  { label: 'Within 2 weeks', value: 'Within 2 weeks' },
  { label: 'Within 1 month', value: 'Within 1 month' },
  { label: '1-3 months', value: '1-3 months' },
  { label: '3+ months', value: '3+ months' },
]

const _YEARS_EXPERIENCE_OPTIONS = [
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
  // biome-ignore lint/correctness/noUnusedVariables: Used in conditional rendering below
  requiredSkills = [],
  // biome-ignore lint/correctness/noUnusedVariables: Used in conditional rendering below
  optionalSkills = [],
}: ScreeningStepProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof ScreeningAnswers, string>>>({})
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
    <YStack gap="$6" width="100%" maxW={600} p="$4">
      {/* Header */}
      <YStack gap="$2">
        <Text fontSize="$8" fontWeight="bold" color="$color12">
          Basic Information
        </Text>
        <Text fontSize="$4" color="$color11">
          Please provide some basic information to help us match you with this position.
        </Text>
      </YStack>

      {/* Current Location */}
      <YStack gap="$2">
        <Label htmlFor="current_location" fontSize="$4" fontWeight="600">
          Your current location <Text color="$red10">*</Text>
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
            borderColor={errors.current_location ? '$red9' : '$borderColor'}
            disabled={isSubmitting}
          />
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
            size="$4"
            theme={!answers.willing_to_relocate ? 'info' : undefined}
            variant={!answers.willing_to_relocate ? undefined : 'outlined'}
            onPress={() => {
              onAnswersChange({ ...answers, willing_to_relocate: false })
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
        <Select
          value={getYearsExperienceValue()}
          onValueChange={handleYearsExperienceChange}
        >
          <Select.Trigger
            id="years_experience"
            borderColor={errors.years_experience ? '$red9' : '$borderColor'}
          >
            <Select.Value placeholder="Select experience" />
          </Select.Trigger>
          <Adapt when="sm" platform="touch">
            <Sheet modal dismissOnSnapToBottom>
              <Sheet.Frame>
                <Sheet.ScrollView>
                  <Adapt.Contents />
                </Sheet.ScrollView>
              </Sheet.Frame>
              <Sheet.Overlay />
            </Sheet>
          </Adapt>
          <Select.Content zIndex={200000}>
            <Select.Viewport>
              {YEARS_EXPERIENCE_OPTIONS.map((option, index) => (
                <Select.Item key={option.value} value={option.value} index={index}>
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator marginLeft="auto">
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select>
        {errors.years_experience && (
          <Text fontSize="$2" color="$red10">
            {errors.years_experience}
          </Text>
        )}
        <Text fontSize="$2" color="$color10">
          Include all relevant work experience, including internships and part-time roles
        </Text>
      </YStack>

      {/* Required Skills (Display Only) */}
      {requiredSkills.length > 0 && (
        <YStack gap="$2">
          <Label fontSize="$4" fontWeight="600">
            Required skills
          </Label>
          <YStack
            p="$3"
            bg="$gray3"
            rounded="$3"
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
            p="$3"
            bg="$gray3"
            rounded="$3"
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
            size="$4"
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
        <Select
          value={answers.earliest_start_date}
          onValueChange={(value) => {
            onAnswersChange({ ...answers, earliest_start_date: value })
            if (errors.earliest_start_date) {
              setErrors({ ...errors, earliest_start_date: undefined })
            }
          }}
        >
          <Select.Trigger
            id="earliest_start_date"
            borderColor={errors.earliest_start_date ? '$red9' : '$borderColor'}
          >
            <Select.Value placeholder="Select one" />
          </Select.Trigger>
          <Adapt when="sm" platform="touch">
            <Sheet modal dismissOnSnapToBottom>
              <Sheet.Frame>
                <Sheet.ScrollView>
                  <Adapt.Contents />
                </Sheet.ScrollView>
              </Sheet.Frame>
              <Sheet.Overlay />
            </Sheet>
          </Adapt>
          <Select.Content zIndex={200000}>
            <Select.Viewport>
              {EARLIEST_START_DATE_OPTIONS.map((option, index) => (
                <Select.Item key={option.value} value={option.value} index={index}>
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator marginLeft="auto">
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select>
        {errors.earliest_start_date && (
          <Text fontSize="$2" color="$red10">
            {errors.earliest_start_date}
          </Text>
        )}
      </YStack>

      {/* Continue Button */}
      <Button size="$5" theme="info" onPress={validateAndContinue} disabled={isSubmitting} mt="$4">
        {isSubmitting ? 'Saving...' : 'Continue'}
      </Button>
    </YStack>
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
