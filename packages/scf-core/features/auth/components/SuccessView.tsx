import { useTranslation } from '@scf/core/utils/useTranslation'
import { Paragraph, Spinner, Text, View, YStack } from '@unicornlove/ui'

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
      backgroundColor="$background"
      alignItems="center"
      justifyContent="center"
      width="100%"
      height="100%"
      $md={{ width: '100%', padding: '$5' }}
      animation="200ms"
      opacity={!isVisible ? 0 : 1}
      style={{ pointerEvents: !isVisible ? 'none' : 'auto' }}
      transform={[{ translateX: !isVisible ? 150 : 0 }]}
    >
      {isVisible && (
        <View
          flex={1}
          height="auto"
          alignSelf="center"
          justifyContent="space-between"
          alignItems="center"
          gap="$4"
          paddingTop="$6"
        >
          <YStack flex={1} justifyContent="center" alignItems="center" width="100%" gap="$2">
            <Text fontWeight="bold" fontSize="$6">
              {t('auth.success.title')}
            </Text>

            <Paragraph color="$color10" textAlign="center">
              {t('auth.success.description')}
            </Paragraph>

            {/* Insert loading spinner here */}
            <Spinner size="large" paddingTop="$6" />
          </YStack>
        </View>
      )}
    </View>
  )
}
