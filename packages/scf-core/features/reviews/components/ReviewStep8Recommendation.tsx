import { ThumbsDown, ThumbsUp } from '@tamagui/lucide-icons'
import { Button, Text, Row, Stack } from '@unicornlove/beyond-ui'

interface ReviewStep8RecommendationProps {
  recommendation: boolean | null
  onChange: (recommendation: boolean) => void
}

export function ReviewStep8Recommendation({
  recommendation,
  onChange,
}: ReviewStep8RecommendationProps) {
  return (
    <Stack gap="$4">
      <Stack gap="$2">
        <Text fontSize="$7" fontWeight="700" color="$color12">
          Final Recommendation
        </Text>
        <Text fontSize="$5" color="$color11">
          Would you recommend working with this person?
        </Text>
      </Stack>

      {/* Recommendation Buttons */}
      <Row gap="$4" justifyContent="center">
        <Button
          size="$6"
          theme={recommendation === true ? 'success' : undefined}
          variant={recommendation === true ? undefined : 'outlined'}
          icon={ThumbsUp}
          onPress={() => onChange(true)}
          flex={1}
          maxWidth={300}
        >
          Yes, Recommend
        </Button>

        <Button
          size="$6"
          theme={recommendation === false ? 'error' : undefined}
          variant={recommendation === false ? undefined : 'outlined'}
          icon={ThumbsDown}
          onPress={() => onChange(false)}
          flex={1}
          maxWidth={300}
        >
          No, Don't Recommend
        </Button>
      </Row>

      {/* Selection Display */}
      {recommendation !== null && (
        <Stack
          gap="$3"
          padding="$4"
          backgroundColor={recommendation ? '$green3' : '$red3'}
          borderRadius="$4"
        >
          <Row gap="$2" alignItems="center" justifyContent="center">
            {recommendation ? (
              <>
                <ThumbsUp size={24} color="$green11" />
                <Text fontSize="$6" fontWeight="700" color="$green11">
                  You recommend this person
                </Text>
              </>
            ) : (
              <>
                <ThumbsDown size={24} color="$red11" />
                <Text fontSize="$6" fontWeight="700" color="$red11">
                  You don't recommend this person
                </Text>
              </>
            )}
          </Row>
          <Row justifyContent="center">
            <Text fontSize="$4" color={recommendation ? '$green11' : '$red11'}>
              {recommendation
                ? 'Based on your positive experience, you would work with them again.'
                : 'Based on your experience, you would not recommend working with them again.'}
            </Text>
          </Row>
        </Stack>
      )}

      {/* Helper Text */}
      <Text fontSize="$3" color="$color10" fontStyle="italic">
        This is your final assessment. Please be honest and fair in your recommendation.
      </Text>
    </Stack>
  )
}
