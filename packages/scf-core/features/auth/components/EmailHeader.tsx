import { useTranslation } from '@scf/core/utils/useTranslation'
import { Mail } from 'lucide-react-native'
import { Box, H1, Paragraph, Row } from '@unicornlove/beyond-ui'
import { colors } from '@unicornlove/beyond-ui/tokens'

interface EmailHeaderProps {
  email: string
}

export function EmailHeader({ email }: EmailHeaderProps) {
  const { t } = useTranslation()

  return (
    <Box align="center" gap={12} style={{ width: '100%' }}>
      <H1 style={{ fontWeight: '700', fontSize: 24, color: colors.gray[900] }}>
        {t('auth.verify.title')}
      </H1>

      <Row align="center" justify="center" gap={8}>
        <Mail size="lg" color={colors.gray[900]} />
        <Paragraph
          style={{
            fontSize: 16,
            fontWeight: '500',
            color: colors.gray[900],
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
