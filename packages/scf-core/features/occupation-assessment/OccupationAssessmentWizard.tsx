import { ROUTES } from '@scf/core/constants/routes'
import { AssessmentWizard } from '@scf/core/features/assessments'
import { OccupationSearch } from '@scf/core/features/career-assessment/components/OccupationSearch'
import {
  useOccupationStatus,
  useSaveCareerAssessmentMutation,
} from '@scf/core/utils/onet-sdk-hooks'
import { Plus, X } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Button, Text, Row, Stack } from '@scaffald/ui'

/**
 * OccupationAssessmentWizard - Standalone wizard for Occupation Preferences
 */
export function OccupationAssessmentWizard() {
  const router = useRouter()
  const toast = useToast()

  const { data: status, isLoading, error } = useOccupationStatus()
  const [currentOccupation, setCurrentOccupation] = useState<string>('')
  const [targetOccupations, setTargetOccupations] = useState<string[]>([])
  const queryClient = useQueryClient()

  // Load existing occupations when status is available
  useEffect(() => {
    if (status) {
      setCurrentOccupation(status.currentOccupationCode || '')
      setTargetOccupations(status.targetOccupationCodes || [])
    }
  }, [status])

  const saveMutation = useSaveCareerAssessmentMutation({
    onSuccess: () => {
      // Invalidate status queries to update drawer checkmarks
      queryClient.invalidateQueries({ queryKey: ['scaffald', 'onet', 'occupation', 'status'] })
      toast.show({
        title: 'Saved',
        message: 'Your occupation preferences have been saved!',
        variant: 'success',
      })
      router.push(ROUTES.DASHBOARD.path)
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Error',
        message: error.message || 'Failed to save preferences. Please try again.',
        variant: 'error',
      })
    },
  })

  const handleComplete = () => {
    saveMutation.mutate({
      riasec_scores: undefined, // Don't override existing RIASEC scores
      current_occupation_code: currentOccupation || undefined,
      target_occupation_codes: targetOccupations.length > 0 ? targetOccupations : undefined,
    })
  }

  const handleAddTarget = () => {
    setTargetOccupations([...targetOccupations, ''])
  }

  const handleRemoveTarget = (index: number) => {
    setTargetOccupations(targetOccupations.filter((_, i) => i !== index))
  }

  const handleTargetChange = (index: number, value: string) => {
    const updated = [...targetOccupations]
    updated[index] = value
    setTargetOccupations(updated)
  }

  // Check if user has any occupation selected (for future use)
  // const hasAnyOccupation = currentOccupation || targetOccupations.some((occ) => occ)

  return (
    <AssessmentWizard
      title="Occupation Preferences"
      description="Tell us about your current and target occupations (optional)."
      steps={[
        { id: 'current', label: 'Current Occupation', order: 1 },
        { id: 'targets', label: 'Target Occupations', order: 2 },
      ]}
      currentStep="current"
      completionScore={status?.isCompleted ? 100 : 0}
      isLoading={isLoading}
      error={error ? new Error(error.message ?? 'Failed to load assessment status.') : null}
      showNext={false}
    >
      <Stack gap={16} width="100%" maxWidth={800} marginHorizontal="auto">
        {/* Current Occupation */}
        <Stack gap={12}>
          <Stack gap={4}>
            <Text>Current Occupation (Optional)</Text>
            <Text color="$gray11">What is your current or most recent job?</Text>
          </Stack>
          <OccupationSearch
            value={currentOccupation}
            onChange={(code) => setCurrentOccupation(code)}
            placeholder="Search for your occupation..."
            disabled={saveMutation.isPending}
          />
        </Stack>

        {/* Target Occupations */}
        <Stack gap={12}>
          <Stack gap={4}>
            <Text>Target Occupations (Optional)</Text>
            <Text color="$gray11">What occupations are you interested in pursuing?</Text>
          </Stack>
          {targetOccupations.map((occupation, index) => (
            <Row key={`target-occupation-${index}-${occupation || 'empty'}`} gap={8} align="center">
              <Stack flex={1}>
                <OccupationSearch
                  value={occupation}
                  onChange={(code) => handleTargetChange(index, code)}
                  placeholder={`Target occupation ${index + 1}...`}
                  disabled={saveMutation.isPending}
                />
              </Stack>
              <Button
                size="sm"
                variant="outline"
                iconStart={X}
                onPress={() => handleRemoveTarget(index)}
                disabled={saveMutation.isPending}
              />
            </Row>
          ))}
          <Button
            size="md"
            variant="outline"
            iconStart={Plus}
            onPress={handleAddTarget}
            disabled={saveMutation.isPending}
          >
            Add Target Occupation
          </Button>
        </Stack>

        <Button size="lg" themeInverse onPress={handleComplete} disabled={saveMutation.isPending}>
          <Button.Text>Save Preferences</Button.Text>
        </Button>
      </Stack>
    </AssessmentWizard>
  )
}
