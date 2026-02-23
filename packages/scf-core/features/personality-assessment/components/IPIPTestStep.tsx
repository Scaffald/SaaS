import {
  DOMAIN_NAMES,
  getCurrentDomain,
  getDomainProgress,
  getQuestionIndexInDomain,
  isLastQuestionInDomain,
  QUESTIONS_PER_DOMAIN,
} from '@scf/core/features/ipip-assessment/utils/domainGrouping'
import { useEffect, useState } from 'react'
import { Button, ProgressBar, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  getChoices,
  getQuestions,
  type IPIPAnswer,
  type IPIPChoice,
  type IPIPDomain,
  type IPIPQuestion,
} from '../lib/ipip'

export interface IPIPTestStepProps {
  initialAnswers: IPIPAnswer[]
  currentIndex: number
  language: string
  onSave: (answers: IPIPAnswer[], index: number) => void
  onDomainComplete?: (domain: IPIPDomain, answers: IPIPAnswer[]) => void
  isLoading?: boolean
}

/**
 * IPIPTestStep - 120-question personality test
 * Displays one question at a time with 5 choice options
 */
export function IPIPTestStep({
  initialAnswers,
  currentIndex: initialCurrentIndex,
  language: _language,
  onSave,
  onDomainComplete,
  isLoading = false,
}: IPIPTestStepProps) {
  const { theme } = useThemeContext()
  const allQuestions = getQuestions()
  const choices = getChoices()
  const [currentIndex, setCurrentIndex] = useState(initialCurrentIndex)
  const [answers, setAnswers] = useState<IPIPAnswer[]>(initialAnswers)

  // Reorder questions by domain (A, E, N, C, O) for micro-block delivery
  const questionsByDomain: Record<string, IPIPQuestion[]> = {}
  for (const question of allQuestions) {
    if (!questionsByDomain[question.domain]) {
      questionsByDomain[question.domain] = []
    }
    questionsByDomain[question.domain].push(question)
  }

  // Create ordered array: A (0-23), E (24-47), N (48-71), C (72-95), O (96-119)
  const orderedQuestions: IPIPQuestion[] = []
  const DOMAIN_ORDER: IPIPDomain[] = ['A', 'E', 'N', 'C', 'O']
  for (const domain of DOMAIN_ORDER) {
    const domainQuestions = questionsByDomain[domain] || []
    orderedQuestions.push(...domainQuestions)
  }

  // Get current question from reordered array
  const currentQuestion = orderedQuestions[currentIndex]
  const currentChoices = currentQuestion ? choices[currentQuestion.keyed] : []
  const isComplete = currentIndex >= 120

  // Get current domain and progress
  const currentDomain = getCurrentDomain(currentIndex)
  const questionIndexInDomain = getQuestionIndexInDomain(currentIndex)

  // Calculate progress within current domain
  const answersInDomain = currentDomain
    ? answers.filter((a) => a.domain === currentDomain).length
    : 0
  const domainProgress = currentDomain ? getDomainProgress(answersInDomain) : 0
  const overallProgress = Math.round((currentIndex / 120) * 100)

  useEffect(() => {
    // Sync with initial values
    setCurrentIndex(initialCurrentIndex)
    setAnswers(initialAnswers)
  }, [initialCurrentIndex, initialAnswers])

  const handleAnswer = (choice: IPIPChoice) => {
    if (!currentQuestion) return

    const answer: IPIPAnswer = {
      id: currentQuestion.id,
      domain: currentQuestion.domain,
      facet: Number.parseInt(currentQuestion.facet, 10),
      score: choice.score,
    }

    const newAnswers = [...answers]
    // Update or add answer
    const existingIndex = newAnswers.findIndex((a) => a.id === answer.id)
    if (existingIndex >= 0) {
      newAnswers[existingIndex] = answer
    } else {
      newAnswers.push(answer)
    }

    setAnswers(newAnswers)

    const nextIndex = currentIndex + 1
    const _isDomainComplete = isLastQuestionInDomain(currentIndex) && currentDomain

    // Check if domain is complete (24 questions answered for this domain)
    if (currentDomain && questionIndexInDomain === QUESTIONS_PER_DOMAIN - 1) {
      const domainAnswers = newAnswers.filter((a) => a.domain === currentDomain)
      if (domainAnswers.length >= QUESTIONS_PER_DOMAIN) {
        // Domain complete - trigger callback with domain-specific answers
        onDomainComplete?.(currentDomain, domainAnswers)
        // Still save progress
        setCurrentIndex(nextIndex)
        onSave(newAnswers, nextIndex)
        return
      }
    }

    // Auto-save every 10 answers or on completion
    if (newAnswers.length % 10 === 0 || currentIndex === 119) {
      setCurrentIndex(nextIndex)
      onSave(newAnswers, nextIndex)
    } else {
      setCurrentIndex(nextIndex)
      // Save immediately for progress tracking
      onSave(newAnswers, nextIndex)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      onSave(answers, prevIndex)
    }
  }

  if (isComplete) {
    return (
      <Stack
        gap={24}
        width="100%"
        align="center"
        padding={32}
        style={{ maxWidth: 800, alignSelf: 'center' }}
      >
        <Text style={{ color: theme === 'light' ? colors.green[700] : colors.green[300] }}>✓ All Questions Complete!</Text>
        <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
          You've answered all 120 questions. Great job!
        </Text>
      </Stack>
    )
  }

  if (!currentQuestion) {
    return (
      <Stack gap={16} align="center" padding={32}>
        <Text style={{ color: colors.text[theme].secondary }}>Loading question...</Text>
      </Stack>
    )
  }

  return (
    <Stack gap={24} width="100%" style={{ maxWidth: 800, alignSelf: 'center' }}>
      {/* Domain Header */}
      {currentDomain && (
        <Row
          gap={8}
          padding="md"
          style={{
            backgroundColor: theme === "light" ? colors.blue[50] : colors.blue[900],
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme === "light" ? colors.blue[300] : colors.blue[700],
          }}
          justify="space-between"
          align="center"
        >
          <Stack gap={4}>
            <Text style={{ color: theme === "light" ? colors.blue[700] : colors.blue[300] }}>{DOMAIN_NAMES[currentDomain]}</Text>
            <Text style={{ color: theme === "light" ? colors.blue[700] : colors.blue[300] }}>
              Question {questionIndexInDomain + 1} of {QUESTIONS_PER_DOMAIN} in this domain
            </Text>
          </Stack>
          <Text style={{ color: theme === "light" ? colors.blue[700] : colors.blue[300] }}>{domainProgress}%</Text>
        </Row>
      )}

      {/* Progress Bar */}
      <Stack gap={8}>
        <Row justify="space-between" align="center">
          <Text style={{ color: colors.text[theme].secondary }}>
            Question {currentIndex + 1} of 120
          </Text>
          <Text style={{ color: colors.text[theme].secondary }}>{overallProgress}%</Text>
        </Row>
        <ProgressBar value={overallProgress} showLabel={false} showIndicator={false} showHintMessage={false} />
      </Stack>

      {/* Question */}
      <Stack
        gap={16}
        padding="xl"
        style={{
          backgroundColor: colors.bg[theme].subtle,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border[theme].default,
        }}
      >
        <Text style={{ color: colors.text[theme].secondary, textAlign: 'center', lineHeight: 24 }}>
          I {currentQuestion.text.toLowerCase()}
        </Text>
      </Stack>

      {/* Choices */}
      <Stack gap={12}>
        {[...currentChoices].reverse().map((choice) => (
          <Button
            key={`${currentQuestion.id}-${choice.score}`}
            size="lg"
            variant="outline"
            onPress={() => handleAnswer(choice)}
            disabled={isLoading}
            style={{
              borderColor: colors.border[theme].default,
            }}
          >
            <Text style={{ color: colors.text[theme].secondary }}>{choice.text}</Text>
          </Button>
        ))}
      </Stack>

      {/* Navigation */}
      <Row gap={12} justify="space-between">
        <Button
          size="md"
          variant="outline"
          onPress={handlePrevious}
          disabled={currentIndex === 0 || isLoading}
        >
          Previous
        </Button>
        <Text style={{ color: colors.text[theme].secondary, alignSelf: 'center' }}>
          {answers.length} answers saved
        </Text>
      </Row>
    </Stack>
  )
}
