import { useState, useEffect } from 'react'
import { Button, Text, XStack, YStack, Progress, AnimatePresence } from 'tamagui'
import {
  getQuestions,
  getChoices,
  type IPIPQuestion,
  type IPIPAnswer,
  type IPIPChoice,
  type IPIPDomain,
} from '../lib/ipip'
import {
  getCurrentDomain,
  getQuestionIndexInDomain,
  isLastQuestionInDomain,
  getDomainProgress,
  DOMAIN_NAMES,
  QUESTIONS_PER_DOMAIN,
} from '@app/core/features/ipip-assessment/utils/domainGrouping'

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
      <YStack
        gap="$6"
        width="100%"
        items="center"
        p="$8"
        style={{ maxWidth: 800, alignSelf: 'center' }}
      >
        <Text fontSize="$8" fontWeight="bold" color="$green10">
          ✓ All Questions Complete!
        </Text>
        <Text fontSize="$4" color="$color11" style={{ textAlign: 'center' }}>
          You've answered all 120 questions. Great job!
        </Text>
      </YStack>
    )
  }

  if (!currentQuestion) {
    return (
      <YStack gap="$4" items="center" p="$8">
        <Text fontSize="$5" color="$color11">
          Loading question...
        </Text>
      </YStack>
    )
  }

  return (
    <YStack gap="$6" width="100%" style={{ maxWidth: 800, alignSelf: 'center' }}>
      {/* Domain Header */}
      {currentDomain && (
        <XStack
          gap="$2"
          p="$4"
          bg="$blue2"
          rounded="$4"
          borderWidth={1}
          borderColor="$blue7"
          justify="space-between"
          items="center"
        >
          <YStack gap="$1">
            <Text fontSize="$5" fontWeight="bold" color="$blue11">
              {DOMAIN_NAMES[currentDomain]}
            </Text>
            <Text fontSize="$3" color="$blue10">
              Question {questionIndexInDomain + 1} of {QUESTIONS_PER_DOMAIN} in this domain
            </Text>
          </YStack>
          <AnimatePresence>
            <Text
              key={`domain-progress-${domainProgress}`}
              fontSize="$5"
              fontWeight="600"
              color="$blue11"
              animation="quick"
              enterStyle={{ opacity: 0, scale: 0.8, y: -4 }}
              exitStyle={{ opacity: 0, scale: 0.8, y: -4 }}
              opacity={1}
              scale={1}
              y={0}
            >
              {domainProgress}%
            </Text>
          </AnimatePresence>
        </XStack>
      )}

      {/* Progress Bar */}
      <YStack gap="$2">
        <XStack justify="space-between" items="center">
          <Text fontSize="$4" fontWeight="600" color="$color12">
            Question {currentIndex + 1} of 120
          </Text>
          <Text fontSize="$3" color="$color11">
            {overallProgress}%
          </Text>
        </XStack>
        <Progress value={overallProgress} max={100}>
          <Progress.Indicator animation="bouncy" />
        </Progress>
      </YStack>

      {/* Question */}
      <YStack gap="$4" p="$6" bg="$color2" rounded="$4" borderWidth={1} borderColor="$borderColor">
        <Text
          fontSize="$7"
          fontWeight="bold"
          color="$color12"
          style={{ textAlign: 'center' }}
          lineHeight="$6"
        >
          I {currentQuestion.text.toLowerCase()}
        </Text>
      </YStack>

      {/* Choices */}
      <YStack gap="$3">
        {[...currentChoices].reverse().map((choice) => (
          <Button
            key={`${currentQuestion.id}-${choice.score}`}
            size="$5"
            variant="outlined"
            onPress={() => handleAnswer(choice)}
            disabled={isLoading}
            pressStyle={{ scale: 0.98 }}
            borderColor="$borderColor"
            hoverStyle={{ borderColor: '$blue8', bg: '$blue2' }}
          >
            <Text fontSize="$4" color="$color12" fontWeight="500">
              {choice.text}
            </Text>
          </Button>
        ))}
      </YStack>

      {/* Navigation */}
      <XStack gap="$3" justify="space-between">
        <Button
          size="$4"
          variant="outlined"
          onPress={handlePrevious}
          disabled={currentIndex === 0 || isLoading}
        >
          Previous
        </Button>
        <Text fontSize="$3" color="$color11" style={{ alignSelf: 'center' }}>
          {answers.length} answers saved
        </Text>
      </XStack>
    </YStack>
  )
}
