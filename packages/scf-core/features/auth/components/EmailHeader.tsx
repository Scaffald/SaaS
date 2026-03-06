import { useTranslation } from '@scf/core/utils/useTranslation'
import { Mail } from 'lucide-react-native'
import { Box, H1, Paragraph, Row, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface EmailHeaderProps {
  email: string
}

export function EmailHeader({ email }: EmailHeaderProps) {
  const { t } = useTranslation()
  const { theme } = useThemeContext()
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'
  const textColor = colors.text[resolvedTheme].primary
  const iconColor = colors.icon[resolvedTheme].default

  return (
    <Box align="center" gap={12} style={{ width: '100%' }}>
      <H1 style={{ fontWeight: '700', fontSize: 24, color: textColor }}>
        {t('auth.verify.title')}
      </H1>

      <Row align="center" justify="center" gap={8}>
        <Mail size={24} color={iconColor} />
        <Paragraph
          style={{
            fontSize: 16,
            fontWeight: '500',
            color: textColor,
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
