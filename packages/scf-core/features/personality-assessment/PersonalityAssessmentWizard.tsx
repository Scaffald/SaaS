import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Button, ScrollView, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { CooldownStep } from './components/CooldownStep'
import { IPIPTestStep } from './components/IPIPTestStep'
import { LuscherTestStep } from './components/LuscherTestStep'
import { ProgressIndicator } from './components/ProgressIndicator'
import { ResultsStep } from './components/ResultsStep'
import { usePersonalityAssessment } from './hooks/usePersonalityAssessment'
import type { IPIPAnswer } from './lib/ipip'
import type { AssessmentStep } from './utils/assessment-steps'
import { getNextStep, getPreviousStep, STEP_INFO } from './utils/assessment-steps'

/**
 * PersonalityAssessmentWizard - Multi-step personality assessment container
 *
 * Features:
 * - Step-by-step wizard navigation
 * - Progress indicator with completion percentage
 * - Auto-save functionality
 * - Resume from last step
 */
export function PersonalityAssessmentWizard() {
  const {
    assessment,
    isLoading,
    error,
    currentStep: dbCurrentStep,
    completionScore,
    saveLuscher1,
    saveIPIPProgress,
    saveLuscher2,
    generateReport,
    updateCurrentStep,
  } = usePersonalityAssessment()

  const [currentStep, setCurrentStep] = useState<AssessmentStep>('luscher1')

  // Sync current step with database
  useEffect(() => {
    if (dbCurrentStep && dbCurrentStep !== 'completed') {
      setCurrentStep(dbCurrentStep)
    }
  }, [dbCurrentStep])

  // Loading state
  if (isLoading) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" gap="$4" padding="$8">
        <Spinner size="large" />
        <Text color="$color11">Loading assessment...</Text>
      </Stack>
    )
  }

  // Error state
  if (error) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" gap="$4" padding="$8">
        <AlertCircle size={48} color="$red10" />
        <Text fontSize="$5" fontWeight="600" color="$red11">
          Error loading assessment
        </Text>
        <Text fontSize="$3" color="$color11" style={{ textAlign: 'center' }}>
          {error.message || 'An unexpected error occurred'}
        </Text>
      </Stack>
    )
  }

  const handleNext = () => {
    const next = getNextStep(currentStep)
    if (next) {
      setCurrentStep(next)
    }
  }

  const handlePrevious = () => {
    const previous = getPreviousStep(currentStep)
    if (previous) {
      setCurrentStep(previous)
    }
  }

  const stepInfo = STEP_INFO[currentStep]
  const canGoNext =
    currentStep !== 'completed' && currentStep !== 'acute' && currentStep !== 'cooldown'
  const canGoPrevious = currentStep !== 'luscher1' && currentStep !== 'cooldown'

  return (
    <Stack flex={1} backgroundColor="$background">
      {/* Header */}
      <Stack
        padding="$4"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        gap="$3"
      >
        <Stack gap="$1">
          <Text fontSize="$7" fontWeight="bold" color="$color12">
            Personality Assessment
          </Text>
          <Text fontSize="$3" color="$color11">
            {stepInfo.description}
          </Text>
        </Stack>

        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} completionScore={completionScore} />
      </Stack>

      {/* Main Content */}
      <ScrollView flex={1}>
        <Stack padding="$4" gap="$4">
          {currentStep === 'luscher1' && (
            <LuscherTestStep
              step="luscher1"
              initialChoices={assessment?.luscher1_choices || []}
              onSave={(choices) => {
                saveLuscher1.mutate(
                  { choices },
                  {
                    onSuccess: () => handleNext(),
                  }
                )
              }}
              isLoading={saveLuscher1.isPending}
            />
          )}

          {currentStep === 'cooldown' && assessment && (
            <CooldownStep
              cooldownEndTime={
                assessment.cooldown_end_time || new Date(Date.now() + 60 * 1000).toISOString()
              }
              initialAnswers={(assessment?.ipip_answers as IPIPAnswer[]) || []}
              currentIndex={assessment?.ipip_current_index || 0}
              language={assessment?.ipip_language || 'en'}
              onSave={(answers, index) => {
                saveIPIPProgress.mutate(
                  {
                    answers,
                    current_index: index,
                    language: assessment?.ipip_language || 'en',
                  },
                  {
                    onSuccess: () => {
                      // Don't auto-advance during cooldown
                    },
                  }
                )
              }}
              onCooldownComplete={() => {
                // When cooldown ends, update database and move to IPIP step
                updateCurrentStep.mutate(
                  { step: 'ipip' },
                  {
                    onSuccess: () => {
                      handleNext()
                    },
                  }
                )
              }}
              isLoading={saveIPIPProgress.isPending}
            />
          )}

          {currentStep === 'ipip' && (
            <IPIPTestStep
              initialAnswers={(assessment?.ipip_answers as IPIPAnswer[]) || []}
              currentIndex={assessment?.ipip_current_index || 0}
              language={assessment?.ipip_language || 'en'}
              onSave={(answers, index) => {
                saveIPIPProgress.mutate(
                  {
                    answers,
                    current_index: index,
                    language: assessment?.ipip_language || 'en',
                  },
                  {
                    onSuccess: (result: { isComplete?: boolean } | undefined) => {
                      if (result?.isComplete) {
                        handleNext()
                      }
                    },
                  }
                )
              }}
              isLoading={saveIPIPProgress.isPending}
            />
          )}

          {currentStep === 'luscher2' && (
            <LuscherTestStep
              step="luscher2"
              initialChoices={assessment?.luscher2_choices || []}
              onSave={(choices, results) => {
                saveLuscher2.mutate(
                  { choices, results },
                  {
                    onSuccess: () => handleNext(),
                  }
                )
              }}
              isLoading={saveLuscher2.isPending}
            />
          )}

          {currentStep === 'acute' && assessment && (
            <ResultsStep
              assessment={assessment}
              onGenerateReport={(luscherResults) => {
                generateReport.mutate(
                  { luscherResults },
                  {
                    onSuccess: () => {
                      setCurrentStep('completed')
                    },
                  }
                )
              }}
              isLoading={generateReport.isPending}
            />
          )}

          {currentStep === 'completed' && (
            <Stack gap="$4" alignItems="center" padding="$8">
              <Text fontSize="$8" fontWeight="bold" color="$green10">
                ✓ Assessment Complete!
              </Text>
              <Text fontSize="$4" color="$color11" style={{ textAlign: 'center' }}>
                Your personality assessment has been completed. You can view your results below.
              </Text>
              {assessment && <ResultsStep assessment={assessment} isReadOnly />}
            </Stack>
          )}
        </Stack>
      </ScrollView>

      {/* Navigation Footer */}
      {currentStep !== 'completed' && (
        <Stack padding="$4" borderTopWidth={1} borderTopColor="$borderColor">
          <Row gap="$3" justifyContent="space-between">
            <Button
              size="$4"
              variant="outlined"
              icon={ChevronLeft}
              onPress={handlePrevious}
              disabled={!canGoPrevious}
            >
              Previous
            </Button>

            {canGoNext && (
              <Button
                size="$4"
                iconAfter={ChevronRight}
                onPress={handleNext}
                disabled={
                  (currentStep === 'luscher1' &&
                    (!assessment?.luscher1_choices || assessment.luscher1_choices.length < 8)) ||
                  (currentStep === 'ipip' &&
                    (!assessment?.ipip_answers ||
                      (assessment.ipip_answers as IPIPAnswer[]).length < 120)) ||
                  (currentStep === 'luscher2' &&
                    (!assessment?.luscher2_choices || assessment.luscher2_choices.length < 8))
                }
              >
                Next
              </Button>
            )}
          </Row>
        </Stack>
      )}
    </Stack>
  )
}
