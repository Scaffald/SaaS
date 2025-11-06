import { useState, useEffect } from 'react'
import { Button, Text, YStack, XStack, Spinner } from 'tamagui'
import { getScore, getResults, type IPIPScores } from '../lib/ipip'
import type { IPIPAnswer } from '../lib/ipip'

export interface ResultsStepProps {
  assessment: {
    luscher1_choices?: number[]
    luscher2_choices?: number[]
    luscher2_results?: string | null
    ipip_answers?: IPIPAnswer[] | null
    ipip_scores?: IPIPScores | null
    ai_report?: string | null
    ai_report_generated_at?: string | null
  }
  onGenerateReport?: (luscherResults: string) => void
  isLoading?: boolean
  isReadOnly?: boolean
}

/**
 * ResultsStep - Displays personality assessment results
 * Shows IPIP scores and AI-generated report from Luscher tests
 */
export function ResultsStep({
  assessment,
  onGenerateReport,
  isLoading = false,
  isReadOnly = false,
}: ResultsStepProps) {
  const [ipipScores, setIpipScores] = useState<IPIPScores | null>(
    assessment.ipip_scores as IPIPScores | null
  )
  const [generatingReport, setGeneratingReport] = useState(false)

  useEffect(() => {
    // Calculate IPIP scores if not already calculated
    if (!ipipScores && assessment.ipip_answers && assessment.ipip_answers.length > 0) {
      const scores = getScore({ answers: assessment.ipip_answers as IPIPAnswer[] })
      setIpipScores(scores)
    }
  }, [assessment.ipip_answers, ipipScores])

  const handleGenerateReport = async () => {
    if (!assessment.luscher1_choices || !assessment.luscher2_choices) {
      return
    }

    setGeneratingReport(true)
    try {
      // Generate results on the server side
      // We need to get the raw interpretation first, then send it to OpenAI
      // For now, we'll use a placeholder - the server should handle this
      // The server will use SingleStageTest to generate the interpretation
      const resultsString = JSON.stringify({
        luscher1: assessment.luscher1_choices,
        luscher2: assessment.luscher2_choices,
      })

      onGenerateReport?.(resultsString)
    } catch (error) {
      console.error('Error generating Luscher results:', error)
      setGeneratingReport(false)
    }
  }

  const results = getResults()
  const hasReport = assessment.ai_report && assessment.ai_report.length > 0

  return (
    <YStack gap="$6" maxWidth={900} width="100%" alignSelf="center">
      {/* AI Report Section */}
      {hasReport && (
        <YStack
          gap="$4"
          p="$6"
          bg="$color2"
          rounded="$4"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Personality Report
          </Text>
          <YStack gap="$3">
            {assessment.ai_report?.split('\n').map((line, index) => (
              <Text
                key={`report-line-${index}-${line.slice(0, 10)}`}
                fontSize="$4"
                color="$color11"
                lineHeight="$5"
              >
                {line}
              </Text>
            ))}
          </YStack>
          {assessment.ai_report_generated_at && (
            <Text fontSize="$2" color="$color10" mt="$2">
              Generated on {new Date(assessment.ai_report_generated_at).toLocaleDateString()}
            </Text>
          )}
        </YStack>
      )}

      {/* Generate Report Button */}
      {!hasReport && !isReadOnly && onGenerateReport && (
        <YStack gap="$4" p="$6" bg="$blue2" rounded="$4" borderWidth={1} borderColor="$blue8">
          <Text fontSize="$5" fontWeight="600" color="$blue11">
            Generate Your Personality Report
          </Text>
          <Text fontSize="$3" color="$blue10">
            Based on your color test results, we'll generate a personalized personality report.
          </Text>
          <Button
            size="$4"
            theme="blue"
            onPress={handleGenerateReport}
            disabled={generatingReport || isLoading}
            icon={generatingReport || isLoading ? <Spinner size="small" /> : undefined}
          >
            {generatingReport || isLoading ? 'Generating...' : 'Generate Report'}
          </Button>
        </YStack>
      )}

      {/* IPIP Scores Section */}
      {ipipScores && (
        <YStack gap="$4">
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Personality Traits (Big Five)
          </Text>
          <YStack gap="$4">
            {Object.entries(results).map(([domain, domainResult]) => {
              const domainKey = domain as keyof typeof results
              const score = ipipScores[domainKey]
              if (!score) return null

              return (
                <YStack
                  key={domain}
                  gap="$3"
                  p="$4"
                  bg="$color2"
                  rounded="$4"
                  borderWidth={1}
                  borderColor="$borderColor"
                >
                  <XStack justify="space-between" items="center">
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      {domainResult.title}
                    </Text>
                    <XStack gap="$2" items="center">
                      <Text fontSize="$4" color="$color11">
                        Score: {score.score}
                      </Text>
                      <Text
                        fontSize="$3"
                        fontWeight="600"
                        color={
                          score.result === 'high'
                            ? '$green10'
                            : score.result === 'low'
                              ? '$red10'
                              : '$color10'
                        }
                      >
                        ({score.result})
                      </Text>
                    </XStack>
                  </XStack>
                  <Text fontSize="$3" color="$color11">
                    {domainResult.summary}
                  </Text>
                  <YStack gap="$2" mt="$2">
                    <Text fontSize="$4" fontWeight="600" color="$color12">
                      Your Result:
                    </Text>
                    <Text fontSize="$3" color="$color11" lineHeight="$4">
                      {domainResult.results[score.result].text}
                    </Text>
                  </YStack>
                </YStack>
              )
            })}
          </YStack>
        </YStack>
      )}

      {/* No Results State */}
      {!ipipScores && !hasReport && (
        <YStack gap="$4" items="center" p="$8">
          <Text fontSize="$5" color="$color11" textAlign="center">
            Complete the assessment to see your results.
          </Text>
        </YStack>
      )}
    </YStack>
  )
}
