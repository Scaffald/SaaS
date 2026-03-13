import { InterpretationLanguage, type MainColor, TwoStageTest } from 'luscher-test'
import { useCallback, useEffect, useState } from 'react'
import {
  AssessmentHeader,
  Card,
  Skeleton,
  SkeletonText,
  Text,
  Row,
  Stack,
  useThemeContext,
} from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { colorChoices } from '../../personality-assessment/lib/luscher/utils'

export interface ResultsStepProps {
  feedbackMessage?: string
  luscher1Choices?: number[]
  luscher2Choices?: number[]
}

interface InterpretationSection {
  title: string
  body: string
}

interface RoundResult {
  roundLabel: string
  sections: InterpretationSection[]
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

/**
 * Extract the English text from a Translations<T> object.
 * The luscher-test library returns { ENGLISH: value, GERMAN: value, ... }
 */
function extractEnglish(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') return value
  if (Array.isArray(value)) return value

  const obj = value as Record<string, unknown>
  // Check for ENGLISH key (InterpretationLanguage.ENGLISH = "ENGLISH")
  if ('ENGLISH' in obj) return obj.ENGLISH
  return value
}

/**
 * Extract text from an InterpretationText value (string or MinusFunction).
 * MinusFunction has: { physio, physcho, inBrief }
 */
function extractText(value: unknown): string {
  if (typeof value === 'string') return neutralizePronouns(value)
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>
    // MinusFunction: { physio, physcho, inBrief }
    if ('inBrief' in obj && typeof obj.inBrief === 'string') {
      return neutralizePronouns(obj.inBrief)
    }
    // Fallback: join all string values
    const parts = Object.values(obj)
      .filter((v) => typeof v === 'string')
      .map((v) => neutralizePronouns(v as string))
    return parts.join(' ')
  }
  return ''
}

/**
 * Extract sections from a single round's interpretation data.
 */
function extractRoundSections(items: unknown[]): InterpretationSection[] {
  const sections: InterpretationSection[] = []

  for (const item of items) {
    if (!item || typeof item !== 'object') continue

    const obj = item as Record<string, unknown>

    // Extract English title from Translations<string>
    const rawTitle = extractEnglish(obj.title)
    const title = typeof rawTitle === 'string' ? neutralizePronouns(rawTitle) : ''

    // Extract English interpretation texts from LuscherFunction[]
    const bodyParts: string[] = []
    const interpretation = obj.interpretation

    if (Array.isArray(interpretation)) {
      for (const func of interpretation) {
        const englishValue = extractEnglish(func)
        const text = extractText(englishValue)
        if (text.trim()) {
          bodyParts.push(text)
        }
      }
    }

    const body = bodyParts.filter(Boolean).join('\n\n')
    if (title || body) {
      sections.push({ title, body })
    }
  }

  return sections
}

/**
 * Extract structured sections from the luscher-test interpretation result.
 * The result is [InterpretationSection[], InterpretationSection[]] — a tuple of two rounds.
 */
function extractRounds(data: unknown): RoundResult[] {
  if (!Array.isArray(data)) return []

  const rounds: RoundResult[] = []

  // The result is a tuple: [round1Sections[], round2Sections[]]
  if (data.length === 2 && Array.isArray(data[0]) && Array.isArray(data[1])) {
    const round1 = extractRoundSections(data[0])
    const round2 = extractRoundSections(data[1])
    if (round1.length > 0) rounds.push({ roundLabel: 'Initial Impressions', sections: round1 })
    if (round2.length > 0) rounds.push({ roundLabel: 'Deeper Patterns', sections: round2 })
  } else {
    // Fallback: treat as flat array
    const sections = extractRoundSections(data.flat())
    if (sections.length > 0) rounds.push({ roundLabel: '', sections })
  }

  return rounds
}

/**
 * Build color preference order from choices, mapping numeric values to hex colors.
 */
function buildColorOrder(choices: number[]): Array<{ hex: string; key: string }> {
  const allColors = colorChoices()
  return choices
    .map((value) => {
      const color = allColors.find((c) => c.value === value)
      return color ? { hex: color.hex, key: color.key } : null
    })
    .filter(Boolean) as Array<{ hex: string; key: string }>
}

/**
 * ResultsStep - Displays test results with structured cards and color visualization
 */
