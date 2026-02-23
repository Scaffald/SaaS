import { useEffect, useState } from 'react'
import { Button, ProgressBar, Text, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { getChoices, getQuestions, type IPIPAnswer, type IPIPChoice } from '../lib/ipip'

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
  const { theme } = useThemeContext()
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
      const now = Date.now()
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
    <Stack gap={24} width="100%" style={{ maxWidth: 800, alignSelf: 'center' }}>
      {/* Cooldown Timer */}
      <Stack
        gap={16}
        padding="xl"
        style={{
          backgroundColor: colors.bg[theme].muted,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border[theme].subtle,
        }}
      >
        <Stack gap={8} align="center">
          <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
            Cooldown Period
          </Text>
          <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
            Please wait 60 seconds before taking the second color test
          </Text>
          <Text style={{ color: theme === "light" ? colors.blue[700] : colors.blue[300] }}>{formatTime(timeRemaining)}</Text>
        </Stack>
        <ProgressBar value={cooldownProgress} max={100} size="sm">
          <ProgressBar.Indicator animation="quick" />
        </ProgressBar>
      </Stack>

      {/* IPIP Questions Section */}
      <Stack gap={16}>
        <Stack gap={8} align="center">
          <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
            While you wait, answer some personality questions
          </Text>
          <Text style={{ color: colors.text[theme].secondary, textAlign: 'center' }}>
            Progress: {currentIndex} / 120 ({progress}%)
          </Text>
        </Stack>

        {currentQuestion && (
          <Stack
            gap={16}
            padding="md"
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border[theme].default,
            }}
          >
            <Text style={{ color: colors.text[theme].secondary }}>{currentQuestion.text}</Text>

            <Stack gap={12}>
              {currentChoices.map((choice) => (
                <Button
                  key={choice.score}
                  size="md"
                  variant="outline"
                  onPress={() => handleAnswer(choice)}
                  disabled={isLoading}
                  width="100%"
                >
                  {choice.text}
                </Button>
              ))}
            </Stack>
          </Stack>
        )}

        {!currentQuestion && !isCooldownActive && (
          <Stack gap={8} align="center" padding="md">
            <Text style={{ color: theme === "light" ? colors.green[700] : colors.green[300], textAlign: 'center' }}>
              All questions answered! You can continue to the next step.
            </Text>
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
