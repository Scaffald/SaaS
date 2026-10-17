import {
  getCurrentDomain,
  getQuestionIndexInDomain,
  isLastQuestionInDomain,
  QUESTIONS_PER_DOMAIN,
} from '@scf/core/features/ipip-assessment/utils/domainGrouping'
import { ArrowLeft } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import { Button, Heading, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import {
  displayChoices,
  formatIPIPItem,
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
  /** The question on screen changed — the frame's counter follows it. */
  onIndexChange?: (index: number) => void
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
  onIndexChange,
  isLoading = false,
}: IPIPTestStepProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
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

  useEffect(() => {
    onIndexChange?.(currentIndex)
  }, [currentIndex, onIndexChange])

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
        <Text style={{ color: theme === 'light' ? colors.green[700] : colors.green[300] }}>
          ✓ All Questions Complete!
        </Text>
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

  // The answer already given to this item, when the worker has come back
  // to it with Previous.
  const chosenScore = answers.find((a) => a.id === currentQuestion.id)?.score

  // The item as a heading and the scale as a numbered, ruled list running
  // 1 Very inaccurate → 5 Very accurate (#1194). It was a domain banner, a
  // progress bar and a boxed question above five centred outline buttons in
  // reverse order — Very Accurate first — and the frame around it showed
  // progress twice more. The frame owns the counter now.
  return (
    <Stack gap={20}>
      <Heading level={2} serif style={{ color: colors.text[t].primary }}>
        {formatIPIPItem(currentQuestion.text)}
      </Heading>

      <Stack
        accessibilityRole="radiogroup"
        style={{ borderTopWidth: 1, borderTopColor: colors.border[t].default }}
      >
        {displayChoices(currentChoices).map(({ position, label, choice }) => {
          const isChosen = chosenScore === choice.score
          return (
            <Pressable
              key={`${currentQuestion.id}-${position}`}
              onPress={() => handleAnswer(choice)}
              disabled={isLoading}
              accessibilityRole="radio"
              accessibilityState={{ checked: isChosen, disabled: isLoading }}
              accessibilityLabel={`${position}, ${label}`}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 20,
                paddingVertical: 16,
                paddingHorizontal: 6,
                borderBottomWidth: 1,
                borderBottomColor: colors.border[t].default,
                backgroundColor: isChosen
                  ? colors.bg[t].selected
                  : pressed
                    ? colors.bg[t].muted
                    : 'transparent',
                opacity: isLoading ? 0.6 : 1,
              })}
            >
              <Text style={{ width: 16, color: colors.text[t].tertiary }}>{position}</Text>
              <Text
                style={{
                  flex: 1,
                  color: isChosen ? colors.text[t].emphasis : colors.text[t].primary,
                }}
              >
                {label}
              </Text>
            </Pressable>
          )
        })}
      </Stack>

      {currentIndex > 0 && (
        <Row>
          <Button
            size="sm"
            variant="text"
            iconStart={ArrowLeft}
            onPress={handlePrevious}
            disabled={isLoading}
          >
            Previous question
          </Button>
        </Row>
      )}
    </Stack>
  )
}
