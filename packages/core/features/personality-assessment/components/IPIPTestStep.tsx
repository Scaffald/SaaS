import { useState, useEffect } from 'react'
import { Button, Text, XStack, YStack, Progress } from 'tamagui'
import {
  getQuestions,
  getChoices,
  type IPIPQuestion,
  type IPIPAnswer,
  type IPIPChoice,
} from '../lib/ipip'

export interface IPIPTestStepProps {
  initialAnswers: IPIPAnswer[]
  currentIndex: number
  language: string
  onSave: (answers: IPIPAnswer[], index: number) => void
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
  isLoading = false,
}: IPIPTestStepProps) {
  const questions = getQuestions()
  const choices = getChoices()
  const [currentIndex, setCurrentIndex] = useState(initialCurrentIndex)
  const [answers, setAnswers] = useState<IPIPAnswer[]>(initialAnswers)

  const currentQuestion = questions[currentIndex]
  const currentChoices = currentQuestion ? choices[currentQuestion.keyed] : []
  const isComplete = currentIndex >= 120
  const progress = Math.round((currentIndex / 120) * 100)

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

    // Auto-save every 10 answers or on completion
    if (newAnswers.length % 10 === 0 || currentIndex === 119) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      onSave(newAnswers, nextIndex)
    } else {
      const nextIndex = currentIndex + 1
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
      {/* Progress Bar */}
      <YStack gap="$2">
        <XStack justify="space-between" items="center">
          <Text fontSize="$4" fontWeight="600" color="$color12">
            Question {currentIndex + 1} of 120
          </Text>
          <Text fontSize="$3" color="$color11">
            {progress}%
          </Text>
        </XStack>
        <Progress value={progress} max={100}>
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
