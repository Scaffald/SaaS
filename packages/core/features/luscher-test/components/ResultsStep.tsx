import { useState, useEffect } from 'react'
import { Text, YStack, XStack, Button } from 'tamagui'
import { Clock, Award, FileText } from '@tamagui/lucide-icons'
import { TwoStageTest, InterpretationLanguage, type MainColor } from 'luscher-test'
import { ResponsiveModal } from '@app/ui'

export interface ResultsStepProps {
  nextAvailableAt: string | null // ISO timestamp when test will be available again
  xpAwarded?: number // XP points awarded (default 5)
  feedbackMessage?: string // Custom feedback message
  luscher1Choices?: number[] // First color selection choices
  luscher2Choices?: number[] // Second color selection choices
}

/**
 * ResultsStep - Displays test results, XP award, and cooldown countdown
 * Shows when test is completed or when user returns during cooldown
 */
export function ResultsStep({
  nextAvailableAt,
  xpAwarded = 5,
  feedbackMessage = "You're showing signs of balanced focus — ideal for steady progress today.",
  luscher1Choices = [],
  luscher2Choices = [],
}: ResultsStepProps) {
  const [timeUntilAvailable, setTimeUntilAvailable] = useState<{
    days: number
    hours: number
    minutes: number
    isAvailable: boolean
  } | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [interpretation, setInterpretation] = useState<string | null>(null)
  const [isLoadingInterpretation, setIsLoadingInterpretation] = useState(false)

  useEffect(() => {
    if (!nextAvailableAt) {
      setTimeUntilAvailable({ days: 0, hours: 0, minutes: 0, isAvailable: true })
      return
    }

    const updateCountdown = () => {
      const now = new Date().getTime()
      const availableAt = new Date(nextAvailableAt).getTime()
      const diff = availableAt - now

      if (diff <= 0) {
        setTimeUntilAvailable({ days: 0, hours: 0, minutes: 0, isAvailable: true })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      setTimeUntilAvailable({ days, hours, minutes, isAvailable: false })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [nextAvailableAt])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCountdown = () => {
    if (!timeUntilAvailable) return 'Calculating...'
    if (timeUntilAvailable.isAvailable) return 'Available now'

    const parts: string[] = []
    if (timeUntilAvailable.days > 0) {
      parts.push(`${timeUntilAvailable.days} day${timeUntilAvailable.days > 1 ? 's' : ''}`)
    }
    if (timeUntilAvailable.hours > 0) {
      parts.push(`${timeUntilAvailable.hours} hour${timeUntilAvailable.hours > 1 ? 's' : ''}`)
    }
    if (timeUntilAvailable.minutes > 0 && parts.length < 2) {
      parts.push(`${timeUntilAvailable.minutes} minute${timeUntilAvailable.minutes > 1 ? 's' : ''}`)
    }

    return parts.length > 0 ? parts.join(', ') : 'Less than a minute'
  }

  const formatInterpretation = (data: unknown, depth = 0): string => {
    if (data === null || data === undefined) {
      return ''
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data
        .map((item) => {
          if (typeof item === 'string') {
            return item
          }
          if (typeof item === 'object') {
            return formatInterpretation(item, depth)
          }
          return String(item)
        })
        .filter(Boolean)
        .join('\n\n')
    }

    // Handle strings
    if (typeof data === 'string') {
      return data
    }

    // Handle numbers and booleans
    if (typeof data === 'number' || typeof data === 'boolean') {
      return String(data)
    }

    // Handle objects
    if (typeof data === 'object') {
      let formatted = ''
      const entries = Object.entries(data)

      for (const [key, value] of entries) {
        // Skip empty values
        if (value === null || value === undefined || value === '') {
          continue
        }

        // Format the key to be human-readable
        const formattedKey = key
          .replace(/_/g, ' ')
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')

        // Handle different value types
        if (Array.isArray(value)) {
          if (value.length > 0) {
            // Use heading for section keys
            const headingLevel = depth === 0 ? '##' : depth === 1 ? '###' : '####'
            formatted += `${headingLevel} ${formattedKey}\n\n`
            formatted += formatInterpretation(value, depth + 1)
            formatted += '\n\n'
          }
        } else if (typeof value === 'object') {
          // Use heading for section keys
          const headingLevel = depth === 0 ? '##' : depth === 1 ? '###' : '####'
          formatted += `${headingLevel} ${formattedKey}\n\n`
          formatted += formatInterpretation(value, depth + 1)
          formatted += '\n\n'
        } else if (typeof value === 'string' && value.trim()) {
          // Use subheading for simple key-value pairs
          if (depth === 0) {
            formatted += `### ${formattedKey}\n\n`
          }
          formatted += `${value}\n\n`
        }
      }

      return formatted.trim()
    }

    return String(data)
  }

  const handleViewResults = async () => {
    if (
      !luscher1Choices ||
      !luscher2Choices ||
      luscher1Choices.length !== 8 ||
      luscher2Choices.length !== 8
    ) {
      return
    }

    setIsLoadingInterpretation(true)
    try {
      const test = new TwoStageTest(luscher1Choices as MainColor[], luscher2Choices as MainColor[])
      const lang = InterpretationLanguage.ENGLISH
      const result = await test.getInterpretation(lang)

      // Format the interpretation for display
      const formatted = formatInterpretation(result)

      setInterpretation(formatted || 'No interpretation available.')
      setShowResults(true)
    } catch (error) {
      console.error('Error generating interpretation:', error)
      setInterpretation('Unable to generate results. Please try again later.')
      setShowResults(true)
    } finally {
      setIsLoadingInterpretation(false)
    }
  }

  const canViewResults =
    luscher1Choices &&
    luscher2Choices &&
    luscher1Choices.length === 8 &&
    luscher2Choices.length === 8

  return (
    <YStack gap="$6" maxWidth={800} width="100%" alignSelf="center" p="$4">
      {/* Feedback Message */}
      <YStack gap="$4" p="$6" bg="$color2" rounded="$4" borderWidth={1} borderColor="$borderColor">
        <Text fontSize="$6" fontWeight="bold" color="$color12">
          Test Complete
        </Text>
        <Text fontSize="$4" color="$color11" lineHeight="$5">
          {feedbackMessage}
        </Text>
        {canViewResults && (
          <Button
            size="$4"
            themeInverse
            icon={FileText}
            onPress={handleViewResults}
            disabled={isLoadingInterpretation}
            mt="$2"
          >
            <Button.Text>
              {isLoadingInterpretation ? 'Loading Results...' : 'View Results'}
            </Button.Text>
          </Button>
        )}
      </YStack>

      {/* XP Award */}
      {xpAwarded > 0 && (
        <YStack gap="$3" p="$4" bg="$green2" rounded="$4" borderWidth={1} borderColor="$green7">
          <XStack gap="$3" items="center">
            <Award size={24} color="$green10" />
            <Text fontSize="$5" fontWeight="600" color="$green11">
              +{xpAwarded} Frequency XP
            </Text>
          </XStack>
          <Text fontSize="$3" color="$green10">
            You've earned Frequency XP for completing this assessment!
          </Text>
        </YStack>
      )}

      {/* Cooldown Information */}
      <YStack gap="$4" p="$6" bg="$blue2" rounded="$4" borderWidth={1} borderColor="$blue7">
        <XStack gap="$3" items="center">
          <Clock size={24} color="$blue10" />
          <Text fontSize="$5" fontWeight="600" color="$color12">
            Test Availability
          </Text>
        </XStack>
        <YStack gap="$2">
          <Text fontSize="$4" color="$color11">
            This test can be taken once every 7 days.
          </Text>
          {nextAvailableAt && !timeUntilAvailable?.isAvailable && (
            <>
              <Text fontSize="$4" color="$color11" mt="$2">
                You can take the test again on:
              </Text>
              <Text fontSize="$4" fontWeight="600" color="$blue11">
                {formatDate(nextAvailableAt)}
              </Text>
              <Text fontSize="$3" color="$blue10" mt="$2">
                Available in {formatCountdown()}
              </Text>
            </>
          )}
          {timeUntilAvailable?.isAvailable && (
            <Text fontSize="$4" fontWeight="600" color="$green11">
              The test is available now!
            </Text>
          )}
        </YStack>
      </YStack>

      {/* Results Modal */}
      <ResponsiveModal
        open={showResults}
        onOpenChange={setShowResults}
        title="Full Test Results"
        size="large"
        sheetSnapPoints={[85]}
      >
        {interpretation ? (
          <YStack gap="$3">
            {interpretation.split('\n\n').map((paragraph, index) => {
              const paragraphKey = `${paragraph.slice(0, 50)}-${index}`

              if (paragraph.startsWith('## ')) {
                return (
                  <Text
                    key={paragraphKey}
                    fontSize="$6"
                    fontWeight="bold"
                    color="$color12"
                    mt={index > 0 ? '$4' : '$0'}
                  >
                    {paragraph.replace('## ', '')}
                  </Text>
                )
              }
              if (paragraph.startsWith('### ')) {
                return (
                  <Text
                    key={paragraphKey}
                    fontSize="$5"
                    fontWeight="600"
                    color="$color12"
                    mt={index > 0 ? '$3' : '$0'}
                  >
                    {paragraph.replace('### ', '')}
                  </Text>
                )
              }
              return (
                <Text key={paragraphKey} fontSize="$4" color="$color11" lineHeight="$5">
                  {paragraph}
                </Text>
              )
            })}
          </YStack>
        ) : (
          <Text fontSize="$4" color="$color11">
            Loading results...
          </Text>
        )}
      </ResponsiveModal>
    </YStack>
  )
}