export function ResultsStep({
  feedbackMessage = "You're showing signs of balanced focus — ideal for steady progress today.",
  luscher1Choices = [],
  luscher2Choices = [],
}: ResultsStepProps) {
  const { theme } = useThemeContext()
  const [rounds, setRounds] = useState<RoundResult[]>([])
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
      const extracted = extractRounds(result)
      setRounds(
        extracted.length > 0
          ? extracted
          : [{ roundLabel: '', sections: [{ title: '', body: 'No interpretation available.' }] }]
      )
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
    if (canViewResults && rounds.length === 0 && !isLoadingInterpretation && !loadError) {
      void loadInterpretation()
    }
  }, [canViewResults, rounds.length, isLoadingInterpretation, loadError, loadInterpretation])

  const colorOrder = canViewResults ? buildColorOrder(luscher2Choices) : []

  return (
    <Stack gap={24} width="100%" padding="md">
        {/* Hero Header */}
        <AssessmentHeader
          category="Results"
          title="Your Weekly Pulse"
          subtitle={feedbackMessage}
          align="center"
        />

        {/* Color Preference Visualization */}
        {colorOrder.length > 0 && (
          <Card variant="outlined" padding="lg" radius="xl">
            <Stack gap={12}>
              <Text
                style={{
                  fontWeight: '600',
                  color: colors.text[theme].primary,
                  fontSize: 14,
                }}
              >
                Color Preference Order
              </Text>
              <Row gap={8} justify="center" wrap>
                {colorOrder.map((color, index) => (
                  <Stack key={color.key} align="center" gap={4}>
                    <Stack
                      width={36}
                      height={36}
                      borderRadius={18}
                      style={{
                        backgroundColor: color.hex,
                        opacity: index < 4 ? 1 : 0.45,
                        borderWidth: index < 4 ? 2 : 0,
                        borderColor: index < 4 ? colors.primary[300] : 'transparent',
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        color: colors.text[theme].tertiary,
                      }}
                    >
                      {index + 1}
                    </Text>
                  </Stack>
                ))}
              </Row>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.text[theme].tertiary,
                  textAlign: 'center',
                }}
              >
                Top 4 preferences highlighted
              </Text>
            </Stack>
          </Card>
        )}

        {/* Loading State */}
        {isLoadingInterpretation && (
          <Card variant="outlined" padding="lg" radius="xl">
            <Stack gap={16}>
              <Skeleton width={180} height={20} shape="text" />
              <SkeletonText lines={4} lastLineWidth="60%" />
            </Stack>
          </Card>
        )}

        {/* Error State */}
        {loadError && (
          <Card variant="outlined" padding="lg" radius="xl">
            <Text style={{ color: colors.error[500] }}>{loadError}</Text>
          </Card>
        )}

        {/* Not Ready State */}
        {!canViewResults && !isLoadingInterpretation && (
          <Card variant="outlined" padding="lg" radius="xl">
            <Text style={{ color: colors.text[theme].secondary }}>
              Results will appear here once both selections are complete.
            </Text>
          </Card>
        )}

        {/* Interpretation Sections by Round */}
        {rounds.length > 0 && !isLoadingInterpretation && !loadError && (
          <Stack gap={24}>
            {rounds.map((round, roundIndex) => (
              <Stack key={round.roundLabel || roundIndex} gap={12}>
                {round.roundLabel ? (
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                      color: colors.primary[500],
                    }}
                  >
                    {round.roundLabel}
                  </Text>
                ) : null}
                {round.sections.map((section, index) => (
                  <Card
                    key={`${round.roundLabel}-${section.title}-${index}`}
                    variant={roundIndex === 0 && index === 0 ? 'elevated' : 'outlined'}
                    padding="lg"
                    radius="xl"
                  >
                    <Stack gap={8}>
                      {section.title ? (
                        <Text
                          style={{
                            fontWeight: '600',
                            fontSize: 15,
                            color: colors.text[theme].primary,
                          }}
                        >
                          {section.title}
                        </Text>
                      ) : null}
                      <Text
                        style={{
                          color: colors.text[theme].secondary,
                          lineHeight: 22,
                          fontSize: 14,
                        }}
                      >
                        {section.body}
                      </Text>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            ))}
          </Stack>
        )}
    </Stack>
  )
}
