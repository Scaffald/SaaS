import {
  useCareerAssessmentStatus,
  useSaveCareerAssessmentMutation,
} from '@scf/core/utils/onet-sdk-hooks'
import { Button, DashboardWidget, spacing } from '@scaffald/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@scaffald/ui'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Separator, Spinner, Text, Row, Stack } from '@scaffald/ui'
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
  const toast = useToast()

  // Check assessment status
  const {
    data: statusData,
    isLoading: isCheckingStatus,
    refetch: refetchStatus,
  } = useCareerAssessmentStatus()

  // Save assessment mutation
  const saveMutation = useSaveCareerAssessmentMutation({
    onSuccess: () => {
      toast.show({
        title: 'Career Assessment Complete',
        message: 'Your career interests have been saved successfully!',
        variant: 'success',
      })
      refetchStatus()
    },
    onError: (error: { message?: string }) => {
      console.error('Error saving career assessment:', error)
      toast.show({
        title: 'Error',
        message: error.message || 'Failed to save assessment. Please try again.',
        variant: 'error',
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
        <Stack gap={spacing.sm} align="center" paddingVertical={spacing['2xl']}>
          <Spinner size="lg" color="$blue7" />
          <Text color="$gray11">Loading...</Text>
        </Stack>
      </DashboardWidget>
    )
  }

  // Hide widget if assessment is complete
  if (statusData?.hasCompleted) {
    return null
  }

  return (
    <DashboardWidget>
      <Stack gap={spacing.md}>
        <Stack gap={spacing.xs}>
          <Text color="$gray11">Career Assessment</Text>
          <Text color="$gray11">
            Take a quick assessment to help us recommend jobs that match your interests and skills
          </Text>
        </Stack>

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
        <Stack gap={12}>
          <Stack gap={4}>
            <Text>Current Occupation (Optional)</Text>
            <Text color="$gray11">What is your current or most recent job?</Text>
          </Stack>
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
            <Text color="$red10">{errors.current_occupation_code.message}</Text>
          )}
        </Stack>

        {/* Submit Button */}
        <Button
          variant="primary"
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          opacity={isSubmitting ? 0.5 : 1}
          size="lg"
          marginTop={spacing.xs}
        >
          {isSubmitting ? (
            <Row gap={spacing.xs} align="center">
              <Spinner size="sm" color="white" />
              <Button.Text>Saving Assessment...</Button.Text>
            </Row>
          ) : (
            <Button.Text>Complete Assessment</Button.Text>
          )}
        </Button>

        <Text color="$gray11">
          This assessment takes about 2 minutes and helps us recommend careers that fit your
          interests
        </Text>
      </Stack>
    </DashboardWidget>
  )
}
