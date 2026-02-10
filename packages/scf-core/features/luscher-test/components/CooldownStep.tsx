import { Clock } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Progress, Text, TextArea, Stack } from '@unicornlove/beyond-ui'

export interface CooldownStepProps {
  cooldownEndTime: string // ISO timestamp when cooldown ends
  onCooldownComplete: () => void
  onSaveDiary?: (response: string) => void
  isLoading?: boolean
}

const COOLDOWN_DURATION = 60 // 60 seconds

// Diary prompts (randomly selected)
const DIARY_PROMPTS = [
  'What kind of work are you focused on today?',
  "How's your energy level — light, steady, or heavy?",
  "What's something you'd like to make progress on?",
  'Pick one: creating • fixing • organizing • connecting.',
  'If today had a color, which one would it be?',
]

/**
 * CooldownStep - 60-second cooldown with optional diary prompt
 * Shows breathing animation/progress ring and optional textarea for diary entry
 */
export function CooldownStep({
  cooldownEndTime,
  onCooldownComplete,
  onSaveDiary,
  isLoading = false,
}: CooldownStepProps) {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isCooldownActive, setIsCooldownActive] = useState(true)
  const [diaryResponse, setDiaryResponse] = useState('')
  const [selectedPrompt] = useState(
    () => DIARY_PROMPTS[Math.floor(Math.random() * DIARY_PROMPTS.length)]
  )

  useEffect(() => {
    // Calculate time remaining
    const updateTimer = () => {
      const now = Date.now()
      const endTime = new Date(cooldownEndTime).getTime()
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000))

      setTimeRemaining(remaining)

      if (remaining <= 0 && isCooldownActive) {
        setIsCooldownActive(false)
        // Save diary response if provided
        if (diaryResponse.trim() && onSaveDiary) {
          onSaveDiary(diaryResponse.trim())
        }
        // Small delay to ensure UI updates
        setTimeout(() => {
          onCooldownComplete()
        }, 100)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [cooldownEndTime, isCooldownActive, diaryResponse, onCooldownComplete, onSaveDiary])

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
    <Stack gap="$6" width="100%" alignSelf="center" padding="$4" style={{ maxWidth: 800 }}>
      {/* Cooldown Timer */}
      <Stack
        gap="$4"
        padding="$6"
        backgroundColor="$color3"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$color7"
      >
        <Stack gap="$2" alignItems="center">
          <Clock size={48} color="$blue10" />
          <Text fontSize="$6" fontWeight="600" color="$color12">
            Take a short pause
          </Text>
          <Text fontSize="$4" color="$color11">
            Please wait 60 seconds before taking the second color test
          </Text>
          <Text fontSize="$10" fontWeight="bold" color="$blue10">
            {formatTime(timeRemaining)}
          </Text>
        </Stack>
        <Progress value={cooldownProgress} max={100} size="$2">
          <Progress.Indicator animation="quick" />
        </Progress>
      </Stack>

      {/* Diary Prompt Section */}
      <Stack gap="$4" padding="$4" borderRadius="$4" borderWidth={1} borderColor="$borderColor">
        <Stack gap="$2">
          <Text fontSize="$5" fontWeight="600" color="$color12">
            {selectedPrompt}
          </Text>
          <Text fontSize="$3" color="$color11">
            Take a breather for 60 seconds or write for 60 seconds if you want (optional)
          </Text>
        </Stack>

        <TextArea
          placeholder="Write your thoughts here (optional)..."
          value={diaryResponse}
          onChangeText={setDiaryResponse}
          disabled={isLoading || !isCooldownActive}
          style={{ minHeight: 120 }}
          maxLength={500}
          fontSize="$4"
        />
      </Stack>
    </Stack>
  )
}
