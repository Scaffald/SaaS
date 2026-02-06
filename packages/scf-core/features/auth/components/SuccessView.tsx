import { useTranslation } from '@scf/core/utils/useTranslation'
import { Box, Paragraph, Spinner, Stack, Text } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

interface SuccessViewProps {
  isVisible: boolean
}

export function SuccessView({ isVisible }: SuccessViewProps) {
  const { t } = useTranslation()

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      align="center"
      justify="center"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: colors.bg.primary,
        opacity: !isVisible ? 0 : 1,
        pointerEvents: !isVisible ? 'none' : 'auto',
        transform: [{ translateX: !isVisible ? 150 : 0 }],
      }}
    >
      {isVisible && (
        <Box flex={1} align="center" justify="space-between" style={{ paddingTop: 24 }}>
          <Stack flex={1} justify="center" align="center" gap={8} style={{ width: '100%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{t('auth.success.title')}</Text>
            <Paragraph style={{ color: colors.gray[700], textAlign: 'center' }}>
              {t('auth.success.description')}
            </Paragraph>
            <Spinner size="large" style={{ marginTop: 24 }} />
          </Stack>
        </Box>
      )}
    </Box>
  )
}
