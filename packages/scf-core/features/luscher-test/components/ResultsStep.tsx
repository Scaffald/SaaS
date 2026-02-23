import { InterpretationLanguage, type MainColor, TwoStageTest } from 'luscher-test'
import { useCallback, useEffect, useState } from 'react'
import { Text, Stack } from '@scaffald/ui'

export interface ResultsStepProps {
  feedbackMessage?: string
  luscher1Choices?: number[]
  luscher2Choices?: number[]
}

const neutralizePronouns = (text: string): string => {
  return text
    .replace(/\bHe\b/g, 'They')
    .replace(/\bhe\b/g, 'they')
    .replace(/\bShe\b/g, 'They')
    .replace(/\bshe\b/g, 'they')
    .replace(/\bHis\b/g, 'Their')
    .replace(/\bhis\b/g, 'their')
    .replace(/\bHer\b/g, 'Their')
    .replace(/\bher\b/g, 'their')
    .replace(/\bHim\b/g, 'Them')
    .replace(/\bhim\b/g, 'them')
    .replace(/\bHers\b/g, 'Theirs')
    .replace(/\bhers\b/g, 'theirs')
    .replace(/\bHimself\b/g, 'Themself')
    .replace(/\bhimself\b/g, 'themself')
    .replace(/\bHerself\b/g, 'Themself')
    .replace(/\bherself\b/g, 'themself')
}

const humanizeKey = (key: string): string =>
  key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

const formatInterpretationValue = (data: unknown, depth = 0, parentKey?: string): string => {
  if (data === null || data === undefined) {
    return ''
  }

  if (Array.isArray(data)) {
    return data
      .map((item) => formatInterpretationValue(item, depth, parentKey))
      .filter(Boolean)
      .join('\n\n')
  }

  if (typeof data === 'string') {
    const neutralValue = neutralizePronouns(data)
    const normalizedParent = parentKey?.toLowerCase()

    if (normalizedParent === 'title') {
      const headingLevel = depth === 0 ? '##' : depth === 1 ? '###' : '####'
      return `${headingLevel} ${neutralValue}`
    }

    if (normalizedParent === 'interpretation') {
      return neutralValue
    }

    if (depth === 0 && parentKey) {
      return `### ${humanizeKey(parentKey)}\n\n${neutralValue}`
    }

    return neutralValue
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data)
  }

  if (typeof data === 'object') {
    let formatted = ''
    const entries = Object.entries(data)

    for (const [key, value] of entries) {
      if (value === null || value === undefined || value === '') {
        continue
      }

      const normalizedKey = key.toLowerCase()

      if (Array.isArray(value) || typeof value === 'object') {
        const formattedBlock = formatInterpretationValue(value, depth + 1, key)
        if (!formattedBlock) {
          continue
        }

        if (normalizedKey !== 'interpretation' && normalizedKey !== 'title') {
          const headingLevel = depth === 0 ? '##' : depth === 1 ? '###' : '####'
          formatted += `${headingLevel} ${humanizeKey(key)}\n\n`
        }

        formatted += `${formattedBlock}\n\n`
        continue
      }

      const formattedValue = formatInterpretationValue(value, depth, key)
      if (!formattedValue) {
        continue
      }

      formatted += `${formattedValue}\n\n`
    }

    return formatted.trim()
  }

  return neutralizePronouns(String(data))
}

const formatInterpretation = (data: unknown): string => formatInterpretationValue(data).trim()

/**
 * ResultsStep - Displays test results inline with gender-neutral language
 */
export function ResultsStep({
  feedbackMessage = "You're showing signs of balanced focus — ideal for steady progress today.",
  luscher1Choices = [],
  luscher2Choices = [],
}: ResultsStepProps) {
  const [interpretation, setInterpretation] = useState<string | null>(null)
  const [isLoadingInterpretation, setIsLoadingInterpretation] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadInterpretation = useCallback(async () => {
    if (
      !luscher1Choices ||
      !luscher2Choices ||
      luscher1Choices.length !== 8 ||
      luscher2Choices.length !== 8
    ) {
      return
    }

    setIsLoadingInterpretation(true)
    setLoadError(null)
    try {
      const test = new TwoStageTest(luscher1Choices as MainColor[], luscher2Choices as MainColor[])
      const lang = InterpretationLanguage.ENGLISH
      const result = await test.getInterpretation(lang)

      // Format the interpretation for display
      const formatted = formatInterpretation(result)

      setInterpretation(formatted || 'No interpretation available.')
    } catch (error) {
      console.error('Error generating interpretation:', error)
      setLoadError('Unable to generate results. Please try again later.')
    } finally {
      setIsLoadingInterpretation(false)
    }
  }, [luscher1Choices, luscher2Choices])

  const canViewResults =
    luscher1Choices &&
    luscher2Choices &&
    luscher1Choices.length === 8 &&
    luscher2Choices.length === 8

  useEffect(() => {
    if (canViewResults && !interpretation && !isLoadingInterpretation && !loadError) {
      void loadInterpretation()
    }
  }, [canViewResults, interpretation, isLoadingInterpretation, loadError, loadInterpretation])

  return (
    <Stack gap={24} width="100%" alignSelf="center" padding="md" style={{ maxWidth: 800 }}>
      {/* Feedback Message */}
      <Stack
        gap={16}
        padding="xl"
        backgroundColor="$color2"
        borderRadius={16}
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Text color="$gray11">Test Complete</Text>
        <Text color="$gray11" style={{ lineHeight: 20 }}>
          {feedbackMessage}
        </Text>
      </Stack>

      {/* Results Content */}
      <Stack
        gap={16}
        padding="xl"
        backgroundColor="$color1"
        borderRadius={16}
        borderWidth={1}
        borderColor="$borderColor"
      >
        {!canViewResults && (
          <Text color="$gray11">Results will appear here once both selections are complete.</Text>
        )}

        {isLoadingInterpretation && <Text color="$gray11">Loading results...</Text>}

        {loadError && <Text color="$red10">{loadError}</Text>}

        {interpretation && !isLoadingInterpretation && !loadError && (
          <Stack gap={12}>
            {interpretation.split('\n\n').map((paragraph, index) => {
              const paragraphKey = `${paragraph.slice(0, 50)}-${index}`

              if (paragraph.startsWith('## ')) {
                return (
                  <Text key={paragraphKey} color="$gray11" style={{ marginTop: index > 0 ? 16 : 0 }}>
                    {paragraph.replace('## ', '')}
                  </Text>
                )
              }
              if (paragraph.startsWith('### ')) {
                return (
                  <Text key={paragraphKey} color="$gray11" style={{ marginTop: index > 0 ? 12 : 0 }}>
                    {paragraph.replace('### ', '')}
                  </Text>
                )
              }
              return (
                <Text key={paragraphKey} color="$gray11" style={{ lineHeight: 20 }}>
                  {paragraph}
                </Text>
              )
            })}
          </Stack>
        )}
      </Stack>
    </Stack>
  )
}
