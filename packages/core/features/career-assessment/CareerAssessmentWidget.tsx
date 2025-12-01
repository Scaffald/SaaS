import { api } from '@app/core/utils/api'
import { Button, DashboardWidget, spacing } from '@unicornlove/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToastController } from '@tamagui/toast'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Separator, Spinner, Text, XStack, YStack } from '@unicornlove/ui'
import { OccupationSearch } from './components/OccupationSearch'
import { RiasecQuickAssessment } from './components/RiasecQuickAssessment'
import {
  type CareerAssessmentFormData,
  careerAssessmentDefaults,
  careerAssessmentSchema,
} from './config/career-assessment-schema'

/**
 * CareerAssessmentWidget - Dashboard widget for career interest assessment
 *
 * Displays RIASEC career assessment form including:
 * - 6-dimension interest rating (RIASEC)
 * - Current occupation selection (optional)
 * - Target occupations (optional)
 *
 * @returns JSX element
 */
export function CareerAssessmentWidget() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToastController()

  // Check assessment status
  const {
    data: statusData,
    isLoading: isCheckingStatus,
    refetch: refetchStatus,
  } = api.onet.getCareerAssessmentStatus.useQuery()

  // Save assessment mutation
  const saveMutation = api.onet.saveCareerAssessment.useMutation({
    onSuccess: () => {
      toast.show('Career Assessment Complete', {
        message: 'Your career interests have been saved successfully!',
      })
      refetchStatus()
    },
    onError: (error: { message?: string }) => {
      console.error('Error saving career assessment:', error)
      toast.show('Error', {
        message: error.message || 'Failed to save assessment. Please try again.',
      })
    },
  })

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CareerAssessmentFormData>({
    resolver: zodResolver(careerAssessmentSchema),
    defaultValues: careerAssessmentDefaults,
    mode: 'onChange',
  })

  // Handle form submission
  const onSubmit = async (data: CareerAssessmentFormData) => {
    setIsSubmitting(true)
    try {
      await saveMutation.mutateAsync(data)
    } catch (error) {
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Don't show widget if already completed
  if (isCheckingStatus) {
    return (
      <DashboardWidget>
        <YStack gap={spacing.sm} alignItems="center" paddingVertical={spacing['2xl']}>
          <Spinner size="large" color="$blue7" />
          <Text color="$color11">Loading...</Text>
        </YStack>
      </DashboardWidget>
    )
  }

  // Hide widget if assessment is complete
  if (statusData?.hasCompleted) {
    return null
  }

  return (
    <DashboardWidget>
      <YStack gap={spacing.md}>
        <YStack gap={spacing.xs}>
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Career Assessment
          </Text>
          <Text fontSize="$3" color="$color11">
            Take a quick assessment to help us recommend jobs that match your interests and skills
          </Text>
        </YStack>

        <Separator />

        {/* RIASEC Assessment */}
        <Controller
          name="riasec_scores"
          control={control}
          render={({ field }) => (
            <RiasecQuickAssessment
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />

        <Separator />

        {/* Current Occupation (Optional) */}
        <YStack gap="$3">
          <YStack gap="$1">
            <Text fontWeight="600">Current Occupation (Optional)</Text>
            <Text fontSize="$2" color="$color11">
              What is your current or most recent job?
            </Text>
          </YStack>
          <Controller
            name="current_occupation_code"
            control={control}
            render={({ field }) => (
              <OccupationSearch
                value={field.value}
                onChange={(code) => field.onChange(code)}
                placeholder="Search for your occupation..."
                disabled={isSubmitting}
              />
            )}
          />
          {errors.current_occupation_code && (
            <Text color="$red10" fontSize="$2">
              {errors.current_occupation_code.message}
            </Text>
          )}
        </YStack>

        {/* Submit Button */}
        <Button
          variant="primary"
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          opacity={isSubmitting ? 0.5 : 1}
          size="$5"
          marginTop={spacing.xs}
        >
          {isSubmitting ? (
            <XStack gap={spacing.xs} alignItems="center">
              <Spinner size="small" color="white" />
              <Button.Text>Saving Assessment...</Button.Text>
            </XStack>
          ) : (
            <Button.Text>Complete Assessment</Button.Text>
          )}
        </Button>

        <Text fontSize="$2" color="$color11">
          This assessment takes about 2 minutes and helps us recommend careers that fit your
          interests
        </Text>
      </YStack>
    </DashboardWidget>
  )
}
