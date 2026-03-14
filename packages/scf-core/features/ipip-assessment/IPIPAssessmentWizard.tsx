import { ROUTES } from '@scf/core/constants/routes'
import { AssessmentWizard } from '@scf/core/features/assessments'
import { IPIPTestStep } from '@scf/core/features/personality-assessment/components/IPIPTestStep'
import type { IPIPAnswer, IPIPDomain } from '@scf/core/features/personality-assessment/lib/ipip'
import {
  useAssessmentStatus,
  useIPIPStatus,
  useSaveIPIPProgressMutation,
} from '@scf/core/utils/personality-assessment-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Button, Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { DOMAIN_NAMES, getCompletedDomainsCount } from './utils/domainGrouping'

/**
 * IPIPAssessmentWizard - Standalone wizard for IPIP
 */
export function IPIPAssessmentWizard() {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const router = useRouter()
  const toast = useToast()
  const [completedDomain, setCompletedDomain] = useState<IPIPDomain | null>(null)

  const { data: statusData, isLoading, error } = useIPIPStatus()
  const { data: assessmentData } = useAssessmentStatus()
  const queryClient = useQueryClient()

  const status = (statusData as { data?: { progress?: number } } | undefined)?.data
  const assessment = (assessmentData as { data?: { ipip_answers?: unknown; ipip_language?: string; ipip_current_index?: number | null } } | undefined)?.data

  const saveMutation = useSaveIPIPProgressMutation({
    onSuccess: (_data, _variables, _context) => {
      // Invalidate status queries to update drawer checkmarks
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'ipip', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
      toast.show({
        title: 'Questions Complete',
        message: 'Your personality assessment has been saved!',
        variant: 'success',
      })
      router.push(ROUTES.DASHBOARD.path)
    },
    onError: (error: { message?: string }) => {
      // Enhanced error handling with retry option
      const errorMessage =
        error.message ||
        'Failed to save progress. Your answers are saved locally and will be synced when connection is restored.'
      toast.show({
        title: 'Save Error',
        message: errorMessage,
        variant: 'error',
        duration: 5000,
      })
      // Note: Answers are still in local state, user can retry by continuing
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

    // Show XP toast
    toast.show({
      title: 'Domain Complete!',
      message: `+5 XP - ${DOMAIN_NAMES[domain]} complete!`,
      duration: 3000,
    })
  }

  const handleContinueToNextDomain = () => {
    setCompletedDomain(null)
  }

  const handleTakeBreak = () => {
    router.push(ROUTES.DASHBOARD.path)
  }

  const progress = status?.progress || 0
  const answersCount = (assessment?.ipip_answers as IPIPAnswer[])?.length || 0
  const completedDomains = getCompletedDomainsCount(answersCount)
  const completionScore = Math.round((progress / 120) * 100)

  // Convert TRPC error to Error type
  const queryError = error ? new Error(error.message ?? 'Failed to load assessment status.') : null

  // Show domain completion UI
  if (completedDomain) {
    return (
      <AssessmentWizard
        description="Answer 120 questions to discover your personality traits."
        steps={[{ id: 'questions', label: 'Questions', order: 1 }]}
        currentStep="questions"
        completionScore={completionScore}
        isLoading={isLoading}
        error={queryError}
        showNext={false}
      >
        <Stack
          gap={24}
          width="100%"
          align="center"
          padding={32}
          style={{ maxWidth: 800, alignSelf: 'center' }}
        >
          <Stack gap={16} align="center">
            <Text style={{ color: colors.success[500] }}>✓ {DOMAIN_NAMES[completedDomain]} Complete!</Text>
            <Text style={{ color: colors.text[t].secondary, textAlign: 'center' }}>
              You've completed {completedDomains} of 5 domains
            </Text>
            <Text style={{ color: colors.text[t].secondary, textAlign: 'center' }}>
              Great progress! You're {Math.round((completedDomains / 5) * 100)}% done with the
              assessment.
            </Text>
          </Stack>

          <Stack gap={12} width="100%" maxWidth={400}>
            <Button size="lg" color="primary" onPress={handleContinueToNextDomain}>
              Continue to Next Domain
            </Button>
            <Button size="md" variant="outline" onPress={handleTakeBreak}>
              Take a Break
            </Button>
          </Stack>
        </Stack>
      </AssessmentWizard>
    )
  }

  return (
    <AssessmentWizard
      description="Answer 120 questions to discover your personality traits."
      steps={[{ id: 'questions', label: 'Questions', order: 1 }]}
      currentStep="questions"
      completionScore={completionScore}
      isLoading={isLoading}
      error={queryError}
      showNext={false}
    >
      <IPIPTestStep
        initialAnswers={(assessment?.ipip_answers as IPIPAnswer[]) || []}
        currentIndex={assessment?.ipip_current_index || 0}
        language={assessment?.ipip_language || 'en'}
        onSave={handleSave}
        onDomainComplete={handleDomainComplete}
        isLoading={saveMutation.isPending}
      />
    </AssessmentWizard>
  )
}
