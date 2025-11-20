import { ROUTES } from '@app/core/constants/routes'
import { AssessmentWizard } from '@app/core/features/assessments'
import { IPIPTestStep } from '@app/core/features/personality-assessment/components/IPIPTestStep'
import type { IPIPAnswer, IPIPDomain } from '@app/core/features/personality-assessment/lib/ipip'
import { api } from '@app/core/utils/api'
import { useToastController } from '@tamagui/toast'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Button, Text, YStack } from 'tamagui'
import {
  DOMAIN_NAMES,
  getCompletedDomainsCount,
  QUESTIONS_PER_DOMAIN,
} from './utils/domainGrouping'

interface SaveIPIPProgressResult {
  success: boolean
  isComplete: boolean
}

/**
 * IPIPAssessmentWizard - Standalone wizard for IPIP
 */
export function IPIPAssessmentWizard() {
  const router = useRouter()
  const toast = useToastController()
  const [completedDomain, setCompletedDomain] = useState<IPIPDomain | null>(null)

  const { data: status, isLoading, error } = api.personalityAssessment.getIPIPStatus.useQuery()
  const { data: assessment } = api.personalityAssessment.getAssessmentStatus.useQuery()
  const utils = api.useUtils()

  const saveMutation = api.personalityAssessment.saveIPIPProgress.useMutation({
    onSuccess: (result: SaveIPIPProgressResult) => {
      // Invalidate status queries to update drawer checkmarks
      utils.personalityAssessment.getIPIPStatus.invalidate()
      utils.personalityAssessment.getAssessmentStatus.invalidate()
      if (result.isComplete) {
        toast.show('Questions Complete', {
          message: 'Your personality assessment has been saved!',
        })
        router.push(ROUTES.DASHBOARD.path)
      }
    },
    onError: (error: { message?: string }) => {
      // Enhanced error handling with retry option
      const errorMessage =
        error.message ||
        'Failed to save progress. Your answers are saved locally and will be synced when connection is restored.'
      toast.show('Save Error', {
        message: errorMessage,
        type: 'error',
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
    toast.show('Domain Complete!', {
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

  // Show domain completion UI
  if (completedDomain) {
    return (
      <AssessmentWizard
        description="Answer 120 questions to discover your personality traits."
        steps={[{ id: 'questions', label: 'Questions', order: 1 }]}
        currentStep="questions"
        completionScore={completionScore}
        isLoading={isLoading}
        error={error}
        showNext={false}
      >
        <YStack
          gap="$6"
          width="100%"
          items="center"
          p="$8"
          style={{ maxWidth: 800, alignSelf: 'center' }}
        >
          <YStack gap="$4" items="center">
            <Text fontSize="$9" fontWeight="bold" color="$green10">
              ✓ {DOMAIN_NAMES[completedDomain]} Complete!
            </Text>
            <Text fontSize="$5" color="$color11" text="center">
              You've completed {completedDomains} of 5 domains
            </Text>
            <Text fontSize="$4" color="$color10" text="center">
              Great progress! You're {Math.round((completedDomains / 5) * 100)}% done with the
              assessment.
            </Text>
          </YStack>

          <YStack gap="$3" width="100%" maxW={400}>
            <Button size="$5" theme="info" onPress={handleContinueToNextDomain}>
              Continue to Next Domain
            </Button>
            <Button size="$4" variant="outlined" onPress={handleTakeBreak}>
              Take a Break
            </Button>
          </YStack>
        </YStack>
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
      error={error}
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
