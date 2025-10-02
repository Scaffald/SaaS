import { H1, Paragraph, View } from 'tamagui'
import { Mail } from '@tamagui/lucide-icons'

interface EmailHeaderProps {
  email: string
}

export function EmailHeader({ email }: EmailHeaderProps) {
  return (
    <View items="center" gap="$3" width="100%">
      <H1 fontWeight="700" fontSize="$7" color="$color12">
        Check your email
      </H1>

      <View flexDirection="row" items="center" justify="center" gap="$2">
        <Mail size="$1" color="$color12" />
        <Paragraph
          size="$3"
          $gtSm={{ size: '$4' }}
          fontWeight="500"
          color="$color12"
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {email}
        </Paragraph>
      </View>

      <Paragraph text="center" size="$2" $gtSm={{ size: '$3' }}>
        Open the link in your email or enter the code below to sign in.
      </Paragraph>
    </View>
  )
}
