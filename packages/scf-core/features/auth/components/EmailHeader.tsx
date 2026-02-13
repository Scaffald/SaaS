import { useTranslation } from '@scf/core/utils/useTranslation'
import { Mail } from 'lucide-react-native'
import { Box, H1, Paragraph, Row, useThemeContext } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

interface EmailHeaderProps {
  email: string
}

export function EmailHeader({ email }: EmailHeaderProps) {
  const { t } = useTranslation()
  const { theme } = useThemeContext()

  return (
    <Box align="center" gap={12} style={{ width: '100%' }}>
      <H1 style={{ fontWeight: '700', fontSize: 24, color: colors.text[theme].primary }}>
        {t('auth.verify.title')}
      </H1>

      <Row align="center" justify="center" gap={8}>
        <Mail size="lg" color={colors.icon[theme].primary} />
        <Paragraph
          style={{
            fontSize: 16,
            fontWeight: '500',
            color: colors.text[theme].primary,
            maxWidth: '100%',
          }}

          ellipsizeMode="middle"
        >
          {email}
        </Paragraph>
      </Row>

      <Paragraph style={{ textAlign: 'center', fontSize: 14 }}>
        {t('auth.verify.instructions')}
      </Paragraph>
    </Box>
  )
}
