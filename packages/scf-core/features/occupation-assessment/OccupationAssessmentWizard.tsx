import {
  AssessmentTakingLayout,
  AssessmentWizard,
  useAssessmentSave,
  toError,
} from '@scf/core/features/assessments'
import { OccupationSearch } from '@scf/core/features/career-assessment/components/OccupationSearch'
import {
  useOccupationStatus,
  useSaveCareerAssessmentMutation,
} from '@scf/core/utils/onet-sdk-hooks'
import { ROUTES } from '@scf/core/constants/routes'
import { Plus, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Button, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'

/**
 * OccupationAssessmentWizard — Occupation preferences.
 *
 * A focused single column while it is being filled in: no section tabs, no
 * rail, no title block (#1194). Nothing is saved until Save preferences, so
 * the way out says "Exit", not "Save & exit".
 */
export function OccupationAssessmentWizard() {
  const { theme } = useThemeContext()
  const router = useRouter()

  const { data: status, isLoading, error } = useOccupationStatus()
  const [currentOccupation, setCurrentOccupation] = useState<string>('')
  const [targetOccupations, setTargetOccupations] = useState<string[]>([])

  useEffect(() => {
    if (status) {
      const s = status as { currentOccupationCode?: string; targetOccupationCodes?: string[] }
      setCurrentOccupation(s.currentOccupationCode || '')
      setTargetOccupations(s.targetOccupationCodes || [])
    }
  }, [status])

  const saveMutation = useAssessmentSave({
    queryKeys: [['scaffald', 'onet', 'occupation', 'status']],
    successTitle: 'Saved',
    successMessage: 'Your occupation preferences have been saved!',
    useMutation: useSaveCareerAssessmentMutation,
    errorFallback: 'Failed to save preferences. Please try again.',
  })

  const handleComplete = () => {
    saveMutation.mutate({
      riasec_scores: undefined,
      selected_occupations:
        currentOccupation || targetOccupations.length > 0
          ? [currentOccupation, ...targetOccupations].filter(Boolean)
          : undefined,
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

  const wizardContent = (
    <AssessmentWizard
      steps={[
        { id: 'current', label: 'Current Occupation', order: 1 },
        { id: 'targets', label: 'Target Occupations', order: 2 },
      ]}
      currentStep="current"
      isLoading={isLoading}
      error={toError(error)}
      showNext={false}
      showHeader={false}
    >
      <Stack gap={28} width="100%">
        {/* Current Occupation */}
        <Stack gap={12}>
          <Stack gap={4}>
            <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>
              Current Occupation (Optional)
            </Text>
            <Text style={{ color: colors.text[theme].secondary }}>
              What is your current or most recent job?
            </Text>
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
            <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>
              Target Occupations (Optional)
            </Text>
            <Text style={{ color: colors.text[theme].secondary }}>
              What occupations are you interested in pursuing?
            </Text>
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
      </Stack>
    </AssessmentWizard>
  )

  return (
    <AssessmentTakingLayout
      kicker="Occupation preferences"
      instruction="The work you do now, and the work you want next. Both are optional."
      onExit={() => router.push(ROUTES.ASSESSMENTS.path)}
      exitLabel="Exit"
      footerEnd={
        <Button
          size="md"
          variant="filled"
          color="primary"
          onPress={handleComplete}
          disabled={saveMutation.isPending}
        >
          Save Preferences
        </Button>
      }
    >
      {wizardContent}
    </AssessmentTakingLayout>
  )
}
