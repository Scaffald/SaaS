import { ThumbsDown, ThumbsUp } from 'lucide-react-native'
import { Button, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface ReviewStep8RecommendationProps {
  recommendation: boolean | null
  onChange: (recommendation: boolean) => void
}

export function ReviewStep8Recommendation({
  recommendation,
  onChange,
}: ReviewStep8RecommendationProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'

  return (
    <Stack gap={16}>
      <Stack gap={8}>
        <Text style={{ color: colors.text[t].secondary }}>Final Recommendation</Text>
        <Text style={{ color: colors.text[t].secondary }}>Would you recommend working with this person?</Text>
      </Stack>

      {/* Recommendation Buttons */}
      <Row gap={16} justify="center">
        <Button
          size="md"
          color={recommendation === true ? 'success' : 'gray'}
          variant={recommendation === true ? undefined : 'outline'}
          iconStart={ThumbsUp}
          onPress={() => onChange(true)}
          style={{ flex: 1, maxWidth: 300 }}
        >
          Yes, Recommend
        </Button>

        <Button
          size="md"
          color={recommendation === false ? 'error' : 'gray'}
          variant={recommendation === false ? undefined : 'outline'}
          iconStart={ThumbsDown}
          onPress={() => onChange(false)}
          style={{ flex: 1, maxWidth: 300 }}
        >
          No, Don't Recommend
        </Button>
      </Row>

      {/* Selection Display */}
      {recommendation !== null && (
        <Stack
          gap={12}
          padding="md"
          borderRadius={16}
          style={{
            backgroundColor: recommendation
              ? (t === 'dark' ? colors.green[900] : colors.green[50])
              : (t === 'dark' ? colors.error[900] : colors.error[50]),
          }}
        >
          <Row gap={8} align="center" justify="center">
            {recommendation ? (
              <>
                <ThumbsUp size={24} color={t === 'dark' ? colors.green[300] : colors.green[600]} />
                <Text style={{ color: t === 'dark' ? colors.green[300] : colors.green[600] }}>You recommend this person</Text>
              </>
            ) : (
              <>
                <ThumbsDown size={24} color={t === 'dark' ? colors.error[300] : colors.error[600]} />
                <Text style={{ color: t === 'dark' ? colors.error[300] : colors.error[600] }}>You don't recommend this person</Text>
              </>
            )}
          </Row>
          <Row justify="center">
            <Text style={{ color: recommendation ? (t === 'dark' ? colors.green[300] : colors.green[600]) : (t === 'dark' ? colors.error[300] : colors.error[600]) }}>
              {recommendation
                ? 'Based on your positive experience, you would work with them again.'
                : 'Based on your experience, you would not recommend working with them again.'}
            </Text>
          </Row>
        </Stack>
      )}

      {/* Helper Text */}
      <Text style={{ color: colors.text[t].secondary, fontStyle: 'italic' }}>
        This is your final assessment. Please be honest and fair in your recommendation.
      </Text>
    </Stack>
  )
}
