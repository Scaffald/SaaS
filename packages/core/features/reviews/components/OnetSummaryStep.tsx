import { YStack, H4, Paragraph, TextArea, Text } from 'tamagui'
import { getOnetElement } from '../data/mock-onet-elements'
import type { OnetElementRating } from '../data/mock-onet-elements'

interface OnetSummaryStepProps {
  strengths: OnetElementRating[]
  improvements: OnetElementRating[]
  summary: string
  onSummaryChange: (summary: string) => void
}

export function OnetSummaryStep({
  strengths,
  improvements,
  summary,
  onSummaryChange,
}: OnetSummaryStepProps) {
  return (
    <YStack gap="$4" flex={1}>
      <YStack gap="$2">
        <H4>Review Summary</H4>
        <Paragraph color="$color11" fontSize="$4">
          Write a brief summary of your experience working with this person.
        </Paragraph>
      </YStack>

      {/* Strengths Recap */}
      {strengths.length > 0 && (
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600" color="$green11">
            ✅ Key Strengths ({strengths.length})
          </Text>
          <YStack gap="$1">
            {strengths.slice(0, 5).map((rating) => {
              const element = getOnetElement(rating.elementId)
              return (
                <Text key={rating.elementId} fontSize="$3" color="$color11">
                  • {element?.name} ({rating.rating}/5)
                </Text>
              )
            })}
            {strengths.length > 5 && (
              <Text fontSize="$3" color="$color10" fontStyle="italic">
                + {strengths.length - 5} more strengths
              </Text>
            )}
          </YStack>
        </YStack>
      )}

      {/* Improvements Recap */}
      {improvements.length > 0 && (
        <YStack gap="$2">
          <Text fontSize="$4" fontWeight="600" color="$color">
            🎯 Areas to Improve ({improvements.length})
          </Text>
          <YStack gap="$1">
            {improvements.slice(0, 5).map((rating) => {
              const element = getOnetElement(rating.elementId)
              return (
                <Text key={rating.elementId} fontSize="$3" color="$color11">
                  • {element?.name} ({rating.rating}/5)
                </Text>
              )
            })}
            {improvements.length > 5 && (
              <Text fontSize="$3" color="$color10" fontStyle="italic">
                + {improvements.length - 5} more areas
              </Text>
            )}
          </YStack>
        </YStack>
      )}

      {/* Summary Text Area */}
      <YStack gap="$2">
        <Text fontSize="$4" fontWeight="600">
          Overall Comments
        </Text>
        <TextArea
          value={summary}
          onChangeText={onSummaryChange}
          placeholder="Share your overall thoughts about working with this person..."
          height={150}
          fontSize="$4"
        />
        <Text fontSize="$2" color="$color10">
          {summary.length} / 500 characters
        </Text>
      </YStack>
    </YStack>
  )
}
