import { ROUTES } from '@scf/core/constants/routes'
import { AssessmentWizard, toError } from '@scf/core/features/assessments'
import { IPIPTestStep } from '@scf/core/features/personality-assessment/components/IPIPTestStep'
import type { IPIPAnswer, IPIPDomain } from '@scf/core/features/personality-assessment/lib/ipip'
import {
  useAssessmentStatus,
  useIPIPStatus,
  useSaveIPIPProgressMutation,
} from '@scf/core/utils/personality-assessment-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@scf/core/components/layouts'
import {
  AssessmentHeader,
  AssessmentProgressBar,
  Card,
  useToast,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Button, Text, Row, Stack } from '@scaffald/ui'
import { Brain, BarChart3, Clock, Zap, CheckCircle } from 'lucide-react-native'
import {
  DOMAIN_NAMES,
  DOMAIN_ORDER,
  getCompletedDomainsCount,
  QUESTIONS_PER_DOMAIN,
} from './utils/domainGrouping'

const INFO_CARDS = [
  {
    icon: Clock,
    title: '30-40 Minutes',
    description: 'Complete at your own pace across multiple sessions',
  },
  {
    icon: Brain,
    title: '120 Questions',
    description: 'Comprehensive personality assessment across five domains',
  },
  {
    icon: BarChart3,
    title: '5 Personality Domains',
    description: 'Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism',
  },
  {
    icon: Zap,
    title: 'Earn XP',
    description: 'Gain XP for each completed domain and full assessment',
  },
]

/**
 * IPIPAssessmentWizard - Two-column Pulse-style wizard for IPIP
 */
