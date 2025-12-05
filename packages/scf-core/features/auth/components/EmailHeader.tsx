import { useTranslation } from '@scf/core/utils/useTranslation'
import { Mail } from '@tamagui/lucide-icons'
import { H1, Paragraph, View } from '@unicornlove/ui'

interface EmailHeaderProps {
  email: string
}

export function EmailHeader({ email }: EmailHeaderProps) {
  const { t } = useTranslation()

  return (
    <View alignItems="center" gap="$3" width="100%">
      <H1 fontWeight="700" fontSize="$7" color="$color12">
        {t('auth.verify.title')}
      </H1>

      <View flexDirection="row" alignItems="center" justifyContent="center" gap="$2">
        <Mail size="$1" color="$color12" />
        <Paragraph
          size="$3"
          $md={{ size: '$4' }}
          fontWeight="500"
          color="$color12"
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {email}
        </Paragraph>
      </View>

      <Paragraph textAlign="center" size="$2" $md={{ size: '$3' }}>
        {t('auth.verify.instructions')}
      </Paragraph>
    </View>
  )
}
