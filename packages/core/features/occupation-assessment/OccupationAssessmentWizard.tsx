import { ROUTES } from '@app/core/constants/routes'
import { AssessmentWizard } from '@app/core/features/assessments'
import { OccupationSearch } from '@app/core/features/career-assessment/components/OccupationSearch'
import { api } from '@app/core/utils/api'
import { Plus, X } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Button, Text, XStack, YStack } from '@unicornlove/ui'

/**
 * OccupationAssessmentWizard - Standalone wizard for Occupation Preferences
 */
export function OccupationAssessmentWizard() {
  const router = useRouter()
  const toast = useToastController()

  const { data: status, isLoading, error } = api.onet.getOccupationStatus.useQuery()
  const [currentOccupation, setCurrentOccupation] = useState<string>('')
  const [targetOccupations, setTargetOccupations] = useState<string[]>([])
  const utils = api.useUtils()

  // Load existing occupations when status is available
  useEffect(() => {
    if (status) {
      setCurrentOccupation(status.currentOccupationCode || '')
      setTargetOccupations(status.targetOccupationCodes || [])
    }
  }, [status])

  const saveMutation = api.onet.saveCareerAssessment.useMutation({
    onSuccess: () => {
      // Invalidate status queries to update drawer checkmarks
      utils.onet.getOccupationStatus.invalidate()
      toast.show('Saved', {
        message: 'Your occupation preferences have been saved!',
      })
      router.push(ROUTES.DASHBOARD.path)
    },
    onError: (error: { message?: string }) => {
      toast.show('Error', {
        message: error.message || 'Failed to save preferences. Please try again.',
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
      <YStack gap="$4" width="100%" maxWidth={800} marginHorizontal="auto">
        {/* Current Occupation */}
        <YStack gap="$3">
          <YStack gap="$1">
            <Text fontSize="$5" fontWeight="600">
              Current Occupation (Optional)
            </Text>
            <Text fontSize="$3" color="$color11">
              What is your current or most recent job?
            </Text>
          </YStack>
          <OccupationSearch
            value={currentOccupation}
            onChange={(code) => setCurrentOccupation(code)}
            placeholder="Search for your occupation..."
            disabled={saveMutation.isPending}
          />
        </YStack>

        {/* Target Occupations */}
        <YStack gap="$3">
          <YStack gap="$1">
            <Text fontSize="$5" fontWeight="600">
              Target Occupations (Optional)
            </Text>
            <Text fontSize="$3" color="$color11">
              What occupations are you interested in pursuing?
            </Text>
          </YStack>
          {targetOccupations.map((occupation, index) => (
            <XStack
              key={`target-occupation-${index}-${occupation || 'empty'}`}
              gap="$2"
              alignItems="center"
            >
              <YStack flex={1}>
                <OccupationSearch
                  value={occupation}
                  onChange={(code) => handleTargetChange(index, code)}
                  placeholder={`Target occupation ${index + 1}...`}
                  disabled={saveMutation.isPending}
                />
              </YStack>
              <Button
                size="$3"
                variant="outlined"
                icon={X}
                onPress={() => handleRemoveTarget(index)}
                disabled={saveMutation.isPending}
              />
            </XStack>
          ))}
          <Button
            size="$4"
            variant="outlined"
            icon={Plus}
            onPress={handleAddTarget}
            disabled={saveMutation.isPending}
          >
            Add Target Occupation
          </Button>
        </YStack>

        <Button size="$5" themeInverse onPress={handleComplete} disabled={saveMutation.isPending}>
          <Button.Text>Save Preferences</Button.Text>
        </Button>
      </YStack>
    </AssessmentWizard>
  )
}
