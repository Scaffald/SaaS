import { useTranslation } from '@app/core/utils/useTranslation'
import { Paragraph, Spinner, Text, View, YStack } from 'tamagui'

interface SuccessViewProps {
  isVisible: boolean
}

export function SuccessView({ isVisible }: SuccessViewProps) {
  const { t } = useTranslation()

  return (
    <View
      position="absolute"
      enterStyle={{ opacity: 0, x: 350 }}
      exitStyle={{ opacity: 0, x: 0 }}
      bg="$background"
      items="center"
      justify="center"
      width="100%"
      height="100%"
      $md={{ width: '100%', p: '$5' }}
      animation="200ms"
      opacity={!isVisible ? 0 : 1}
      style={{ pointerEvents: !isVisible ? 'none' : 'auto' }}
      transform={[{ translateX: !isVisible ? 150 : 0 }]}
    >
      {isVisible && (
        <View
          flex={1}
          height="auto"
          self="center"
          justify="space-between"
          items="center"
          gap="$4"
          pt="$6"
        >
          <YStack flex={1} justify="center" items="center" width="100%" gap="$2">
            <Text fontWeight="bold" fontSize="$6">
              {t('auth.success.title')}
            </Text>

            <Paragraph color="$color10" text="center">
              {t('auth.success.description')}
            </Paragraph>

            {/* Insert loading spinner here */}
            <Spinner size="large" pt="$6" />
          </YStack>
        </View>
      )}
    </View>
  )
}
