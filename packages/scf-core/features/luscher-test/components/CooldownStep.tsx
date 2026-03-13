import { useEffect, useRef, useState } from 'react'
import { Animated, Easing } from 'react-native'
import {
  AssessmentHeader,
  AssessmentProgressBar,
  Card,
  Text,
  TextArea,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
 * CooldownStep - 60-second cooldown with pulsing timer and optional diary prompt
 */
export function CooldownStep({
  cooldownEndTime,
  onCooldownComplete,
  onSaveDiary,
  isLoading = false,
}: CooldownStepProps) {
  const { theme } = useThemeContext()
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isCooldownActive, setIsCooldownActive] = useState(true)
  const [diaryResponse, setDiaryResponse] = useState('')
  const [selectedPrompt] = useState(
    () => DIARY_PROMPTS[Math.floor(Math.random() * DIARY_PROMPTS.length)]
  )

  // Pulsing animation for the timer circle
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [pulseAnim])

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now()
      const endTime = new Date(cooldownEndTime).getTime()
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000))

      setTimeRemaining(remaining)

      if (remaining <= 0 && isCooldownActive) {
        setIsCooldownActive(false)
        if (diaryResponse.trim() && onSaveDiary) {
          onSaveDiary(diaryResponse.trim())
        }
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

  const circleBg = theme === 'dark' ? 'rgba(29, 114, 130, 0.12)' : 'rgba(29, 114, 130, 0.06)'
  const circleBorder = colors.primary[300]

  return (
    <Stack gap={28} width="100%" alignSelf="center" padding="md" style={{ maxWidth: 800 }}>
        <AssessmentHeader
          category="Cooldown"
          title="Take a Short Pause"
          subtitle="Please wait 60 seconds before the second color test."
          align="center"
        />

        {/* Pulsing Circular Timer */}
        <Stack align="center" gap={16}>
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: circleBg,
              borderWidth: 3,
              borderColor: circleBorder,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 36,
                fontWeight: '700',
                color: colors.primary[500],
              }}
            >
              {formatTime(timeRemaining)}
            </Text>
          </Animated.View>

          <AssessmentProgressBar value={cooldownProgress} height={6} />
        </Stack>

        {/* Diary Prompt Section */}
        <Card variant="outlined" padding="lg" radius="xl">
          <Stack gap={12}>
            <Text
              style={{
                fontWeight: '600',
                color: colors.text[theme].primary,
              }}
            >
              {selectedPrompt}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: colors.text[theme].tertiary,
              }}
            >
              Take a breather or jot down a thought (optional)
            </Text>

            <TextArea
              placeholder="Write your thoughts here..."
              value={diaryResponse}
              onChangeText={setDiaryResponse}
              disabled={isLoading || !isCooldownActive}
              style={{ minHeight: 120 }}
              maxLength={500}
            />
          </Stack>
        </Card>
    </Stack>
  )
}
