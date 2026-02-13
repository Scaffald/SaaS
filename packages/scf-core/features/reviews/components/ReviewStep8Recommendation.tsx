import { ThumbsDown, ThumbsUp } from 'lucide-react-native'
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
    <Stack gap={16}>
      <Stack gap={8}>
        <Text color="gray">Final Recommendation</Text>
        <Text color="gray">Would you recommend working with this person?</Text>
      </Stack>

      {/* Recommendation Buttons */}
      <Row gap={16} justify="center">
        <Button
          size={24}
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
          size={24}
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
          gap={12}
          padding={16}
          backgroundColor={recommendation ? '$green3' : '$red3'}
          borderRadius={16}
        >
          <Row gap={8} align="center" justify="center">
            {recommendation ? (
              <>
                <ThumbsUp size={24} color="$green11" />
                <Text color="$green11">You recommend this person</Text>
              </>
            ) : (
              <>
                <ThumbsDown size={24} color="$red11" />
                <Text color="$red11">You don't recommend this person</Text>
              </>
            )}
          </Row>
          <Row justify="center">
            <Text color={recommendation ? '$green11' : '$red11'}>
              {recommendation
                ? 'Based on your positive experience, you would work with them again.'
                : 'Based on your experience, you would not recommend working with them again.'}
            </Text>
          </Row>
        </Stack>
      )}

      {/* Helper Text */}
      <Text color="gray" fontStyle="italic">
        This is your final assessment. Please be honest and fair in your recommendation.
      </Text>
    </Stack>
  )
}
