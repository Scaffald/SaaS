import { useState, useEffect } from 'react'
import { Button, Text, XStack, YStack, Progress } from 'tamagui'
import {
  getQuestions,
  getChoices,
  type IPIPQuestion,
  type IPIPAnswer,
  type IPIPChoice,
} from '../lib/ipip'

export interface CooldownStepProps {
  cooldownEndTime: string // ISO timestamp when cooldown ends
  initialAnswers: IPIPAnswer[]
  currentIndex: number
  language: string
  onSave: (answers: IPIPAnswer[], index: number) => void
  onCooldownComplete: () => void
  isLoading?: boolean
}

const COOLDOWN_DURATION = 60 // 60 seconds

/**
 * CooldownStep - Shows IPIP questions during 60-second cooldown between color tests
 */
export function CooldownStep({
  cooldownEndTime,
  initialAnswers,
  currentIndex: initialCurrentIndex,
  language: _language,
  onSave,
  onCooldownComplete,
  isLoading = false,
}: CooldownStepProps) {
  const questions = getQuestions()
  const choices = getChoices()
  const [currentIndex, setCurrentIndex] = useState(initialCurrentIndex)
  const [answers, setAnswers] = useState<IPIPAnswer[]>(initialAnswers)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isCooldownActive, setIsCooldownActive] = useState(true)

  const currentQuestion = questions[currentIndex]
  const currentChoices = currentQuestion ? choices[currentQuestion.keyed] : []
  const progress = Math.round((currentIndex / 120) * 100)

  useEffect(() => {
    // Calculate time remaining
    const updateTimer = () => {
      const now = new Date().getTime()
      const endTime = new Date(cooldownEndTime).getTime()
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000))

      setTimeRemaining(remaining)

      if (remaining <= 0 && isCooldownActive) {
        setIsCooldownActive(false)
        // Small delay to ensure UI updates
        setTimeout(() => {
          onCooldownComplete()
        }, 100)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [cooldownEndTime, isCooldownActive, onCooldownComplete])

  useEffect(() => {
    // Sync with initial values
    setCurrentIndex(initialCurrentIndex)
    setAnswers(initialAnswers)
  }, [initialCurrentIndex, initialAnswers])

  const handleAnswer = (choice: IPIPChoice) => {
    if (!currentQuestion) return // Allow answers during cooldown

    const answer: IPIPAnswer = {
      id: currentQuestion.id,
      domain: currentQuestion.domain,
      facet: Number.parseInt(currentQuestion.facet, 10),
      score: choice.score,
    }

    const newAnswers = [...answers, answer]
    const newIndex = currentIndex + 1

    setAnswers(newAnswers)
    setCurrentIndex(newIndex)

    // Save immediately for progress tracking
    onSave(newAnswers, newIndex)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const cooldownProgress = Math.max(
    0,
    ((COOLDOWN_DURATION - timeRemaining) / COOLDOWN_DURATION) * 100
  )

  return (
    <YStack gap="$6" maxWidth={800} width="100%" alignSelf="center">
      {/* Cooldown Timer */}
      <YStack gap="$4" p="$6" bg="$color3" rounded="$4" borderWidth={1} borderColor="$color7">
        <YStack gap="$2" items="center">
          <Text fontSize="$6" fontWeight="600" color="$color12" textAlign="center">
            Cooldown Period
          </Text>
          <Text fontSize="$4" color="$color11" textAlign="center">
            Please wait 60 seconds before taking the second color test
          </Text>
          <Text fontSize="$8" fontWeight="bold" color="$blue10">
            {formatTime(timeRemaining)}
          </Text>
        </YStack>
        <Progress value={cooldownProgress} max={100} size="$2">
          <Progress.Indicator animation="quick" />
        </Progress>
      </YStack>

      {/* IPIP Questions Section */}
      <YStack gap="$4">
        <YStack gap="$2" items="center">
          <Text fontSize="$5" fontWeight="600" color="$color12" textAlign="center">
            While you wait, answer some personality questions
          </Text>
          <Text fontSize="$3" color="$color11" textAlign="center">
            Progress: {currentIndex} / 120 ({progress}%)
          </Text>
        </YStack>

        {currentQuestion && (
          <YStack gap="$4" p="$4" rounded="$4" borderWidth={1} borderColor="$borderColor">
            <Text fontSize="$5" fontWeight="500" color="$color12">
              {currentQuestion.text}
            </Text>

            <YStack gap="$3">
              {currentChoices.map((choice) => (
                <Button
                  key={choice.score}
                  size="$4"
                  variant="outlined"
                  onPress={() => handleAnswer(choice)}
                  disabled={isLoading}
                  width="100%"
                >
                  <Button.Text>{choice.text}</Button.Text>
                </Button>
              ))}
            </YStack>
          </YStack>
        )}

        {!currentQuestion && !isCooldownActive && (
          <YStack gap="$2" items="center" p="$4">
            <Text fontSize="$4" color="$green10" fontWeight="600" textAlign="center">
              All questions answered! You can continue to the next step.
            </Text>
          </YStack>
        )}
      </YStack>
    </YStack>
  )
}
