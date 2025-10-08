import { useState } from 'react'
import { Button, Input, Label, Switch, Text, XStack, YStack } from 'tamagui'
import type { ScreeningAnswers } from '@app/schemas'

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
}: ScreeningStepProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof ScreeningAnswers, string>>>({})

  /**
   * Validate all fields before continuing
   */
  const validateAndContinue = () => {
    const newErrors: Partial<Record<keyof ScreeningAnswers, string>> = {}

    // Validate current location
    if (!answers.current_location?.trim()) {
      newErrors.current_location = 'Please enter your current location'
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
          Current Location
        </Label>
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
        {errors.current_location && (
          <Text fontSize="$2" color="$red10">
            {errors.current_location}
          </Text>
        )}
      </YStack>

      {/* Willing to Relocate */}
      <YStack gap="$2">
        <Label fontSize="$4" fontWeight="600">
          Are you willing to relocate for this position?
        </Label>
        <XStack gap="$4" items="center">
          <Switch
            checked={answers.willing_to_relocate || false}
            onCheckedChange={(checked) => {
              onAnswersChange({ ...answers, willing_to_relocate: checked })
            }}
            disabled={isSubmitting}
          >
            <Switch.Thumb animation="quick" />
          </Switch>
          <Text fontSize="$3" color="$color11">
            {answers.willing_to_relocate
              ? 'Yes, I am willing to relocate'
              : 'No, I prefer to stay in my current location'}
          </Text>
        </XStack>
      </YStack>

      {/* Years of Experience */}
      <YStack gap="$2">
        <Label htmlFor="years_experience" fontSize="$4" fontWeight="600">
          Years of Relevant Experience
        </Label>
        <Input
          id="years_experience"
          placeholder="0"
          inputMode="numeric"
          value={answers.years_experience?.toString() || ''}
          onChangeText={(text) => {
            const value = Number.parseInt(text, 10)
            onAnswersChange({
              ...answers,
              years_experience: Number.isNaN(value) ? 0 : value,
            })
            if (errors.years_experience) {
              setErrors({ ...errors, years_experience: undefined })
            }
          }}
          borderColor={errors.years_experience ? '$red9' : '$borderColor'}
          disabled={isSubmitting}
        />
        {errors.years_experience && (
          <Text fontSize="$2" color="$red10">
            {errors.years_experience}
          </Text>
        )}
        <Text fontSize="$2" color="$color10">
          Include all relevant work experience, including internships and part-time roles
        </Text>
      </YStack>

      {/* Work Authorization */}
      <YStack gap="$2">
        <Label fontSize="$4" fontWeight="600">
          Are you legally authorized to work in the United States?
        </Label>
        <XStack gap="$4" items="center">
          <Switch
            checked={answers.is_authorized_to_work || false}
            onCheckedChange={(checked) => {
              onAnswersChange({ ...answers, is_authorized_to_work: checked })
              if (errors.is_authorized_to_work) {
                setErrors({ ...errors, is_authorized_to_work: undefined })
              }
            }}
            disabled={isSubmitting}
          >
            <Switch.Thumb animation="quick" />
          </Switch>
          <Text fontSize="$3" color="$color11">
            {answers.is_authorized_to_work
              ? 'Yes, I am authorized to work'
              : 'No, I will require sponsorship'}
          </Text>
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
          Earliest Start Date
        </Label>
        <YStack gap="$2">
          {['Immediately', 'Within 2 weeks', 'Within 1 month', '1-3 months', '3+ months'].map(
            (option) => (
              <XStack
                key={option}
                gap="$3"
                items="center"
                p="$3"
                rounded="$4"
                borderWidth={1}
                borderColor={answers.earliest_start_date === option ? '$blue9' : '$borderColor'}
                bg={answers.earliest_start_date === option ? '$blue2' : '$background'}
                pressStyle={{ scale: 0.98 }}
                onPress={() => {
                  onAnswersChange({ ...answers, earliest_start_date: option })
                  if (errors.earliest_start_date) {
                    setErrors({ ...errors, earliest_start_date: undefined })
                  }
                }}
                cursor="pointer"
                disabled={isSubmitting}
              >
                <YStack
                  width={20}
                  height={20}
                  rounded="$12"
                  borderWidth={2}
                  borderColor={answers.earliest_start_date === option ? '$blue9' : '$borderColor'}
                  justify="center"
                  items="center"
                  bg="$background"
                >
                  {answers.earliest_start_date === option && (
                    <YStack width={12} height={12} rounded="$12" bg="$blue9" />
                  )}
                </YStack>
                <Text fontSize="$3" color="$color12">
                  {option}
                </Text>
              </XStack>
            )
          )}
        </YStack>
        {errors.earliest_start_date && (
          <Text fontSize="$2" color="$red10">
            {errors.earliest_start_date}
          </Text>
        )}
      </YStack>

      {/* Continue Button */}
      <Button
        size="$5"
        theme="blue"
        onPress={validateAndContinue}
        disabled={isSubmitting}
        marginTop="$4"
      >
        {isSubmitting ? 'Saving...' : 'Continue'}
      </Button>
    </YStack>
  )
}
