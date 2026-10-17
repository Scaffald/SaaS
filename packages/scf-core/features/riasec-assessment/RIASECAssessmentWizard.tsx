import { AssessmentWizard, useAssessmentSave, toError } from '@scf/core/features/assessments'
import { RiasecQuickAssessment } from '@scf/core/features/career-assessment/components/RiasecQuickAssessment'
import { useRIASECStatus, useSaveCareerAssessmentMutation } from '@scf/core/utils/onet-sdk-hooks'
import { DashboardLayout } from '@scf/core/components/layouts'
import { useRouteScreenTitle } from '@scf/core/hooks/useRouteScreenTitle'
import { AssessmentHeader, AssessmentProgressBar, Card, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useEffect, useMemo, useState } from 'react'
import { Button, Text, Row, Stack } from '@scaffald/ui'
import {
  completedScores,
  countRated,
  draftFromSaved,
  emptyRiasecDraft,
  RIASEC_DIMENSION_COUNT,
  ratedPercent,
  type RiasecDraft,
} from './riasec-draft'

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
  // Every dimension starts unset; only a value the user chose counts (#1173).
  const [scores, setScores] = useState<RiasecDraft>(emptyRiasecDraft)

  useEffect(() => {
    if (status?.scores) {
      setScores(draftFromSaved(status.scores))
    }
  }, [status])

  const saveMutation = useAssessmentSave({
    queryKeys: [['scaffald', 'onet', 'riasec', 'status']],
    successTitle: 'Assessment Complete',
    successMessage: 'Your career interests have been saved!',
    useMutation: useSaveCareerAssessmentMutation,
  })

  const completed = completedScores(scores)

  const handleComplete = () => {
    if (!completed) return
    saveMutation.mutate({ riasec_scores: completed })
  }

  const ratedCount = countRated(scores)
  // The bar follows what is rated on screen, not whether a result was saved
  // before: a retake that loads saved scores is already at 6 of 6 anyway.
  const completionScore = ratedPercent(scores)

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
          disabled={!completed || saveMutation.isPending}
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
            {`${ratedCount} of ${RIASEC_DIMENSION_COUNT} dimensions rated`}
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
