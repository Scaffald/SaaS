import {
  AssessmentTakingLayout,
  AssessmentWizard,
  useAssessmentSave,
  toError,
} from '@scf/core/features/assessments'
import { RiasecQuickAssessment } from '@scf/core/features/career-assessment/components/RiasecQuickAssessment'
import { ROUTES } from '@scf/core/constants/routes'
import { useRIASECStatus, useSaveCareerAssessmentMutation } from '@scf/core/utils/onet-sdk-hooks'
import { Button } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  completedScores,
  countRated,
  draftFromSaved,
  emptyRiasecDraft,
  RIASEC_DIMENSION_COUNT,
  type RiasecDraft,
} from './riasec-draft'

/**
 * RIASECAssessmentWizard — Career interests.
 *
 * A focused single column while it is being taken: no section tabs, no
 * rail, no title block (#1194). The rail's dimension guide repeated the
 * descriptions each slider already carries, and its progress card was the
 * second of three progress readouts; the counter on the kicker's hairline
 * is the one left.
 *
 * Ratings are saved only when all six are set — the API takes a complete
 * set — so leaving part-way drops them, and the way out says "Exit", not
 * "Save & exit".
 */
export function RIASECAssessmentWizard() {
  const router = useRouter()
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

  return (
    <AssessmentTakingLayout
      kicker="Career interests — RIASEC"
      counter={`${ratedCount} of ${RIASEC_DIMENSION_COUNT} dimensions rated`}
      onExit={() => router.push(ROUTES.ASSESSMENTS.path)}
      exitLabel="Exit"
      footerEnd={
        <Button
          size="md"
          variant="filled"
          color="primary"
          onPress={handleComplete}
          disabled={!completed || saveMutation.isPending}
        >
          Save results
        </Button>
      }
    >
      <AssessmentWizard
        steps={[{ id: 'interests', label: 'Interest Rating', order: 1 }]}
        currentStep="interests"
        isLoading={isLoading}
        error={toError(error)}
        showNext={false}
        showHeader={false}
      >
        <RiasecQuickAssessment
          value={scores}
          onChange={setScores}
          disabled={saveMutation.isPending}
        />
      </AssessmentWizard>
    </AssessmentTakingLayout>
  )
}