export function IPIPAssessmentWizard() {
  const { theme } = useThemeContext()
  const router = useRouter()
  const toast = useToast()
  const [completedDomain, setCompletedDomain] = useState<IPIPDomain | null>(null)

  const { data: statusData, isLoading, error } = useIPIPStatus()
  const { data: assessmentData } = useAssessmentStatus()
  const queryClient = useQueryClient()

  const status = (statusData as { data?: { progress?: number } } | undefined)?.data
  const assessment = (
    assessmentData as {
      data?: { ipip_answers?: unknown; ipip_language?: string; ipip_current_index?: number | null }
    } | undefined
  )?.data

  const saveMutation = useSaveIPIPProgressMutation({
    onSuccess: (_data, _variables, _context) => {
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

  const handleTakeBreak = () => {
    router.push(ROUTES.DASHBOARD.path)
  }

  const progress = status?.progress || 0
  const answersCount = (assessment?.ipip_answers as IPIPAnswer[])?.length || 0
  const completedDomains = getCompletedDomainsCount(answersCount)
  const completionScore = Math.round((progress / 120) * 100)
  const queryError = toError(error)

  const iconBgColor = useMemo(
    () => (theme === 'dark' ? 'rgba(29, 114, 130, 0.15)' : 'rgba(29, 114, 130, 0.08)'),
    [theme]
  )

  // Domain completion overlay
  if (completedDomain) {
    const wizardContent = (
      <AssessmentWizard
        steps={[{ id: 'questions', label: 'Questions', order: 1 }]}
        currentStep="questions"
        completionScore={completionScore}
        isLoading={isLoading}
        error={queryError}
        showNext={false}
        showHeader={false}
      >
        <Stack padding="md" paddingBottom="xs">
          <AssessmentProgressBar value={completionScore} height={4} />
        </Stack>
        <Stack
          gap={24}
          width="100%"
          align="center"
          padding={32}
          style={{ maxWidth: 800, alignSelf: 'center' }}
        >
          <Stack gap={16} align="center">
            <Text style={{ color: colors.success[500] }}>
              ✓ {DOMAIN_NAMES[completedDomain]} Complete!
            </Text>
            <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
              You've completed {completedDomains} of 5 domains
            </Text>
            <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
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

    return (
      <DashboardLayout
        leftContent={wizardContent}
        rightContent={
          <RailContent
            theme={theme}
            completionScore={completionScore}
            answersCount={answersCount}
            completedDomains={completedDomains}
          />
        }
        breadcrumbItems={[
          { label: 'Assessments', href: '/dashboard/assessments' },
          { label: 'Personality (IPIP)' },
        ]}
      />
    )
  }

  // Main assessment flow
  const wizardContent = (
    <AssessmentWizard
      steps={[{ id: 'questions', label: 'Questions', order: 1 }]}
      currentStep="questions"
      completionScore={completionScore}
      isLoading={isLoading}
      error={queryError}
      showNext={false}
      showHeader={false}
    >
      <Stack padding="md" paddingBottom="xs">
        <AssessmentProgressBar value={completionScore} height={4} />
      </Stack>

      {/* Show intro cards when no progress yet */}
      {answersCount === 0 && !isLoading && (
        <Stack
          gap={28}
          maxWidth={800}
          width="100%"
          padding="md"
          style={{ marginHorizontal: 'auto' }}
        >
          <AssessmentHeader
            category="Personality Assessment"
            title="IPIP Personality Test"
            subtitle="Discover your Big Five personality traits through 120 research-backed questions"
          />
          <Row gap={12} wrap>
            {INFO_CARDS.map((card) => (
              <Stack key={card.title} style={{ flex: 1, minWidth: 200 }}>
                <Card variant="outlined" padding="md" radius="xl">
                  <Stack gap={12}>
                    <Stack
                      width={40}
                      height={40}
                      borderRadius={12}
                      align="center"
                      justify="center"
                      style={{ backgroundColor: iconBgColor }}
                    >
                      <card.icon size={20} color={colors.primary[500]} />
                    </Stack>
                    <Stack gap={4}>
                      <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>
                        {card.title}
                      </Text>
                      <Text
                        style={{ fontSize: 13, color: colors.text[theme].secondary, lineHeight: 18 }}
                      >
                        {card.description}
                      </Text>
                    </Stack>
                  </Stack>
                </Card>
              </Stack>
            ))}
          </Row>
        </Stack>
      )}

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

  return (
    <DashboardLayout
      leftContent={wizardContent}
      rightContent={
        <RailContent
          theme={theme}
          completionScore={completionScore}
          answersCount={answersCount}
          completedDomains={completedDomains}
        />
      }
      breadcrumbItems={[
        { label: 'Assessments', href: '/dashboard/assessments' },
        { label: 'Personality (IPIP)' },
      ]}
    />
  )
}

/** Sidebar rail content for IPIP assessment */
function RailContent({
  theme,
  completionScore,
  answersCount,
  completedDomains,
}: {
  theme: 'light' | 'dark'
  completionScore: number
  answersCount: number
  completedDomains: number
}) {
  return (
    <Stack gap={20} padding="xs">
      <Stack gap={4}>
        <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>
          Personality Assessment
        </Text>
        <Text style={{ fontSize: 13, color: colors.text[theme].secondary, lineHeight: 20 }}>
          120 questions across five personality domains. Take breaks anytime — your progress is
          saved.
        </Text>
      </Stack>

      {/* Progress summary */}
      <Card variant="outlined" padding="md" radius="xl">
        <Stack gap={12}>
          <Text style={{ fontWeight: '600', fontSize: 14, color: colors.text[theme].primary }}>
            Progress
          </Text>
          <AssessmentProgressBar value={completionScore} height={6} />
          <Text style={{ fontSize: 13, color: colors.text[theme].secondary }}>
            {answersCount} of 120 questions answered
          </Text>
        </Stack>
      </Card>

      {/* Domain checklist */}
      <Card variant="outlined" padding="md" radius="xl">
        <Stack gap={12}>
          <Text style={{ fontWeight: '600', fontSize: 14, color: colors.text[theme].primary }}>
            Domains
          </Text>
          {DOMAIN_ORDER.map((domain, index) => {
            const isComplete = index < completedDomains
            const isCurrent = index === completedDomains
            return (
              <Row key={domain} gap={8} align="center">
                <CheckCircle
                  size={16}
                  color={
                    isComplete
                      ? colors.success[500]
                      : isCurrent
                        ? colors.primary[500]
                        : colors.text[theme].tertiary
                  }
                  fill={isComplete ? colors.success[500] : 'transparent'}
                />
                <Text
                  style={{
                    fontSize: 13,
                    color: isComplete
                      ? colors.text[theme].primary
                      : isCurrent
                        ? colors.primary[500]
                        : colors.text[theme].tertiary,
                    fontWeight: isCurrent ? '600' : '400',
                  }}
                >
                  {DOMAIN_NAMES[domain]} ({QUESTIONS_PER_DOMAIN}q)
                </Text>
              </Row>
            )
          })}
        </Stack>
      </Card>
    </Stack>
  )
}
