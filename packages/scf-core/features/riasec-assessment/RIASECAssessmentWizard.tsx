import { AssessmentWizard, useAssessmentSave, toError } from '@scf/core/features/assessments'
import { RiasecQuickAssessment } from '@scf/core/features/career-assessment/components/RiasecQuickAssessment'
import {
  careerAssessmentDefaults,
  type RiasecScores,
} from '@scf/core/features/career-assessment/config/career-assessment-schema'
import { useRIASECStatus, useSaveCareerAssessmentMutation } from '@scf/core/utils/onet-sdk-hooks'
import { DashboardLayout } from '@scf/core/components/layouts'
import { useRouteScreenTitle } from '@scf/core/hooks/useRouteScreenTitle'
import { AssessmentHeader, AssessmentProgressBar, Card, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useEffect, useMemo, useState } from 'react'
import { Button, Text, Row, Stack } from '@scaffald/ui'
import { Clock, Compass, Target, Zap } from 'lucide-react-native'

const RIASEC_DIMENSIONS = [
  { key: 'R', name: 'Realistic', description: 'Hands-on, practical activities' },
  { key: 'I', name: 'Investigative', description: 'Analytical, intellectual pursuits' },
  { key: 'A', name: 'Artistic', description: 'Creative, expressive work' },
  { key: 'S', name: 'Social', description: 'Helping and teaching others' },
  { key: 'E', name: 'Enterprising', description: 'Leading and persuading' },
  { key: 'C', name: 'Conventional', description: 'Organizing and processing data' },
]

/**
 * RIASECAssessmentWizard - Two-column Pulse-style wizard for RIASEC Career Interests
 */
export function RIASECAssessmentWizard() {
  const { theme } = useThemeContext()
  const { title: routeTitle } = useRouteScreenTitle()
  const { data: status, isLoading, error } = useRIASECStatus()
  const [scores, setScores] = useState<RiasecScores>(careerAssessmentDefaults.riasec_scores)

  useEffect(() => {
    if (status?.scores) {
      setScores(status.scores as RiasecScores)
    }
  }, [status])

  const saveMutation = useAssessmentSave({
    queryKeys: [['scaffald', 'onet', 'riasec', 'status']],
    successTitle: 'Assessment Complete',
    successMessage: 'Your career interests have been saved!',
    useMutation: useSaveCareerAssessmentMutation,
  })

  const handleComplete = () => {
    saveMutation.mutate({ riasec_scores: scores })
  }

  const allRated = Object.values(scores).every(
    (score) => typeof score === 'number' && score >= 1 && score <= 5
  )

  const ratedCount = Object.values(scores).filter(
    (score) => typeof score === 'number' && score >= 1 && score <= 5
  ).length
  const completionScore = status?.isCompleted ? 100 : Math.round((ratedCount / 6) * 100)

  const wizardContent = (
    <AssessmentWizard
      steps={[{ id: 'interests', label: 'Interest Rating', order: 1 }]}
      currentStep="interests"
      completionScore={completionScore}
      isLoading={isLoading}
      error={toError(error)}
      showNext={false}
      showHeader={false}
    >
      <Stack padding="md" paddingBottom="xs">
        <AssessmentProgressBar value={completionScore} height={4} />
      </Stack>

      <Stack gap={28} maxWidth={800} width="100%" padding="md" style={{ marginHorizontal: 'auto' }}>
        <RiasecQuickAssessment
          value={scores}
          onChange={setScores}
          disabled={saveMutation.isPending}
        />

        <Button
          size="lg"
          variant="filled"
          color="primary"
          onPress={handleComplete}
          disabled={!allRated || saveMutation.isPending}
        >
          Complete Assessment
        </Button>
      </Stack>
    </AssessmentWizard>
  )

  const railContent = (
    <Stack gap={20} padding="xs">
      <Stack gap={4}>
        <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>
          Career Interests
        </Text>
        <Text style={{ fontSize: 13, color: colors.text[theme].secondary, lineHeight: 20 }}>
          The RIASEC model maps your interests across six career dimensions to find your best fit.
        </Text>
      </Stack>

      {/* Dimensions guide */}
      <Card variant="outlined" padding="md" radius="xl">
        <Stack gap={12}>
          <Text style={{ fontWeight: '600', fontSize: 14, color: colors.text[theme].primary }}>
            Dimensions
          </Text>
          {RIASEC_DIMENSIONS.map((dim) => (
            <Stack key={dim.key} gap={2}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text[theme].primary }}>
                {dim.key} — {dim.name}
              </Text>
              <Text style={{ fontSize: 12, color: colors.text[theme].tertiary }}>
                {dim.description}
              </Text>
            </Stack>
          ))}
        </Stack>
      </Card>

      {/* Progress */}
      <Card variant="outlined" padding="md" radius="xl">
        <Stack gap={12}>
          <Text style={{ fontWeight: '600', fontSize: 14, color: colors.text[theme].primary }}>
            Progress
          </Text>
          <AssessmentProgressBar value={completionScore} height={6} />
          <Text style={{ fontSize: 13, color: colors.text[theme].secondary }}>
            {ratedCount} of 6 dimensions rated
          </Text>
        </Stack>
      </Card>
    </Stack>
  )

  return (
    <DashboardLayout
      leftContent={wizardContent}
      rightContent={railContent}
      breadcrumbItems={[
        { label: 'Assessments', href: '/assessments' },
        { label: 'Career Interests (RIASEC)' },
      ]}
      screenKicker="Assessment"
      screenTitle={routeTitle}
      screenTip="Rate six dimensions to see the kind of work that suits you, matched to real occupations."
    />
  )
}
