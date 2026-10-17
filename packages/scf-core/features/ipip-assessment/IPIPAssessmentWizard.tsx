import { ROUTES } from '@scf/core/constants/routes'
import { AssessmentTakingLayout, AssessmentWizard, toError } from '@scf/core/features/assessments'
import { IPIPTestStep } from '@scf/core/features/personality-assessment/components/IPIPTestStep'
import type { IPIPAnswer, IPIPDomain } from '@scf/core/features/personality-assessment/lib/ipip'
import {
  useAssessmentStatus,
  useIPIPStatus,
  useSaveIPIPProgressMutation,
} from '@scf/core/utils/personality-assessment-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Stack, Text, useThemeContext, useToast } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { DOMAIN_NAMES, getCompletedDomainsCount } from './utils/domainGrouping'

const TOTAL_QUESTIONS = 120
const NO_ANSWERS: IPIPAnswer[] = []

const KICKER = 'Work personality — Big Five'
const INSTRUCTION =
  'Describe yourself as you honestly are today — not as you wish to be. There are no right answers.'

/**
 * IPIPAssessmentWizard — the 120-item personality profile.
 *
 * Taking screens are a focused single column: no section tabs, no rail, no
 * title block — a kicker with the counter, the item, the scale, and Save &
 * exit (#1194). Progress used to be shown three times around one question.
 */
export function IPIPAssessmentWizard() {
  const { theme } = useThemeContext()
  const router = useRouter()
  const toast = useToast()
  const [completedDomain, setCompletedDomain] = useState<IPIPDomain | null>(null)

  const { isLoading, error } = useIPIPStatus()
  const { data: assessmentData } = useAssessmentStatus()
  const queryClient = useQueryClient()

  const assessment = (
    assessmentData as
      | {
          data?: {
            ipip_answers?: unknown
            ipip_language?: string
            ipip_current_index?: number | null
          }
        }
      | undefined
  )?.data

  // Stable when the server has no answers yet: IPIPTestStep resets to its
  // initial props whenever they change, so a fresh `[]` on every render
  // would throw the worker back to the saved question each time this
  // re-rendered — and the counter below re-renders it on every answer.
  const savedAnswers = assessment?.ipip_answers as IPIPAnswer[] | undefined
  const initialAnswers = useMemo(() => savedAnswers ?? NO_ANSWERS, [savedAnswers])
  const [questionIndex, setQuestionIndex] = useState(assessment?.ipip_current_index || 0)

  const saveMutation = useSaveIPIPProgressMutation({
    // Every answer saves. This used to toast "Questions Complete" and send
    // the worker to the dashboard on every one of those saves — that is,
    // after the first answer. Only the save that finishes the test does.
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'ipip', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
      if ((variables?.current_index ?? 0) < TOTAL_QUESTIONS) return
      toast.show({
        title: 'Questions complete',
        message: 'Your personality profile has been saved.',
        variant: 'success',
      })
      router.push(ROUTES.ASSESSMENTS.IPIP.RESULTS.path)
    },
    onError: (error: { message?: string }) => {
      const errorMessage =
        error.message ||
        'Failed to save progress. Your answers are saved locally and will be synced when connection is restored.'
      toast.show({
        title: 'Save Error',
        message: errorMessage,
        variant: 'error',
        duration: 5000,
      })
    },
  })

  const handleSave = (answers: IPIPAnswer[], index: number) => {
    saveMutation.mutate({
      answers,
      current_index: index,
      language: assessment?.ipip_language || 'en',
    })
  }

  const handleDomainComplete = (domain: IPIPDomain, _answers: IPIPAnswer[]) => {
    setCompletedDomain(domain)
    toast.show({
      title: 'Domain Complete!',
      message: `+5 XP - ${DOMAIN_NAMES[domain]} complete!`,
      duration: 3000,
    })
  }

  const handleContinueToNextDomain = () => {
    setCompletedDomain(null)
  }

  // Every answer is saved as it is given, so leaving keeps them.
  const handleSaveAndExit = () => {
    router.push(ROUTES.ASSESSMENTS.path)
  }

  const completedDomains = getCompletedDomainsCount(initialAnswers.length)
  const queryError = toError(error)
  const counter =
    questionIndex < TOTAL_QUESTIONS
      ? `Question ${questionIndex + 1} of ${TOTAL_QUESTIONS}`
      : `${TOTAL_QUESTIONS} of ${TOTAL_QUESTIONS} answered`

  const savingNote = (
    <Text style={{ color: colors.text[theme].tertiary }}>
      {saveMutation.isPending ? 'Saving…' : 'Saves as you go'}
    </Text>
  )

  // Domain completion interstitial
  if (completedDomain) {
    return (
      <AssessmentTakingLayout
        kicker={KICKER}
        counter={`${completedDomains} of 5 sections done`}
        onExit={handleSaveAndExit}
        footerEnd={savingNote}
      >
        <Stack gap={12}>
          <Text style={{ color: colors.text[theme].emphasis }}>
            ✓ {DOMAIN_NAMES[completedDomain]} Complete!
          </Text>
          <Text style={{ color: colors.text[theme].secondary }}>
            You've completed {completedDomains} of 5 domains
          </Text>
          <Stack align="flex-start" paddingTop={8}>
            <Button size="md" variant="filled" color="primary" onPress={handleContinueToNextDomain}>
              Continue to Next Domain
            </Button>
          </Stack>
        </Stack>
      </AssessmentTakingLayout>
    )
  }

  return (
    <AssessmentTakingLayout
      kicker={KICKER}
      counter={isLoading || queryError ? undefined : counter}
      instruction={INSTRUCTION}
      onExit={handleSaveAndExit}
      footerEnd={savingNote}
    >
      <AssessmentWizard
        steps={[{ id: 'questions', label: 'Questions', order: 1 }]}
        currentStep="questions"
        isLoading={isLoading}
        error={queryError}
        showNext={false}
        showHeader={false}
      >
        <IPIPTestStep
          initialAnswers={initialAnswers}
          currentIndex={assessment?.ipip_current_index || 0}
          language={assessment?.ipip_language || 'en'}
          onSave={handleSave}
          onDomainComplete={handleDomainComplete}
          onIndexChange={setQuestionIndex}
          isLoading={saveMutation.isPending}
        />
      </AssessmentWizard>
    </AssessmentTakingLayout>
  )
}
