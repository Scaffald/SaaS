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
    <Stack gap={24} width="100%" style={{ maxWidth: 900, alignSelf: 'center' }}>
      {/* AI Report Section */}
      {hasReport && (
        <Stack
          gap={16}
          padding={24}
          backgroundColor="$color2"
          borderRadius={16}
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Text color="gray">
            Personality Report
          </Text>
          <Stack gap={12}>
            {assessment.ai_report?.split('\n').map((line, index) => (
              <Text
                key={`report-line-${index}-${line.slice(0, 10)}`}
                color="gray"
                lineHeight={20}
              >
                {line}
              </Text>
            ))}
          </Stack>
          {assessment.ai_report_generated_at && (
            <Text color="gray" marginTop={8}>
              Generated on {new Date(assessment.ai_report_generated_at).toLocaleDateString()}
            </Text>
          )}
        </Stack>
      )}

      {/* Generate Report Button */}
      {!hasReport && !isReadOnly && onGenerateReport && (
        <Stack
          gap={16}
          padding={24}
          backgroundColor="$blue2"
          borderRadius={16}
          borderWidth={1}
          borderColor="$blue8"
        >
          <Text color="$blue11">
            Generate Your Personality Report
          </Text>
          <Text color="$blue10">
            Based on your color test results, we'll generate a personalized personality report.
          </Text>
          <Button
            size={16}
            theme="info"
            onPress={handleGenerateReport}
            disabled={generatingReport || isLoading}
            icon={generatingReport || isLoading ? <Spinner size="sm" /> : undefined}
          >
            {generatingReport || isLoading ? 'Generating...' : 'Generate Report'}
          </Button>
        </Stack>
      )}

      {/* IPIP Scores Section */}
      {ipipScores && (
        <Stack gap={16}>
          <Text color="gray">
            Personality Traits (Big Five)
          </Text>
          <Stack gap={16}>
            {Object.entries(results).map(([domain, domainResult]) => {
              const domainKey = domain as keyof typeof results
              const score = ipipScores[domainKey]
              if (!score) return null

              return (
                <Stack
                  key={domain}
                  gap={12}
                  padding={16}
                  backgroundColor="$color2"
                  borderRadius={16}
                  borderWidth={1}
                  borderColor="$borderColor"
                >
                  <Row justify="space-between" align="center">
                    <Text color="gray">
                      {domainResult.title}
                    </Text>
                    <Row gap={8} align="center">
                      <Text color="gray">
                        Score: {score.score}
                      </Text>
                      <Text
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
                  <Text color="gray">
                    {domainResult.summary}
                  </Text>
                  <Stack gap={8} marginTop={8}>
                    <Text color="gray">
                      Your Result:
                    </Text>
                    <Text color="gray" lineHeight={16}>
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
        <Stack gap={16} align="center" padding={32}>
          <Text color="gray" style={{ textAlign: 'center' }}>
            Complete the assessment to see your results.
          </Text>
        </Stack>
      )}
    </Stack>
  )
}
