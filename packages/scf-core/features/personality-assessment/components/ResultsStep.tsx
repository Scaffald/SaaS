import { InterpretationLanguage, type MainColor, TwoStageTest } from 'luscher-test'
import { useEffect, useState } from 'react'
import { Button, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import type { IPIPAnswer } from '../lib/ipip'
import { getResults, getScore, type IPIPScores } from '../lib/ipip'

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
      // Generate raw interpretation using TwoStageTest
      const test = new TwoStageTest(
        assessment.luscher1_choices as MainColor[],
        assessment.luscher2_choices as MainColor[]
      )
      const lang = InterpretationLanguage.ENGLISH
      const interpretation = await test.getInterpretation(lang)

      // Convert interpretation to JSON string for OpenAI
      const resultsString = JSON.stringify(interpretation)

      onGenerateReport?.(resultsString)
    } catch (error) {
      console.error('Error generating Luscher results:', error)
      setGeneratingReport(false)
    }
  }

  const results = getResults()
  const hasReport = assessment.ai_report && assessment.ai_report.length > 0

  return (
    <Stack gap="$6" width="100%" style={{ maxWidth: 900, alignSelf: 'center' }}>
      {/* AI Report Section */}
      {hasReport && (
        <Stack
          gap="$4"
          padding="$6"
          backgroundColor="$color2"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Personality Report
          </Text>
          <Stack gap="$3">
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
          </Stack>
          {assessment.ai_report_generated_at && (
            <Text fontSize="$2" color="$color10" marginTop="$2">
              Generated on {new Date(assessment.ai_report_generated_at).toLocaleDateString()}
            </Text>
          )}
        </Stack>
      )}

      {/* Generate Report Button */}
      {!hasReport && !isReadOnly && onGenerateReport && (
        <Stack
          gap="$4"
          padding="$6"
          backgroundColor="$blue2"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$blue8"
        >
          <Text fontSize="$5" fontWeight="600" color="$blue11">
            Generate Your Personality Report
          </Text>
          <Text fontSize="$3" color="$blue10">
            Based on your color test results, we'll generate a personalized personality report.
          </Text>
          <Button
            size="$4"
            theme="info"
            onPress={handleGenerateReport}
            disabled={generatingReport || isLoading}
            icon={generatingReport || isLoading ? <Spinner size="small" /> : undefined}
          >
            {generatingReport || isLoading ? 'Generating...' : 'Generate Report'}
          </Button>
        </Stack>
      )}

      {/* IPIP Scores Section */}
      {ipipScores && (
        <Stack gap="$4">
          <Text fontSize="$6" fontWeight="bold" color="$color12">
            Personality Traits (Big Five)
          </Text>
          <Stack gap="$4">
            {Object.entries(results).map(([domain, domainResult]) => {
              const domainKey = domain as keyof typeof results
              const score = ipipScores[domainKey]
              if (!score) return null

              return (
                <Stack
                  key={domain}
                  gap="$3"
                  padding="$4"
                  backgroundColor="$color2"
                  borderRadius="$4"
                  borderWidth={1}
                  borderColor="$borderColor"
                >
                  <Row justifyContent="space-between" alignItems="center">
                    <Text fontSize="$5" fontWeight="600" color="$color12">
                      {domainResult.title}
                    </Text>
                    <Row gap="$2" alignItems="center">
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
                    </Row>
                  </Row>
                  <Text fontSize="$3" color="$color11">
                    {domainResult.summary}
                  </Text>
                  <Stack gap="$2" marginTop="$2">
                    <Text fontSize="$4" fontWeight="600" color="$color12">
                      Your Result:
                    </Text>
                    <Text fontSize="$3" color="$color11" lineHeight="$4">
                      {domainResult.results[score.result].text}
                    </Text>
                  </Stack>
                </Stack>
              )
            })}
          </Stack>
        </Stack>
      )}

      {/* No Results State */}
      {!ipipScores && !hasReport && (
        <Stack gap="$4" alignItems="center" padding="$8">
          <Text fontSize="$5" color="$color11" style={{ textAlign: 'center' }}>
            Complete the assessment to see your results.
          </Text>
        </Stack>
      )}
    </Stack>
  )
}
